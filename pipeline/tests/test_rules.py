import json
import sys
import unittest
from datetime import date
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _mock_data import mock_features  # noqa: E402
import rules  # noqa: E402


class DecideTest(unittest.TestCase):
    def test_book_close_to_eid(self):
        status, reason = rules.decide(mock_features(days_to_eid=38, n_obs=0, p25=None, p50=None, p75=None))
        self.assertEqual(status, "book")
        self.assertIn("38 jours", reason)

    def test_book_cheap(self):
        f = mock_features(days_to_eid=100, daily={date(2027, 3, 1): 190.0})
        self.assertEqual(rules.decide(f)[0], "book")

    def test_no_cheap_book_with_short_history(self):
        f = mock_features(days_to_eid=60, daily={date(2027, 3, 1): 190.0}, n_obs=3)
        self.assertEqual(rules.decide(f)[0], "watch")

    def test_wait(self):
        f = mock_features(days_to_eid=100, daily={date(2027, 3, 1): 250.0})
        status, reason = rules.decide(f)
        self.assertEqual(status, "wait")
        self.assertIn("100 jours", reason)

    def test_no_wait_with_short_history(self):
        f = mock_features(days_to_eid=100, daily={date(2027, 3, 1): 300.0}, n_obs=9)
        self.assertEqual(rules.decide(f)[0], "watch")

    def test_watch_middle(self):
        self.assertEqual(rules.decide(mock_features(days_to_eid=70))[0], "watch")
        f = mock_features(days_to_eid=100, daily={date(2027, 3, 1): 230.0})   # entre p25 et p50
        self.assertEqual(rules.decide(f)[0], "watch")

    def test_reasons_are_french_sentences(self):
        cases = [mock_features(days_to_eid=d, n_obs=n) for d in (0, 1, 40, 70, 100) for n in (0, 20)]
        for f in cases:
            status, reason = rules.decide(f)
            self.assertIn(status, ("book", "watch", "wait"))
            self.assertTrue(reason[0].isupper() and reason.endswith("."), reason)


class CheaperOptionTest(unittest.TestCase):
    def test_airport_option(self):
        lys = mock_features("LYS", daily={date(2027, 3, 1): 260.0, date(2027, 3, 2): 280.0})
        mrs = mock_features("MRS", daily={date(2027, 3, 3): 200.0})
        opt = rules.cheaper_option(lys, [lys, mrs], "2A3C")
        self.assertEqual(set(opt), {"kind", "origin", "destination", "departure_date", "price_eur", "saving_eur"})
        self.assertEqual(opt["kind"], "airport")
        self.assertEqual(opt["origin"], "MRS")
        self.assertEqual(opt["destination"], "ORN")
        self.assertEqual(opt["departure_date"], "2027-03-03")
        self.assertEqual(opt["price_eur"], 1150)          # 5 x 200 x 1,15
        self.assertEqual(opt["saving_eur"], 1495 - 1150)  # 5 x 260 x 1,15 = 1495

    def test_small_saving_is_null(self):
        lys = mock_features("LYS", daily={date(2027, 3, 1): 260.0})
        mrs = mock_features("MRS", daily={date(2027, 3, 1): 250.0})
        self.assertIsNone(rules.cheaper_option(lys, [lys, mrs], "1A"))      # 10 € < 20 €
        self.assertIsNotNone(rules.cheaper_option(lys, [lys, mrs], "2A3C"))  # 57 € en famille

    def test_ignores_other_destination_or_period(self):
        lys = mock_features("LYS", daily={date(2027, 3, 1): 260.0})
        other_dest = mock_features("MRS", dest="ALG", daily={date(2027, 3, 1): 100.0})
        other_period = mock_features("MRS", period="eid-adha-2027", daily={date(2027, 5, 10): 100.0})
        self.assertIsNone(rules.cheaper_option(lys, [lys, other_dest, other_period], "1A"))


class BuildAdviceTest(unittest.TestCase):
    def test_rows_follow_contract(self):
        today = date(2026, 11, 20)
        lys = mock_features("LYS", days_to_eid=110,
                            daily={date(2027, 3, 2): 280.0, date(2027, 3, 1): 260.0})
        mrs = mock_features("MRS", days_to_eid=110, daily={date(2027, 3, 3): 200.0})
        empty = mock_features("PAR", days_to_eid=110, daily={}, n_obs=0, p25=None, p50=None, p75=None)
        rows = rules.build_advice([lys, mrs, empty], today)
        self.assertEqual(len(rows), 6)        # PAR sans prix : ignoré
        json.dumps(rows)                       # sérialisable tel quel

        row = next(r for r in rows if r["origin"] == "LYS" and r["passengers"] == "2A2C")
        self.assertEqual(row["computed_at"], "2026-11-20")
        self.assertEqual(row["period"], "eid-fitr-2027")
        self.assertEqual(row["price_eur"], 1144)   # 4 x 260 x 1,10
        self.assertEqual(row["calendar"], [{"date": "2027-03-01", "price_eur": 1144},
                                           {"date": "2027-03-02", "price_eur": 1232}])
        self.assertEqual(row["reference"], {"p25": 200, "p50": 250, "p75": 300, "n_obs": 20, "days_to_eid": 110})
        self.assertEqual(row["cheaper_option"]["origin"], "MRS")
        self.assertEqual(row["status"], "wait")


class UpsertTest(unittest.TestCase):
    def test_upsert_request(self):
        env = {"SUPABASE_URL": "https://mock.supabase.co/", "SUPABASE_SERVICE_KEY": "mock-key"}
        response = mock.Mock(status_code=201, text="")
        with mock.patch.dict("os.environ", env), mock.patch.object(rules.requests, "post",
                                                                   return_value=response) as post:
            rules.upsert_supabase([{"origin": "LYS"}])
        url = post.call_args.args[0]
        headers = post.call_args.kwargs["headers"]
        self.assertEqual(url, "https://mock.supabase.co/rest/v1/advice"
                              "?on_conflict=computed_at,origin,destination,period,passengers")
        self.assertIn("resolution=merge-duplicates", headers["Prefer"])
        self.assertEqual(headers["Authorization"], "Bearer mock-key")


if __name__ == "__main__":
    unittest.main()
