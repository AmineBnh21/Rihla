"""Données de test FICTIVES (mock) pour les tests du conseil v0.

Aucun de ces prix n'est un vrai prix observé : ce sont des valeurs rondes
choisies à la main pour vérifier les règles.
"""
from __future__ import annotations

import sys
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

ADVISOR = Path(__file__).resolve().parents[1] / "advisor"
if str(ADVISOR) not in sys.path:
    sys.path.insert(0, str(ADVISOR))

import features as ft  # noqa: E402

MOCK_EID = date(2027, 3, 10)
MOCK_PERIOD = ft.Period("eid-fitr-2027", MOCK_EID, MOCK_EID - timedelta(days=14), MOCK_EID + timedelta(days=3))


def mock_row(collected: date, origin: str, dest: str, dep: date, price: float, pax: str = "1A") -> dict:
    return {"collected_at": collected.isoformat(), "origin": origin, "destination": dest,
            "departure_date": dep.isoformat(), "passengers": pax, "price_eur": price}


def mock_prices(rows: list[dict]) -> pd.DataFrame:
    return ft.normalize(pd.DataFrame(rows))


def mock_features(origin="LYS", dest="ORN", days_to_eid=100, daily=None, p25=200.0, p50=250.0, p75=300.0,
                  n_obs=20, period="eid-fitr-2027") -> ft.RouteFeatures:
    daily = daily if daily is not None else {date(2027, 3, 1): 260.0, date(2027, 3, 2): 280.0}
    return ft.RouteFeatures(origin, dest, period, days_to_eid, daily, p25, p50, p75, n_obs)
