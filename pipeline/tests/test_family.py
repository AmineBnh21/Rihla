import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import _mock_data  # noqa: E402,F401  (ajoute advisor/ au chemin)
from family import SCARCITY_CAP, family_price, parse_passengers, scarcity_markup  # noqa: E402


class FamilyTest(unittest.TestCase):
    def test_parse(self):
        self.assertEqual(parse_passengers("1A"), (1, 0))
        self.assertEqual(parse_passengers("2A2C"), (2, 2))
        self.assertEqual(parse_passengers("2a3c"), (2, 3))
        for bad in ("", "3C", "0A2C", "A2"):
            with self.assertRaises(ValueError):
                parse_passengers(bad)

    def test_markup(self):
        self.assertEqual(scarcity_markup(1), 0)
        self.assertEqual(scarcity_markup(2), 0)
        self.assertAlmostEqual(scarcity_markup(4), 0.10)
        self.assertAlmostEqual(scarcity_markup(5), 0.15)
        self.assertEqual(scarcity_markup(50), SCARCITY_CAP)

    def test_family_price_mock(self):
        self.assertEqual(family_price(100.0, "1A"), 100)
        self.assertEqual(family_price(100.0, "2A2C"), 440)   # 4 x 100 x 1,10
        self.assertEqual(family_price(100.0, "2A3C"), 575)   # 5 x 100 x 1,15
        self.assertIsInstance(family_price(123.45, "2A3C"), int)


if __name__ == "__main__":
    unittest.main()
