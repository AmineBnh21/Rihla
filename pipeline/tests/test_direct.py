"""Tests : le conseil repose sur les vols directs, l'escale n'est qu'une option (données mock)."""
from __future__ import annotations

import sys
import unittest
from datetime import date
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "advisor"))

import features as ft  # noqa: E402
import rules  # noqa: E402

TODAY = date(2026, 11, 18)
PERIOD = ft.Period("eid-fitr-2027", date(2027, 3, 10), date(2027, 2, 24), date(2027, 3, 13))


def mock_prices(rows: list[tuple[str, str, str, float, int]]) -> pd.DataFrame:
    """rows : (origin, destination, departure_date, price_eur, transfers) — prix mock 1A collectés aujourd'hui."""
    return ft.normalize(pd.DataFrame([
        {"collected_at": TODAY.isoformat(), "origin": o, "destination": d, "departure_date": dep,
         "passengers": "1A", "price_eur": p, "transfers": t}
        for o, d, dep, p, t in rows
    ]))


class DirectFlightsTest(unittest.TestCase):
    def test_price_uses_direct_and_keeps_cheaper_stop_aside(self):
        df = mock_prices([
            ("PAR", "ALG", "2027-02-26", 68.0, 1),   # escale, moins cher
            ("PAR", "ALG", "2027-02-25", 77.0, 0),   # direct
        ])
        f = ft.route_features(df, "PAR", "ALG", PERIOD, TODAY)
        self.assertTrue(f.direct)
        self.assertEqual(f.best_price, 77.0)
        self.assertEqual(f.stops_best, (date(2027, 2, 26), 68.0))

    def test_falls_back_to_stops_when_no_direct(self):
        df = mock_prices([("LYS", "CZL", "2027-03-01", 150.0, 1)])
        f = ft.route_features(df, "LYS", "CZL", PERIOD, TODAY)
        self.assertFalse(f.direct)
        self.assertEqual(f.best_price, 150.0)
        row = rules.build_advice([f], TODAY, profiles=["1A"])[0]
        self.assertIn("escale", row["reason"])

    def test_stops_offered_as_cheaper_option_for_family(self):
        df = mock_prices([
            ("PAR", "ALG", "2027-02-25", 120.0, 0),
            ("PAR", "ALG", "2027-02-26", 70.0, 1),
        ])
        f = ft.route_features(df, "PAR", "ALG", PERIOD, TODAY)
        opt = rules.cheaper_option(f, [f], "2A3C")
        self.assertIsNotNone(opt)
        self.assertEqual(opt["kind"], "stops")
        self.assertGreater(opt["saving_eur"], 0)

    def test_direct_airport_option_preferred_over_stops(self):
        df = mock_prices([
            ("PAR", "ALG", "2027-02-25", 120.0, 0),
            ("PAR", "ALG", "2027-02-26", 60.0, 1),
            ("MRS", "ALG", "2027-02-27", 90.0, 0),
        ])
        par = ft.route_features(df, "PAR", "ALG", PERIOD, TODAY)
        mrs = ft.route_features(df, "MRS", "ALG", PERIOD, TODAY)
        opt = rules.cheaper_option(par, [par, mrs], "1A")
        self.assertEqual(opt["kind"], "airport")
        self.assertEqual(opt["origin"], "MRS")


if __name__ == "__main__":
    unittest.main()
