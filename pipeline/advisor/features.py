"""Variables utilisées par le conseil v0 : prix du jour, percentiles, jours avant l'Aïd.

Usage (depuis pipeline/) :
    python advisor/features.py              # lit les prix dans Supabase
    python advisor/features.py --from-csv   # lit pipeline/data/out/prices_*.csv

Tous les prix ici sont des prix 1 adulte, aller simple France -> Algérie.

Définitions (pour une ligne origin -> destination et une période) :
- fenêtre : départs de J-14 à J+3 autour de l'Aïd (CONTRACT.md) ;
- prix du jour (daily) : pour chaque jour de départ de la fenêtre, le prix le
  plus bas du relevé le plus récent pour ce jour. Un relevé plus vieux que
  MAX_AGE_DAYS est ignoré (prix sans doute périmé), et les jours déjà passés aussi ;
- historique : pour chaque jour de collecte, le prix le plus bas de toute la
  fenêtre ce jour-là (« le meilleur prix qu'on pouvait trouver ce jour-là »).
  p25 / p50 / p75 sont calculés sur cette série et n_obs = nombre de jours de
  collecte. On compare ainsi le meilleur prix d'aujourd'hui à des meilleurs
  prix d'avant, ce qui est comparable ;
- days_to_eid : jours entre la date de calcul et la date de référence de la période
  (l'Aïd, le début des vacances ou le 1er du mois).

Variables d'environnement (mode Supabase) : SUPABASE_URL, SUPABASE_SERVICE_KEY.
"""
from __future__ import annotations

import argparse
import csv
import os
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
import requests
import yaml
from dotenv import load_dotenv

PIPELINE = Path(__file__).resolve().parents[1]
REPO = PIPELINE.parent
OUT_DIR = PIPELINE / "data" / "out"

WINDOW_BEFORE_DAYS = 14     # fenêtre : départs à partir de J-14...
WINDOW_AFTER_DAYS = 3       # ... jusqu'à J+3
MAX_AGE_DAYS = 7            # au-delà, un relevé n'est plus utilisé comme prix du jour
PAGE_SIZE = 1000            # taille de page PostgREST (limite par défaut de Supabase)

PRICE_COLUMNS = ["collected_at", "origin", "destination", "departure_date", "passengers", "price_eur", "transfers"]


HOLIDAY_EVENTS = {          # vacances scolaires françaises suivies -> id de période
    "vacances_toussaint": "toussaint",
    "vacances_noel": "noel",
    "vacances_hiver": "hiver",
    "vacances_printemps": "printemps",
    "vacances_ete": "ete",
}
HOLIDAY_WINDOW_DAYS = 9     # départs suivis : du dernier jour de cours à J+9
SUMMER_WINDOW_DAYS = 42     # l'été, les départs s'étalent sur six semaines
MONTHS_AHEAD = 11           # périodes « mois » : le mois en cours et les 10 suivants


@dataclass(frozen=True)
class Period:
    id: str          # ex. eid-fitr-2027, hiver-2027, mois-2027-01
    anchor: date     # date de référence : l'Aïd, le début des vacances ou le 1er du mois
    start: date      # premier jour de départ de la fenêtre
    end: date        # dernier jour de départ de la fenêtre
    kind: str = "eid"            # eid | holiday | month
    origin: str | None = None    # vacances : la fenêtre dépend de la zone de l'aéroport de départ

    @property
    def eid(self) -> date:       # compatibilité : ancien nom de `anchor`
        return self.anchor


@dataclass
class RouteFeatures:
    origin: str
    destination: str
    period: str
    days_to_eid: int
    daily: dict[date, float] = field(default_factory=dict)   # prix 1A du jour, par date de départ
    p25: float | None = None
    p50: float | None = None
    p75: float | None = None
    n_obs: int = 0
    kind: str = "eid"            # type de période (eid, holiday, month)
    window_start: date | None = None   # fenêtre de départs de la période (pour cette origine)
    window_end: date | None = None
    # True : prix calculés sur les vols directs. False : aucun direct relevé, prix avec escale.
    direct: bool = True
    # Vol avec escale le moins cher (date, prix 1A) quand il bat le meilleur direct.
    stops_best: tuple[date, float] | None = None

    @property
    def best_price(self) -> float | None:
        return min(self.daily.values()) if self.daily else None

    @property
    def best_date(self) -> date | None:
        return min(self.daily, key=self.daily.get) if self.daily else None


# ───────────────────────── configuration ─────────────────────────

def load_routes() -> dict:
    with open(PIPELINE / "collector" / "routes.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def period_id(event: str, eid: date) -> str:
    """'eid_al_fitr' + 2027 -> 'eid-fitr-2027'."""
    name = event.replace("_al_", "_").replace("_", "-")
    return f"{name}-{eid.year}"


def load_periods(path: Path | None = None, zones: dict[str, str] | None = None) -> list[Period]:
    """Périodes tirées de calendar.csv : les Aïd (J-14 à J+3) et les vacances scolaires
    françaises (une période par aéroport de départ, selon sa zone)."""
    path = path or PIPELINE / "data" / "calendar.csv"
    if zones is None:
        zones = load_routes().get("zones") or {}
    periods = []
    with open(path, encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            event = row["event"]
            start = date.fromisoformat(row["start_date"])
            if event.startswith("eid_"):
                periods.append(Period(
                    id=period_id(event, start), anchor=start,
                    start=start - timedelta(days=WINDOW_BEFORE_DAYS),
                    end=start + timedelta(days=WINDOW_AFTER_DAYS), kind="eid",
                ))
            elif event in HOLIDAY_EVENTS and row.get("country") == "FR":
                end_school = date.fromisoformat(row["end_date"])
                span = SUMMER_WINDOW_DAYS if event == "vacances_ete" else HOLIDAY_WINDOW_DAYS
                pid = f"{HOLIDAY_EVENTS[event]}-{start.year}"
                for origin, zone in zones.items():
                    if row.get("zone") in ("", None, zone):
                        periods.append(Period(
                            id=pid, anchor=start, start=start,
                            end=min(start + timedelta(days=span), end_school), kind="holiday", origin=origin,
                        ))
    return sorted(periods, key=lambda p: (p.anchor, p.id, p.origin or ""))


def month_periods(today: date, months: int = MONTHS_AHEAD) -> list[Period]:
    """Une période par mois : le mois en cours et les suivants."""
    out, cur = [], today.replace(day=1)
    for _ in range(months):
        nxt = (cur.replace(day=28) + timedelta(days=4)).replace(day=1)
        out.append(Period(id=f"mois-{cur:%Y-%m}", anchor=cur, start=cur,
                          end=nxt - timedelta(days=1), kind="month"))
        cur = nxt
    return out


def all_periods(today: date) -> list[Period]:
    """Toutes les périodes conseillées : Aïd, vacances scolaires et mois."""
    return load_periods() + month_periods(today)


# ───────────────────────── chargement des prix ─────────────────────────

def normalize(df: pd.DataFrame) -> pd.DataFrame:
    """Types propres : dates en datetime.date, prix en float. Lignes incomplètes retirées."""
    if df.empty:
        return pd.DataFrame(columns=PRICE_COLUMNS)
    df = df.copy()
    if "passengers" not in df.columns:
        df["passengers"] = "1A"
    if "transfers" not in df.columns:
        df["transfers"] = 0        # anciens relevés / tests : considérés comme directs
    df = df[PRICE_COLUMNS].dropna(subset=["collected_at", "origin", "destination", "departure_date", "price_eur"])
    df["collected_at"] = pd.to_datetime(df["collected_at"]).dt.date
    df["departure_date"] = pd.to_datetime(df["departure_date"]).dt.date
    df["price_eur"] = df["price_eur"].astype(float)
    df["origin"] = df["origin"].astype(str)
    df["destination"] = df["destination"].astype(str)
    df["passengers"] = df["passengers"].fillna("1A").astype(str)
    df["transfers"] = pd.to_numeric(df["transfers"], errors="coerce").fillna(0).astype(int)
    return df.reset_index(drop=True)


def load_prices_csv(directory: Path = OUT_DIR) -> pd.DataFrame:
    files = sorted(Path(directory).glob("prices_*.csv"))
    if not files:
        raise SystemExit(f"Aucun fichier prices_*.csv dans {directory}")
    frames = [pd.read_csv(f, dtype={"flight_number": str}) for f in files]
    frames = [f for f in frames if "price_eur" in f.columns]   # CSV vides : colonne 'empty'
    return normalize(pd.concat(frames, ignore_index=True) if frames else pd.DataFrame())


def load_prices_supabase(origins: list[str], destinations: list[str], start: date, end: date) -> pd.DataFrame:
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_KEY"]
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    base = [
        ("select", ",".join(PRICE_COLUMNS)),
        ("passengers", "eq.1A"),
        ("origin", f"in.({','.join(origins)})"),
        ("destination", f"in.({','.join(destinations)})"),
        ("departure_date", f"gte.{start.isoformat()}"),
        ("departure_date", f"lte.{end.isoformat()}"),
        ("order", "id.asc"),
        ("limit", str(PAGE_SIZE)),
    ]
    rows: list[dict] = []
    offset = 0
    while True:
        r = requests.get(f"{url}/rest/v1/prices", params=base + [("offset", str(offset))],
                         headers=headers, timeout=60)
        if r.status_code >= 300:
            raise SystemExit(f"Supabase {r.status_code} : {r.text[:500]}")
        page = r.json()
        rows.extend(page)
        if len(page) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return normalize(pd.DataFrame(rows))


def load_prices(from_csv: Path | None, periods: list[Period]) -> pd.DataFrame:
    """Prix 1A France -> Algérie, depuis les CSV locaux ou depuis Supabase."""
    cfg = load_routes()
    if from_csv is not None:
        df = load_prices_csv(from_csv)
    else:
        if not periods:
            return normalize(pd.DataFrame())
        df = load_prices_supabase(cfg["origins"], cfg["destinations"],
                                  min(p.start for p in periods), max(p.end for p in periods))
    return filter_france_to_algeria(df, cfg["origins"], cfg["destinations"])


def filter_france_to_algeria(df: pd.DataFrame, origins: list[str], destinations: list[str]) -> pd.DataFrame:
    keep = df["origin"].isin(origins) & df["destination"].isin(destinations) & (df["passengers"] == "1A")
    return df[keep].reset_index(drop=True)


# ───────────────────────── calcul ─────────────────────────

def latest_prices(df: pd.DataFrame) -> pd.DataFrame:
    """Relevé le plus récent par (origin, destination, departure_date), prix le plus bas de ce relevé."""
    cols = ["origin", "destination", "departure_date", "collected_at", "price_eur"]
    if df.empty:
        return pd.DataFrame(columns=cols)
    per_day = df.groupby(["origin", "destination", "departure_date", "collected_at"], as_index=False)["price_eur"].min()
    last = per_day.groupby(["origin", "destination", "departure_date"])["collected_at"].transform("max")
    return per_day[per_day["collected_at"] == last][cols].reset_index(drop=True)


def window_history(df: pd.DataFrame) -> pd.Series:
    """Meilleur prix de la fenêtre pour chaque jour de collecte (index = collected_at)."""
    if df.empty:
        return pd.Series(dtype=float)
    return df.groupby("collected_at")["price_eur"].min().sort_index()


def _fresh_daily(df: pd.DataFrame, today: date) -> dict[date, float]:
    """Prix du jour par date de départ : relevé le plus récent, encore frais, départ à venir."""
    latest = latest_prices(df)
    fresh = latest[
        (latest["departure_date"] >= today)
        & (latest["collected_at"] >= today - timedelta(days=MAX_AGE_DAYS))
    ]
    return {d: float(p) for d, p in sorted(zip(fresh["departure_date"], fresh["price_eur"]))}


def route_features(df: pd.DataFrame, origin: str, destination: str, period: Period, today: date) -> RouteFeatures:
    """Variables d'une ligne pour une période. `df` : prix 1A (toutes lignes confondues).

    Le conseil repose sur les **vols directs** (ce que les familles prennent). S'il n'y a aucun
    direct récent sur la ligne, on retombe sur tous les vols et `direct` passe à False.
    Le vol avec escale le moins cher est gardé à part (`stops_best`) quand il bat le direct.
    """
    in_window = df[
        (df["origin"] == origin) & (df["destination"] == destination)
        & (df["departure_date"] >= period.start) & (df["departure_date"] <= period.end)
        & (df["collected_at"] <= today)
    ]
    feats = RouteFeatures(origin, destination, period.id, days_to_eid=(period.anchor - today).days,
                          kind=period.kind, window_start=period.start, window_end=period.end)

    direct_rows = in_window[in_window["transfers"] == 0]
    all_daily = _fresh_daily(in_window, today)
    direct_daily = _fresh_daily(direct_rows, today)

    if direct_daily:
        used = direct_rows
        feats.daily = direct_daily
        best_any = min(all_daily, key=all_daily.get)
        if all_daily[best_any] < min(direct_daily.values()):
            feats.stops_best = (best_any, all_daily[best_any])
    else:
        used = in_window
        feats.daily = all_daily
        feats.direct = False

    hist = window_history(used)
    feats.n_obs = int(len(hist))
    if feats.n_obs:
        feats.p25, feats.p50, feats.p75 = (float(hist.quantile(q)) for q in (0.25, 0.50, 0.75))
    return feats


def all_features(df: pd.DataFrame, periods: list[Period], origins: list[str], destinations: list[str],
                 today: date) -> list[RouteFeatures]:
    """Une entrée par (origin, destination, période encore à venir)."""
    out = []
    for period in periods:
        if period.end < today:          # période passée : plus de conseil à donner
            continue
        if period.kind == "eid" and period.anchor < today:
            continue                    # Aïd passé
        for o in origins:
            if period.origin is not None and period.origin != o:
                continue                # vacances d'une autre zone
            for d in destinations:
                out.append(route_features(df, o, d, period, today))
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--from-csv", nargs="?", const=OUT_DIR, type=Path, default=None,
                        help="lit les CSV prices_*.csv (par défaut pipeline/data/out/) au lieu de Supabase")
    parser.add_argument("--date", type=date.fromisoformat, default=date.today(), help="date de calcul (AAAA-MM-JJ)")
    args = parser.parse_args()

    load_dotenv(REPO / ".env")
    cfg = load_routes()
    periods = all_periods(args.date)
    df = load_prices(args.from_csv, periods)
    for f in all_features(df, periods, cfg["origins"], cfg["destinations"], args.date):
        best = f"{f.best_price:.0f} € le {f.best_date}" if f.daily else "aucun prix"
        print(f"{f.period} {f.origin}-{f.destination} : {best}, {len(f.daily)} jours, "
              f"n_obs={f.n_obs}, p25={f.p25}, p50={f.p50}, p75={f.p75}, J-{f.days_to_eid}")


if __name__ == "__main__":
    main()
