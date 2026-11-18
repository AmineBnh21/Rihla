"""Conseil v0 : réserve / surveille / attends, écrit dans la table advice.

Usage (depuis pipeline/) :
    python advisor/rules.py                       # lit Supabase, écrit dans advice
    python advisor/rules.py --dry-run             # lit Supabase, écrit seulement un JSON local
    python advisor/rules.py --from-csv --dry-run  # tout en local (pipeline/data/out/)

Règles, pour chaque (origine France, destination Algérie, période, profil) :
- book  : l'Aïd est dans BOOK_DAYS jours ou moins, ou le meilleur prix du moment
          est <= p25 de l'historique (seulement si l'historique est suffisant) ;
- wait  : l'Aïd est dans plus de WAIT_DAYS jours et le meilleur prix est >= p50,
          seulement si l'historique est suffisant (n_obs >= MIN_OBS) ;
- watch : tous les autres cas.
Les comparaisons se font en prix 1 adulte (le prix famille est proportionnel),
sur les vols directs ; sans direct relevé, sur les vols avec escale (dit dans `reason`).
Le format des colonnes suit CONTRACT.md.

Variables d'environnement : SUPABASE_URL, SUPABASE_SERVICE_KEY.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path

import requests
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent))

import features as ft  # noqa: E402
from family import family_price  # noqa: E402

BOOK_DAYS = 45          # Aïd ou vacances dans 45 jours ou moins : réserve
BOOK_DAYS_MONTH = 21    # hors fêtes et vacances (période « mois ») : départ dans 3 semaines ou moins
WAIT_DAYS = 90          # Aïd dans plus de 90 jours : on peut parfois attendre
MIN_OBS = 10            # en dessous, historique trop court : jamais « wait », pas de « book » sur p25
MIN_SAVING_EUR = 20     # économie minimale pour proposer une option moins chère

PASSENGER_PROFILES = ["1A", "2A2C", "2A3C"]
CONFLICT_KEY = ("computed_at", "origin", "destination", "period", "passengers")


def _when(days: int) -> str:
    if days <= 0:
        return "aujourd'hui"
    if days == 1:
        return "demain"
    return f"dans {days} jours"


HOLIDAY_NAMES = {
    "toussaint": "Les vacances de la Toussaint",
    "noel": "Les vacances de Noël",
    "hiver": "Les vacances d'hiver",
    "printemps": "Les vacances de printemps",
    "ete": "Les vacances d'été",
}


def _soon_reason(f: ft.RouteFeatures, days: int) -> str:
    if f.kind == "holiday":
        name = HOLIDAY_NAMES.get(f.period.rsplit("-", 1)[0], "Les vacances")
        start = "ont commencé" if days <= 0 else f"commencent {_when(days)}"
        return f"{name} {start} : les prix montent souvent fort avant les départs en vacances."
    if f.kind == "month":
        return "Ton départ approche : à moins de trois semaines, les prix montent souvent."
    return f"L'Aïd est {_when(days)} : les prix montent souvent fort à partir de maintenant."


def _far_label(f: ft.RouteFeatures, days: int) -> str:
    if f.kind == "eid":
        return f"L'Aïd est encore loin ({_when(days)})"
    return f"Ton départ est encore loin ({_when(days)})"


def decide(f: ft.RouteFeatures) -> tuple[str, str]:
    """(status, reason) pour une ligne et une période. Le profil ne change pas la décision.

    Pour une période « mois », le délai compte jusqu'au premier jour de départ encore possible.
    """
    best, days = f.best_price, f.days_to_eid
    if f.kind == "month" and f.daily and f.window_start is not None:
        # Mois déjà commencé : on compte jusqu'au premier départ qui a un prix.
        computed_on = f.window_start - timedelta(days=f.days_to_eid)
        days = (min(f.daily) - computed_on).days
    enough = f.n_obs >= MIN_OBS and f.p25 is not None
    book_days = BOOK_DAYS_MONTH if f.kind == "month" else BOOK_DAYS

    if days <= book_days:
        return "book", _soon_reason(f, days)
    if enough and best <= f.p25:
        return "book", ("Le prix est parmi les plus bas qu'on a vus depuis qu'on suit cette ligne : "
                        "c'est un bon moment pour réserver.")
    if days > WAIT_DAYS and best >= f.p50:
        if enough:
            return "wait", (f"{_far_label(f, days)} et le prix est plutôt haut en ce moment : "
                            "tu peux attendre un peu et revenir voir.")
        return "watch", ("On suit cette ligne depuis peu de temps, on n'a pas encore assez de prix pour te dire "
                         "d'attendre : garde un œil dessus.")
    if not enough:
        return "watch", ("On suit cette ligne depuis peu de temps : garde un œil sur le prix, "
                         "on t'en dira plus dans quelques jours.")
    return "watch", "Le prix est dans la moyenne de ce qu'on a vu : surveille-le encore un peu avant de réserver."


def family_calendar(f: ft.RouteFeatures, passengers: str) -> list[dict]:
    return [{"date": d.isoformat(), "price_eur": family_price(p, passengers)} for d, p in sorted(f.daily.items())]


def cheaper_option(f: ft.RouteFeatures, siblings: list[ft.RouteFeatures], passengers: str) -> dict | None:
    """Meilleure économie parmi les autres jours de la fenêtre et les autres aéroports français.

    `siblings` : variables des autres origines, même destination, même période.
    L'économie est calculée en prix famille par rapport à `price_eur` (jour le moins cher de la ligne).
    """
    if not f.daily:
        return None
    own = family_price(f.best_price, passengers)
    candidates = [("day", f.origin, d, p) for d, p in f.daily.items() if d != f.best_date]
    for s in siblings:
        # On ne compare un direct qu'à d'autres directs.
        if s.origin != f.origin and s.destination == f.destination and s.period == f.period                 and (s.direct or not f.direct):
            # Vacances : seulement des dates comprises dans la fenêtre de la zone de la famille.
            candidates += [("airport", s.origin, d, p) for d, p in s.daily.items()
                           if f.window_start is None or f.window_start <= d <= f.window_end]

    best = None
    for kind, origin, dep, p1a in candidates:
        price = family_price(p1a, passengers)
        saving = own - price
        if best is None or saving > best["saving_eur"]:
            best = {"kind": kind, "origin": origin, "destination": f.destination,
                    "departure_date": dep.isoformat(), "price_eur": price, "saving_eur": saving}
    if best is not None and best["saving_eur"] >= MIN_SAVING_EUR:
        return best

    # Aucune option directe moins chère : on propose le vol avec escale s'il fait vraiment économiser.
    if f.stops_best is not None:
        dep, p1a = f.stops_best
        price = family_price(p1a, passengers)
        if own - price >= MIN_SAVING_EUR:
            return {"kind": "stops", "origin": f.origin, "destination": f.destination,
                    "departure_date": dep.isoformat(), "price_eur": price, "saving_eur": own - price}
    return None


def reference(f: ft.RouteFeatures) -> dict:
    r = lambda x: int(round(x)) if x is not None else None  # noqa: E731
    ref = {"p25": r(f.p25), "p50": r(f.p50), "p75": r(f.p75), "n_obs": f.n_obs}
    if f.kind == "eid":
        ref["days_to_eid"] = f.days_to_eid
    else:
        ref["days_to_start"] = f.days_to_eid
    return ref


def build_advice(all_feats: list[ft.RouteFeatures], today: date,
                 profiles: list[str] = PASSENGER_PROFILES) -> list[dict]:
    """Lignes de la table advice. Les lignes sans aucun prix récent sont ignorées."""
    rows = []
    for f in all_feats:
        if not f.daily:
            continue
        status, reason = decide(f)
        if not f.direct:
            reason += " Pas de vol direct repéré pour l'instant : ce prix est avec escale."
        siblings = [s for s in all_feats if s.destination == f.destination and s.period == f.period]
        for pax in profiles:
            rows.append({
                "computed_at": today.isoformat(),
                "origin": f.origin,
                "destination": f.destination,
                "period": f.period,
                "passengers": pax,
                "status": status,
                "reason": reason,
                "price_eur": family_price(f.best_price, pax),
                "cheaper_option": cheaper_option(f, siblings, pax),
                "calendar": family_calendar(f, pax),
                "reference": reference(f),
            })
    return rows


def upsert_supabase(rows: list[dict]) -> None:
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_KEY"]
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    endpoint = f"{url}/rest/v1/advice?on_conflict={','.join(CONFLICT_KEY)}"
    for i in range(0, len(rows), 500):
        r = requests.post(endpoint, json=rows[i:i + 500], headers=headers, timeout=60)
        if r.status_code >= 300:
            raise SystemExit(f"Supabase {r.status_code} : {r.text[:500]}")


def write_json(rows: list[dict], today: date) -> Path:
    out = ft.OUT_DIR / f"advice_{today.isoformat()}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="n'écrit pas dans Supabase, seulement un JSON local")
    parser.add_argument("--from-csv", nargs="?", const=ft.OUT_DIR, type=Path, default=None,
                        help="lit les CSV prices_*.csv (par défaut pipeline/data/out/) au lieu de Supabase")
    parser.add_argument("--date", type=date.fromisoformat, default=date.today(), help="date de calcul (AAAA-MM-JJ)")
    args = parser.parse_args()

    load_dotenv(ft.REPO / ".env")
    today = args.date
    cfg = ft.load_routes()
    periods = ft.all_periods(today)
    df = ft.load_prices(args.from_csv, periods)
    feats = ft.all_features(df, periods, cfg["origins"], cfg["destinations"], today)
    rows = build_advice(feats, today)

    skipped = sum(1 for f in feats if not f.daily)
    for row in rows:
        if row["passengers"] == "1A":
            print(f"{row['period']} {row['origin']}-{row['destination']} : {row['status']} "
                  f"({row['price_eur']} €) - {row['reason']}")
    print(f"{len(rows)} conseils calculés, {skipped} lignes sans prix récent ignorées.")

    if args.dry_run:
        print(f"Copie locale : {write_json(rows, today)}")
        return
    if rows:
        upsert_supabase(rows)
        print("Envoyé vers Supabase.")


if __name__ == "__main__":
    main()
