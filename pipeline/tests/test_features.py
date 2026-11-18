import sys
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _mock_data import MOCK_EID, MOCK_PERIOD, mock_prices, mock_row  # noqa: E402
import features as ft  # noqa: E402

TODAY = date(2026, 11, 20)


class PeriodsTest(unittest.TestCase):
    def test_period_id(self):
        self.assertEqual(ft.period_id("eid_al_fitr", date(2027, 3, 10)), "eid-fitr-2027")
        self.assertEqual(ft.period_id("eid_al_adha", date(2027, 5, 17)), "eid-adha-2027")

    def test_load_periods_mock_calendar(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "calendar_mock.csv"
            path.write_text(
                "event,start_date,end_date,country,zone,note\n"
                "eid_al_adha,2027-05-17,2027-05-17,ALL,,mock\n"
                "vacances_fr,2027-02-06,2027-02-21,FR,A,mock\n"
                "eid_al_fitr,2027-03-10,2027-03-10,ALL,,mock\n", encoding="utf-8")
            periods = ft.load_periods(path)
        self.assertEqual([p.id for p in periods], ["eid-fitr-2027", "eid-adha-2027"])
        self.assertEqual(periods[0].start, date(2027, 2, 24))   # J-14
        self.assertEqual(periods[0].end, date(2027, 3, 13))     # J+3

    def test_real_calendar_has_eid_periods(self):
        ids = [p.id for p in ft.load_periods()]
        self.assertIn("eid-fitr-2027", ids)
        self.assertIn("eid-adha-2027", ids)


class LatestPricesTest(unittest.TestCase):
    def test_keeps_latest_collection_and_cheapest_offer(self):
        dep = date(2027, 3, 1)
        df = mock_prices([
            mock_row(TODAY - timedelta(days=2), "LYS", "ORN", dep, 100.0),   # plus ancien, même si moins cher
            mock_row(TODAY, "LYS", "ORN", dep, 180.0),
            mock_row(TODAY, "LYS", "ORN", dep, 150.0),                       # deux offres le même jour
        ])
        latest = ft.latest_prices(df)
        self.assertEqual(len(latest), 1)
        self.assertEqual(latest.iloc[0]["price_eur"], 150.0)
        self.assertEqual(latest.iloc[0]["collected_at"], TODAY)


class RouteFeaturesTest(unittest.TestCase):
    def setUp(self):
        rows = []
        # 4 jours de collecte fictifs ; meilleur prix de la fenêtre : 400, 300, 200, 100
        for i, best in enumerate([400.0, 300.0, 200.0, 100.0]):
            collected = TODAY - timedelta(days=3 - i)
            rows.append(mock_row(collected, "LYS", "ORN", date(2027, 3, 1), best))
            rows.append(mock_row(collected, "LYS", "ORN", date(2027, 3, 2), best + 50))
        rows.append(mock_row(TODAY, "LYS", "ORN", date(2027, 1, 15), 10.0))        # hors fenêtre
        rows.append(mock_row(TODAY, "MRS", "ORN", date(2027, 3, 1), 20.0))         # autre ligne
        rows.append(mock_row(TODAY + timedelta(days=1), "LYS", "ORN", date(2027, 3, 1), 5.0))  # futur
        rows.append(mock_row(TODAY - timedelta(days=30), "LYS", "ORN", date(2027, 3, 5), 90.0))  # périmé
        self.df = mock_prices(rows)

    def test_features(self):
        f = ft.route_features(self.df, "LYS", "ORN", MOCK_PERIOD, TODAY)
        self.assertEqual(f.days_to_eid, (MOCK_EID - TODAY).days)
        self.assertEqual(f.daily, {date(2027, 3, 1): 100.0, date(2027, 3, 2): 150.0})  # 03-05 périmé
        self.assertEqual(f.best_price, 100.0)
        self.assertEqual(f.best_date, date(2027, 3, 1))
        # historique : 90 (relevé ancien, compté dans l'historique) + 400, 300, 200, 100
        self.assertEqual(f.n_obs, 5)
        hist = pd.Series([90.0, 400.0, 300.0, 200.0, 100.0])
        self.assertAlmostEqual(f.p25, hist.quantile(0.25))
        self.assertAlmostEqual(f.p50, 200.0)
        self.assertAlmostEqual(f.p75, hist.quantile(0.75))

    def test_empty(self):
        f = ft.route_features(self.df, "PAR", "CZL", MOCK_PERIOD, TODAY)
        self.assertEqual(f.daily, {})
        self.assertIsNone(f.best_price)
        self.assertEqual(f.n_obs, 0)
        self.assertIsNone(f.p25)

    def test_all_features_skips_past_eid(self):
        feats = ft.all_features(self.df, [MOCK_PERIOD], ["LYS", "MRS"], ["ORN"], MOCK_EID + timedelta(days=1))
        self.assertEqual(feats, [])
        feats = ft.all_features(self.df, [MOCK_PERIOD], ["LYS", "MRS"], ["ORN"], TODAY)
        self.assertEqual(len(feats), 2)


class CsvTest(unittest.TestCase):
    def test_load_csv_and_filter(self):
        with tempfile.TemporaryDirectory() as tmp:
            pd.DataFrame([
                {**mock_row(TODAY, "LYS", "ORN", date(2027, 3, 1), 111.0), "airline": "XX", "flight_number": "1"},
                {**mock_row(TODAY, "ORN", "LYS", date(2027, 3, 1), 222.0), "airline": "XX", "flight_number": "2"},
            ]).to_csv(Path(tmp) / "prices_2026-11-20.csv", index=False)
            (Path(tmp) / "prices_2026-11-19.csv").write_text("empty\n", encoding="utf-8")
            df = ft.load_prices_csv(Path(tmp))
        self.assertEqual(len(df), 2)
        df = ft.filter_france_to_algeria(df, ["LYS", "MRS", "PAR"], ["ALG", "ORN", "CZL"])
        self.assertEqual(df["origin"].tolist(), ["LYS"])
        self.assertEqual(df.iloc[0]["departure_date"], date(2027, 3, 1))


if __name__ == "__main__":
    unittest.main()
