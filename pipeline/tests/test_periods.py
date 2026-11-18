"""Tests : périodes toute l'année (vacances par zone, mois) et conseil associé (données mock)."""
from __future__ import annotations

import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "advisor"))

import features as ft  # noqa: E402
import rules  # noqa: E402

TODAY = date(2026, 11, 18)
ZONES = {"LYS": "A", "MRS": "B", "PAR": "C"}
MOCK_CALENDAR = (
    "event,start_date,end_date,country,zone,note\n"
    "eid_al_fitr,2027-03-10,2027-03-10,ALL,,mock\n"
    "vacances_hiver,2027-02-13,2027-03-01,FR,A,mock\n"
    "vacances_hiver,2027-02-06,2027-02-22,FR,C,mock\n"
    "vacances_ete,2027-07-03,2027-09-02,FR,A,mock\n"
    "vacances_hiver,2026-12-17,2027-01-03,DZ,,mock\n"
)


def load_mock_periods() -> list[ft.Period]:
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "calendar_mock.csv"
        path.write_text(MOCK_CALENDAR, encoding="utf-8")
        return ft.load_periods(path, zones=ZONES)


class PeriodsTest(unittest.TestCase):
    def test_holidays_follow_each_airport_zone(self):
        hiver = {p.origin: p for p in load_mock_periods() if p.id == "hiver-2027"}
        self.assertEqual(set(hiver), {"LYS", "PAR"})          # pas de ligne zone B dans le mock
        self.assertEqual(hiver["LYS"].start, date(2027, 2, 13))
        self.assertEqual(hiver["LYS"].end, date(2027, 2, 22))  # J+9
        self.assertEqual(hiver["PAR"].start, date(2027, 2, 6))

    def test_summer_window_is_longer_and_dz_rows_ignored(self):
        periods = load_mock_periods()
        ete = next(p for p in periods if p.id == "ete-2027")
        self.assertEqual((ete.end - ete.start).days, ft.SUMMER_WINDOW_DAYS)
        self.assertFalse(any(p.anchor == date(2026, 12, 17) for p in periods))  # vacances DZ

    def test_month_periods(self):
        months = ft.month_periods(TODAY, 3)
        self.assertEqual([m.id for m in months], ["mois-2026-11", "mois-2026-12", "mois-2027-01"])
        self.assertEqual(months[1].end, date(2026, 12, 31))
        self.assertTrue(all(m.kind == "month" for m in months))

    def test_all_features_skips_other_zones(self):
        periods = [p for p in load_mock_periods() if p.id == "hiver-2027"]
        feats = ft.all_features(ft.normalize(pd.DataFrame()), periods, ["LYS", "MRS", "PAR"], ["ALG"], TODAY)
        self.assertEqual(sorted(f.origin for f in feats), ["LYS", "PAR"])


class RulesByKindTest(unittest.TestCase):
    def features(self, kind: str, days: int, period: str, daily: dict) -> ft.RouteFeatures:
        start = date.fromordinal(TODAY.toordinal() + days)
        return ft.RouteFeatures("LYS", "ALG", period, days, daily, None, None, None, 0, kind=kind,
                                window_start=start, window_end=start)

    def test_month_books_only_within_three_weeks(self):
        dep = date(2026, 12, 20)
        status, reason = rules.decide(self.features("month", 13, "mois-2026-12", {dep: 90.0}))
        self.assertEqual(status, "watch")                       # premier départ à J+32
        dep = date(2026, 12, 5)
        status, reason = rules.decide(self.features("month", 13, "mois-2026-12", {dep: 90.0}))
        self.assertEqual(status, "book")                        # J+17
        self.assertIn("départ approche", reason)

    def test_holiday_reason_names_the_holidays(self):
        status, reason = rules.decide(self.features("holiday", 31, "noel-2026", {date(2026, 12, 19): 90.0}))
        self.assertEqual(status, "book")
        self.assertIn("vacances de Noël", reason)

    def test_reference_key_depends_on_kind(self):
        f = self.features("month", 13, "mois-2026-12", {date(2026, 12, 20): 90.0})
        self.assertIn("days_to_start", rules.reference(f))
        self.assertNotIn("days_to_eid", rules.reference(f))


if __name__ == "__main__":
    unittest.main()
