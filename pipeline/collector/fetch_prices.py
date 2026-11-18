"""Relevé quotidien des prix France <-> Algérie via l'API Data de Travelpayouts.

Usage (depuis pipeline/) :
    python collector/fetch_prices.py            # relève + envoi vers Supabase
    python collector/fetch_prices.py --dry-run  # relève + CSV local, sans Supabase

Variables d'environnement : TRAVELPAYOUTS_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY.

Source : endpoint /aviasales/v3/prices_for_dates (doc officielle :
https://support.travelpayouts.com/hc/en-us/articles/203956163). Les prix viennent
du cache des recherches faites par les utilisateurs d'Aviasales (48 dernières
heures pour cet endpoint), pour 1 adulte. Voir docs/source-donnees.md.
"""
from __future__ import annotations

import argparse
import csv
import logging
import os
import sys
import time
from datetime import date, timedelta
from pathlib import Path

import requests
import yaml
from dotenv import load_dotenv

PIPELINE = Path(__file__).resolve().parents[1]
REPO = PIPELINE.parent
API_URL = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates"

# Colonnes écrites dans la table prices (id et inserted_at sont remplis par Postgres).
COLUMNS = (
    "collected_at", "origin", "destination", "origin_airport", "destination_airport",
    "departure_date", "return_date", "passengers", "airline", "flight_number",
    "transfers", "price_eur", "days_to_departure", "days_to_eid", "source",
)
CONFLICT_KEY = (
    "collected_at", "origin", "destination", "departure_date",
    "return_date", "passengers", "airline", "flight_number",
)

PAGE_LIMIT = 1000        # maximum documenté pour `limit`
MAX_PAGES = 10           # garde-fou : un mois aller simple tient normalement en 1 page
MAX_RETRIES = 4          # essais pour une même page (429, 5xx, coupure réseau)
PAUSE_BETWEEN_CALLS = 0.2  # s ; la limite documentée est 600 requêtes/minute
SUPABASE_BATCH = 500

log = logging.getLogger("collector")


class ApiError(RuntimeError):
    """Erreur renvoyée par l'API Travelpayouts (success=false, 4xx, trop de 429…)."""


# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────
def load_config() -> dict:
    with open(PIPELINE / "collector" / "routes.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_eid_dates() -> list[date]:
    with open(PIPELINE / "data" / "calendar.csv", encoding="utf-8", newline="") as f:
        return [
            date.fromisoformat(row["start_date"])
            for row in csv.DictReader(f)
            if row["event"].startswith("eid_")
        ]


def route_pairs(cfg: dict) -> list[tuple[str, str]]:
    pairs = [(o, d) for o in cfg["origins"] for d in cfg["destinations"]]
    if cfg.get("both_directions"):
        pairs += [(d, o) for o, d in pairs]
    return pairs


def months_in_horizon(today: date, min_days: int, max_days: int) -> list[str]:
    """Mois (YYYY-MM) qui touchent la fenêtre [today+min, today+max]."""
    start, end = today + timedelta(days=min_days), today + timedelta(days=max_days)
    months, cur = [], start.replace(day=1)
    while cur <= end:
        months.append(cur.strftime("%Y-%m"))
        cur = (cur.replace(day=28) + timedelta(days=4)).replace(day=1)
    return months


# ─────────────────────────────────────────────
# Appels API
# ─────────────────────────────────────────────
def _wait_seconds(r: requests.Response, attempt: int) -> float:
    """Délai avant un nouvel essai : en-tête X-Rate-Limit-Reset (doc Travelpayouts)
    ou Retry-After s'il est présent, sinon attente exponentielle 5, 10, 20 s."""
    for header in ("X-Rate-Limit-Reset", "Retry-After"):
        value = r.headers.get(header)
        if value:
            try:
                return min(max(float(value), 1.0), 120.0)
            except ValueError:
                pass
    return 5.0 * 2 ** attempt


def _get_page(session: requests.Session, params: dict, label: str) -> list[dict]:
    last_problem = "aucun essai"
    for attempt in range(MAX_RETRIES):
        try:
            r = session.get(API_URL, params=params, timeout=30)
        except requests.RequestException as exc:
            last_problem = f"réseau : {exc}"
            log.warning("%s : %s (essai %d/%d)", label, last_problem, attempt + 1, MAX_RETRIES)
            time.sleep(5.0 * 2 ** attempt)
            continue

        if r.status_code == 429 or r.status_code >= 500:
            wait = _wait_seconds(r, attempt)
            last_problem = f"HTTP {r.status_code}"
            log.warning("%s : %s, nouvel essai dans %.0f s (essai %d/%d)",
                        label, last_problem, wait, attempt + 1, MAX_RETRIES)
            time.sleep(wait)
            continue
        if r.status_code >= 400:
            raise ApiError(f"HTTP {r.status_code} : {r.text[:200]}")

        try:
            payload = r.json()
        except ValueError as exc:
            raise ApiError(f"réponse illisible (pas du JSON) : {exc}") from exc
        if not isinstance(payload, dict) or not payload.get("success", False):
            error = payload.get("error") if isinstance(payload, dict) else payload
            raise ApiError(f"success=false : {error}")

        currency = payload.get("currency")
        if currency and str(currency).lower() != str(params.get("currency", "")).lower():
            raise ApiError(f"devise inattendue dans la réponse : {currency}")

        data = payload.get("data")
        if isinstance(data, list):
            return [d for d in data if isinstance(d, dict)]
        if not data:          # en cas d'erreur la doc annonce "data": {}
            return []
        raise ApiError(f"champ data inattendu : {type(data).__name__}")
    raise ApiError(f"abandon après {MAX_RETRIES} essais ({last_problem})")


def fetch_month(session: requests.Session, origin: str, dest: str, month: str,
                currency: str, market: str | None = None) -> list[dict]:
    """Toutes les offres aller simple d'un mois, page par page."""
    params = {
        "origin": origin,
        "destination": dest,
        "departure_at": month,       # YYYY-MM : tout le mois
        "one_way": "true",
        "direct": "false",           # false = directs ET avec escale
        "sorting": "price",
        "unique": "false",
        "currency": currency,
        "limit": PAGE_LIMIT,
    }
    if market:
        params["market"] = market
    items: list[dict] = []
    for page in range(1, MAX_PAGES + 1):
        batch = _get_page(session, {**params, "page": page}, f"{origin}-{dest} {month} p{page}")
        items.extend(batch)
        if len(batch) < PAGE_LIMIT:
            break
        time.sleep(PAUSE_BETWEEN_CALLS)
    else:
        log.warning("%s-%s %s : %d pages lues, la suite est ignorée", origin, dest, month, MAX_PAGES)
    return items


# ─────────────────────────────────────────────
# Transformation
# ─────────────────────────────────────────────
def nearest_eid_offset(dep: date, eids: list[date]) -> int | None:
    """Aïd le plus proche - départ, en jours (négatif = départ après l'Aïd)."""
    if not eids:
        return None
    eid = min(eids, key=lambda e: abs((e - dep).days))
    return (eid - dep).days


def _clean_code(value) -> str | None:
    if value is None:
        return None
    text = str(value).strip().upper()
    return text or None


def _parse_day(value) -> date | None:
    """'2027-03-08T07:00:00+01:00' -> 2027-03-08 (date locale du vol, telle que renvoyée)."""
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def to_row(item: dict, origin: str, dest: str, today: date, cfg: dict, eids: list[date]) -> dict | None:
    """Une offre API -> une ligne de la table prices. None si l'offre est inutilisable
    (date ou prix manquant ou invalide) ou hors de l'horizon suivi."""
    dep = _parse_day(item.get("departure_at"))
    if dep is None:
        return None
    try:
        price = round(float(item.get("price")), 2)
    except (TypeError, ValueError):
        return None
    if price <= 0:
        return None
    dtd = (dep - today).days
    h = cfg["horizon_days"]
    if not h["min"] <= dtd <= h["max"]:
        return None
    ret = _parse_day(item.get("return_at"))
    transfers = item.get("transfers")
    flight = item.get("flight_number")
    return {
        "collected_at": today.isoformat(),
        "origin": origin,
        "destination": dest,
        "origin_airport": _clean_code(item.get("origin_airport")),
        "destination_airport": _clean_code(item.get("destination_airport")),
        "departure_date": dep.isoformat(),
        "return_date": ret.isoformat() if ret else None,
        "passengers": cfg.get("passengers", "1A"),
        "airline": _clean_code(item.get("airline")),
        "flight_number": str(flight).strip() or None if flight is not None else None,
        "transfers": int(transfers) if isinstance(transfers, (int, float)) else None,
        "price_eur": price,
        "days_to_departure": dtd,
        "days_to_eid": nearest_eid_offset(dep, eids),
        "source": "travelpayouts",
    }


def dedupe(rows: list[dict]) -> list[dict]:
    """Garde le prix le plus bas par clé d'unicité (Postgres refuse deux fois la même clé dans un upsert)."""
    best: dict[tuple, dict] = {}
    for row in rows:
        key = tuple(row[k] for k in CONFLICT_KEY)
        if key not in best or row["price_eur"] < best[key]["price_eur"]:
            best[key] = row
    return list(best.values())


def collect(token: str, today: date, *, cfg: dict | None = None, eids: list[date] | None = None,
            session: requests.Session | None = None) -> list[dict]:
    cfg = cfg if cfg is not None else load_config()
    eids = eids if eids is not None else load_eid_dates()
    if not eids:
        log.warning("Aucune date d'Aïd dans calendar.csv : days_to_eid restera vide.")
    months = months_in_horizon(today, cfg["horizon_days"]["min"], cfg["horizon_days"]["max"])
    market = cfg.get("market")
    if session is None:
        session = requests.Session()
    session.headers.update({"X-Access-Token": token, "Accept-Encoding": "gzip, deflate"})

    rows, failures, empty = [], [], []
    for origin, dest in route_pairs(cfg):
        for month in months:
            label = f"{origin}-{dest} {month}"
            try:
                items = fetch_month(session, origin, dest, month, cfg["currency"], market)
            except ApiError as exc:
                failures.append(f"{label} : {exc}")
                log.error("%s : échec (%s)", label, exc)
                continue
            kept = [r for r in (to_row(i, origin, dest, today, cfg, eids) for i in items) if r]
            log.info("%s : %d offres reçues, %d gardées (horizon %d-%d j)",
                     label, len(items), len(kept), cfg["horizon_days"]["min"], cfg["horizon_days"]["max"])
            if not items:
                empty.append(label)
            rows.extend(kept)
            time.sleep(PAUSE_BETWEEN_CALLS)

    unique = dedupe(rows)
    log.info("Bilan : %d lignes, %d sans aucune offre, %d échecs, %d prix uniques",
             len(route_pairs(cfg)) * len(months), len(empty), len(failures), len(unique))
    if empty:
        log.info("Sans offre dans le cache : %s", ", ".join(empty))
    if failures and not rows:
        raise SystemExit("Aucun prix relevé : toutes les requêtes ont échoué.")
    return unique


# ─────────────────────────────────────────────
# Sorties
# ─────────────────────────────────────────────
def upsert_supabase(rows: list[dict]) -> None:
    if not rows:
        log.info("Rien à envoyer vers Supabase.")
        return
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_KEY"]
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    endpoint = f"{url}/rest/v1/prices?on_conflict={','.join(CONFLICT_KEY)}"
    for i in range(0, len(rows), SUPABASE_BATCH):
        r = requests.post(endpoint, json=rows[i:i + SUPABASE_BATCH], headers=headers, timeout=60)
        if r.status_code >= 300:
            raise SystemExit(f"Supabase {r.status_code} : {r.text[:500]}")


def write_csv(rows: list[dict], today: date) -> Path:
    out = PIPELINE / "data" / "out" / f"prices_{today.isoformat()}.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(COLUMNS))
        w.writeheader()
        w.writerows(rows)
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="n'écrit pas dans Supabase, seulement un CSV local")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s",
                        datefmt="%H:%M:%S", stream=sys.stdout)

    load_dotenv(REPO / ".env")
    token = os.environ.get("TRAVELPAYOUTS_TOKEN")
    if not token or token == "ton_token":
        raise SystemExit("TRAVELPAYOUTS_TOKEN manquant : remplis le fichier .env à la racine du dépôt.")

    today = date.today()
    rows = collect(token, today)
    path = write_csv(rows, today)
    log.info("%d prix relevés, copie locale : %s", len(rows), path)

    if not args.dry_run:
        upsert_supabase(rows)
        log.info("Envoyé vers Supabase.")


if __name__ == "__main__":
    main()
