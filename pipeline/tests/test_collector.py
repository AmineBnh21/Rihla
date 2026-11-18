"""Tests du collecteur (pipeline/collector/fetch_prices.py).

Toutes les réponses de l'API sont FICTIVES (mock) : aucun appel réseau, aucun
vrai prix. Lancer depuis la racine du dépôt :
    python -m unittest pipeline.tests.test_collector -v
"""
from __future__ import annotations

import logging
import sys
import unittest
from datetime import date
from pathlib import Path
from unittest import mock

COLLECTOR = Path(__file__).resolve().parents[1] / "collector"
if str(COLLECTOR) not in sys.path:
    sys.path.insert(0, str(COLLECTOR))

import fetch_prices as fp  # noqa: E402

TODAY = date(2026, 11, 18)
EIDS = [date(2027, 3, 10), date(2027, 5, 17)]
CFG = {
    "origins": ["LYS"],
    "destinations": ["ORN"],
    "both_directions": False,
    "horizon_days": {"min": 30, "max": 120},
    "currency": "eur",
    "market": "fr",
    "passengers": "1A",
}


def mock_offer(day: str, price, airline="TO", flight="3200", **extra) -> dict:
    offer = {
        "origin": "LYS", "destination": "ORN",
        "origin_airport": "LYS", "destination_airport": "ORN",
        "price": price, "airline": airline, "flight_number": flight,
        "departure_at": f"{day}T07:00:00+01:00", "transfers": 0, "return_transfers": 0,
        "duration": 120, "link": "/search/fictif",
    }
    offer.update(extra)
    return offer


def mock_response(status=200, payload=None, headers=None) -> mock.Mock:
    r = mock.Mock()
    r.status_code = status
    r.headers = headers or {}
    r.json.return_value = payload if payload is not None else {"success": True, "data": [], "currency": "eur"}
    r.text = str(payload)
    return r


def mock_session(*responses) -> mock.Mock:
    s = mock.Mock()
    s.headers = {}
    s.get.side_effect = list(responses)
    return s


class _NoSleep(unittest.TestCase):
    def setUp(self):
        patcher = mock.patch.object(fp.time, "sleep")
        self.sleep = patcher.start()
        self.addCleanup(patcher.stop)
        logging.disable(logging.CRITICAL)
        self.addCleanup(logging.disable, logging.NOTSET)


class TestHorizon(unittest.TestCase):
    def test_months_cover_window(self):
        # 18/11/2026 + 30 j = 18/12/2026 ; + 120 j = 18/03/2027
        self.assertEqual(fp.months_in_horizon(TODAY, 30, 120),
                         ["2026-12", "2027-01", "2027-02", "2027-03"])

    def test_months_year_end(self):
        self.assertEqual(fp.months_in_horizon(date(2026, 12, 31), 1, 31), ["2027-01"])

    def test_rows_outside_horizon_are_dropped(self):
        inside = fp.to_row(mock_offer("2027-01-15", 150), "LYS", "ORN", TODAY, CFG, EIDS)
        too_soon = fp.to_row(mock_offer("2026-12-17", 150), "LYS", "ORN", TODAY, CFG, EIDS)  # 29 j
        edge_min = fp.to_row(mock_offer("2026-12-18", 150), "LYS", "ORN", TODAY, CFG, EIDS)  # 30 j
        edge_max = fp.to_row(mock_offer("2027-03-18", 150), "LYS", "ORN", TODAY, CFG, EIDS)  # 120 j
        too_late = fp.to_row(mock_offer("2027-03-19", 150), "LYS", "ORN", TODAY, CFG, EIDS)  # 121 j
        self.assertIsNotNone(inside)
        self.assertEqual(inside["days_to_departure"], 58)
        self.assertIsNone(too_soon)
        self.assertIsNotNone(edge_min)
        self.assertIsNotNone(edge_max)
        self.assertIsNone(too_late)


class TestToRow(unittest.TestCase):
    def test_columns_match_prices_table(self):
        row = fp.to_row(mock_offer("2027-01-15", 149.9), "LYS", "ORN", TODAY, CFG, EIDS)
        self.assertEqual(tuple(row), fp.COLUMNS)
        self.assertEqual(row["passengers"], "1A")
        self.assertEqual(row["source"], "travelpayouts")
        self.assertIsNone(row["return_date"])
        self.assertEqual(row["price_eur"], 149.9)

    def test_missing_or_bad_fields(self):
        for bad in (
            {"price": 120},                                   # pas de departure_at
            {"departure_at": "2027-01-15T07:00:00+01:00"},    # pas de prix
            mock_offer("2027-01-15", None),
            mock_offer("2027-01-15", 0),
            mock_offer("2027-01-15", "abc"),
            {"price": 120, "departure_at": "pas-une-date"},
        ):
            self.assertIsNone(fp.to_row(bad, "LYS", "ORN", TODAY, CFG, EIDS), bad)

    def test_optional_fields_absent(self):
        offer = {"price": 99, "departure_at": "2027-01-15T07:00:00+01:00"}
        row = fp.to_row(offer, "LYS", "ORN", TODAY, CFG, EIDS)
        self.assertIsNotNone(row)
        for col in ("airline", "flight_number", "transfers", "origin_airport", "destination_airport"):
            self.assertIsNone(row[col], col)

    def test_flight_number_int_becomes_text(self):
        row = fp.to_row(mock_offer("2027-01-15", 99, flight=3200), "LYS", "ORN", TODAY, CFG, EIDS)
        self.assertEqual(row["flight_number"], "3200")


class TestDaysToEid(unittest.TestCase):
    def test_before_eid_is_positive(self):
        self.assertEqual(fp.nearest_eid_offset(date(2027, 3, 1), EIDS), 9)

    def test_after_eid_is_negative(self):
        self.assertEqual(fp.nearest_eid_offset(date(2027, 3, 12), EIDS), -2)

    def test_picks_nearest_eid(self):
        self.assertEqual(fp.nearest_eid_offset(date(2027, 5, 10), EIDS), 7)

    def test_no_eid(self):
        self.assertIsNone(fp.nearest_eid_offset(date(2027, 3, 1), []))

    def test_in_row(self):
        row = fp.to_row(mock_offer("2027-03-01", 200), "LYS", "ORN", TODAY, CFG, EIDS)
        self.assertEqual(row["days_to_eid"], 9)


class TestDedupe(unittest.TestCase):
    def test_keeps_cheapest_per_key(self):
        a = fp.to_row(mock_offer("2027-01-15", 180), "LYS", "ORN", TODAY, CFG, EIDS)
        b = fp.to_row(mock_offer("2027-01-15", 140), "LYS", "ORN", TODAY, CFG, EIDS)
        c = fp.to_row(mock_offer("2027-01-15", 160, airline="AH", flight="1100"), "LYS", "ORN", TODAY, CFG, EIDS)
        out = fp.dedupe([a, b, c])
        self.assertEqual(len(out), 2)
        self.assertEqual(sorted(r["price_eur"] for r in out), [140, 160])

    def test_null_airline_counts_as_same_key(self):
        a = fp.to_row({"price": 90, "departure_at": "2027-01-15"}, "LYS", "ORN", TODAY, CFG, EIDS)
        b = fp.to_row({"price": 80, "departure_at": "2027-01-15"}, "LYS", "ORN", TODAY, CFG, EIDS)
        out = fp.dedupe([a, b])
        self.assertEqual([r["price_eur"] for r in out], [80])


class TestFetch(_NoSleep):
    def test_params_and_success(self):
        payload = {"success": True, "currency": "eur",
                   "data": [mock_offer("2027-01-15", 150), mock_offer("2027-01-16", 170)]}
        s = mock_session(mock_response(payload=payload))
        items = fp.fetch_month(s, "LYS", "ORN", "2027-01", "eur", "fr")
        self.assertEqual(len(items), 2)
        params = s.get.call_args.kwargs["params"]
        self.assertEqual(params["departure_at"], "2027-01")
        self.assertEqual(params["one_way"], "true")
        self.assertEqual(params["currency"], "eur")
        self.assertEqual(params["market"], "fr")
        self.assertEqual(params["page"], 1)
        self.assertEqual(params["limit"], fp.PAGE_LIMIT)
        self.assertEqual(s.get.call_args.args[0], fp.API_URL)

    def test_429_then_success(self):
        ok = mock_response(payload={"success": True, "currency": "eur", "data": [mock_offer("2027-01-15", 150)]})
        s = mock_session(mock_response(429, headers={"X-Rate-Limit-Reset": "7"}), mock_response(429), ok)
        items = fp.fetch_month(s, "LYS", "ORN", "2027-01", "eur")
        self.assertEqual(len(items), 1)
        self.assertEqual(s.get.call_count, 3)
        waits = [c.args[0] for c in self.sleep.call_args_list]
        self.assertEqual(waits[:2], [7.0, 10.0])  # en-tête X-Rate-Limit-Reset, puis 5*2**1

    def test_429_forever_raises(self):
        s = mock_session(*[mock_response(429) for _ in range(fp.MAX_RETRIES)])
        with self.assertRaises(fp.ApiError):
            fp.fetch_month(s, "LYS", "ORN", "2027-01", "eur")
        self.assertEqual(s.get.call_count, fp.MAX_RETRIES)

    def test_success_false_raises(self):
        s = mock_session(mock_response(payload={"success": False, "data": {}, "error": "Unauthorized"}))
        with self.assertRaisesRegex(fp.ApiError, "Unauthorized"):
            fp.fetch_month(s, "LYS", "ORN", "2027-01", "eur")
        self.assertEqual(s.get.call_count, 1)  # pas de nouvel essai inutile

    def test_empty_dict_data_is_empty_list(self):
        s = mock_session(mock_response(payload={"success": True, "data": {}}))
        self.assertEqual(fp.fetch_month(s, "LYS", "ORN", "2027-01", "eur"), [])

    def test_wrong_currency_raises(self):
        s = mock_session(mock_response(payload={"success": True, "currency": "rub", "data": [mock_offer("2027-01-15", 9000)]}))
        with self.assertRaisesRegex(fp.ApiError, "devise"):
            fp.fetch_month(s, "LYS", "ORN", "2027-01", "eur")

    def test_pagination_stops_on_short_page(self):
        with mock.patch.object(fp, "PAGE_LIMIT", 2):
            p1 = mock_response(payload={"success": True, "data": [mock_offer("2027-01-15", 1), mock_offer("2027-01-16", 2)]})
            p2 = mock_response(payload={"success": True, "data": [mock_offer("2027-01-17", 3)]})
            s = mock_session(p1, p2)
            items = fp.fetch_month(s, "LYS", "ORN", "2027-01", "eur")
        self.assertEqual(len(items), 3)
        self.assertEqual([c.kwargs["params"]["page"] for c in s.get.call_args_list], [1, 2])


class TestCollect(_NoSleep):
    def test_collect_end_to_end_with_mock(self):
        cfg = {**CFG, "horizon_days": {"min": 30, "max": 60}}  # mois 2026-12 et 2027-01
        dec = mock_response(payload={"success": True, "currency": "eur", "data": [
            mock_offer("2026-12-20", 210), mock_offer("2026-12-20", 190), mock_offer("2026-12-01", 99)]})
        jan = mock_response(payload={"success": False, "data": {}, "error": "boom"})
        s = mock_session(dec, jan)
        rows = fp.collect("jeton-fictif", TODAY, cfg=cfg, eids=EIDS, session=s)
        self.assertEqual(s.headers["X-Access-Token"], "jeton-fictif")
        self.assertEqual(len(rows), 1)            # doublon fusionné, 2026-12-01 hors horizon
        self.assertEqual(rows[0]["price_eur"], 190)

    def test_all_failed_exits(self):
        cfg = {**CFG, "horizon_days": {"min": 30, "max": 31}}  # un seul mois
        s = mock_session(mock_response(payload={"success": False, "error": "x"}))
        with self.assertRaises(SystemExit):
            fp.collect("t", TODAY, cfg=cfg, eids=EIDS, session=s)


if __name__ == "__main__":
    unittest.main()
