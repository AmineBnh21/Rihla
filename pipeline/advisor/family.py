"""Estimation du prix famille à partir du prix 1 adulte.

L'API Data de Travelpayouts ne donne que des prix pour 1 adulte. On en déduit
un prix famille avec une règle simple et volontairement prudente (on préfère
surestimer un peu que d'annoncer un prix qu'une famille ne trouvera pas) :

1. Chaque enfant (2-11 ans) paie comme un adulte (CHILD_FACTOR = 1.0) : sur
   les lignes France <-> Algérie, les compagnies accordent peu de réduction.
2. Majoration de « rareté » : les tarifs les moins chers ne comptent que
   quelques sièges et partent en premier. Un grand groupe finit donc souvent
   sur une classe tarifaire plus chère. On ajoute SCARCITY_STEP par passager
   au-delà du SCARCITY_FREE_SEATS-ième, plafonné à SCARCITY_CAP.

Exemples : 1A = 1 x prix ; 2A2C = 4 x prix x 1,10 ; 2A3C = 5 x prix x 1,15.

Prix aller simple, hors bagages en soute (voir CONTRACT.md).
"""
from __future__ import annotations

import re

CHILD_FACTOR = 1.0          # prix d'un enfant 2-11 ans / prix d'un adulte
SCARCITY_FREE_SEATS = 2     # nombre de passagers sans majoration
SCARCITY_STEP = 0.05        # +5 % par passager au-delà
SCARCITY_CAP = 0.20         # majoration maximale (+20 %)

_PASSENGERS_RE = re.compile(r"^(\d+)A(?:(\d+)C)?$")


def parse_passengers(code: str) -> tuple[int, int]:
    """'2A3C' -> (2, 3) ; '1A' -> (1, 0)."""
    m = _PASSENGERS_RE.match(code.strip().upper())
    if not m:
        raise ValueError(f"Profil de passagers inconnu : {code!r}")
    adults, children = int(m.group(1)), int(m.group(2) or 0)
    if adults < 1:
        raise ValueError(f"Il faut au moins un adulte : {code!r}")
    return adults, children


def scarcity_markup(n_passengers: int) -> float:
    """Majoration de rareté, en fraction (0.10 = +10 %)."""
    extra = max(0, n_passengers - SCARCITY_FREE_SEATS)
    return min(SCARCITY_STEP * extra, SCARCITY_CAP)


def family_price(price_1a: float, passengers: str) -> int:
    """Prix total estimé (euros entiers) pour le profil, à partir du prix 1 adulte."""
    adults, children = parse_passengers(passengers)
    seats = adults + CHILD_FACTOR * children
    total = price_1a * seats * (1 + scarcity_markup(adults + children))
    return int(round(total))
