/** Lecture des paramètres d'URL de /resultat. */

import { PERIOD_IDS } from "@/lib/periods";
import {
  DESTINATIONS,
  ORIGINS,
  type Destination,
  type Origin,
  type Passengers,
  type Period,
} from "@/lib/types";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export type ResultQuery = {
  origin: Origin | null;
  destination: Destination | null;
  period: Period | null;
  adults: number;
  children: number;
  bags: number;
  /** `null` si le profil (adultes, enfants) n'est pas suivi. */
  passengers: Passengers | null;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(list: readonly T[], value: string | undefined): T | null {
  return list.find((item) => item === value) ?? null;
}

function toCount(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n >= 0 && n <= 20 ? n : fallback;
}

/** Profils suivis : 1A, 2A2C, 2A3C. Sinon `null`. */
export function toPassengers(adults: number, children: number): Passengers | null {
  if (adults === 1 && children === 0) return "1A";
  if (adults === 2 && children === 2) return "2A2C";
  if (adults === 2 && children === 3) return "2A3C";
  return null;
}

export function parseResultQuery(params: RawSearchParams): ResultQuery {
  const adults = toCount(first(params.adults), 1);
  const children = toCount(first(params.children), 0);
  return {
    origin: oneOf(ORIGINS, first(params.from)?.toUpperCase()),
    destination: oneOf(DESTINATIONS, first(params.to)?.toUpperCase()),
    period: oneOf(PERIOD_IDS, first(params.period)?.toLowerCase()),
    adults,
    children,
    bags: toCount(first(params.bags), 0),
    passengers: toPassengers(adults, children),
  };
}
