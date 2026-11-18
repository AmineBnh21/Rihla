/**
 * Types qui reflètent CONTRACT.md et la table `advice` de supabase/schema.sql.
 * Le site lit ces données telles quelles : il ne calcule rien.
 */

export const ORIGINS = ["LYS", "MRS", "PAR"] as const;
export const DESTINATIONS = ["ALG", "ORN", "CZL"] as const;
export const PASSENGERS = ["1A", "2A2C", "2A3C"] as const;
/** Périodes de l'Aïd (Observatoire, démo). Toutes les périodes : lib/periods.ts. */
export const EID_PERIODS = ["eid-fitr-2027", "eid-adha-2027"] as const;
export const STATUSES = ["book", "watch", "wait"] as const;

/** Code ville France (origin). */
export type Origin = (typeof ORIGINS)[number];
/** Code ville Algérie (destination). */
export type Destination = (typeof DESTINATIONS)[number];
/** Profil : A = adulte, C = enfant 2-11 ans. */
export type Passengers = (typeof PASSENGERS)[number];
/** Identifiant de période : eid-fitr-2027, hiver-2027, mois-2027-01… (voir lib/periods.ts). */
export type Period = string;
export type EidPeriod = (typeof EID_PERIODS)[number];
export type Status = (typeof STATUSES)[number];

/** `advice.cheaper_option` (jsonb). */
export type CheaperOption = {
  /** airport : autre aéroport de départ · day : autre jour · stops : vol avec escale. */
  kind: "airport" | "day" | "stops";
  /** Code ville de départ proposé (peut différer du trajet demandé). */
  origin: string;
  destination: string;
  /** Date ISO AAAA-MM-JJ. */
  departure_date: string;
  price_eur: number;
  saving_eur: number;
};

/** Un élément de `advice.calendar` (jsonb) : prix famille du jour. */
export type CalendarDay = {
  /** Date ISO AAAA-MM-JJ. */
  date: string;
  price_eur: number;
};

/** `advice.reference` (jsonb). Percentiles en prix 1 adulte. */
export type Reference = {
  p25: number;
  p50: number;
  p75: number;
  n_obs: number;
  /** Jours entre computed_at et l'Aïd. */
  /** Périodes Aïd : jours entre computed_at et l'Aïd. */
  days_to_eid?: number;
  /** Vacances et mois : jours entre computed_at et le début de la période. */
  days_to_start?: number;
};

/** Une ligne de la table `advice`. */
export type Advice = {
  id: number;
  /** Date ISO AAAA-MM-JJ. */
  computed_at: string;
  origin: Origin;
  destination: Destination;
  period: Period;
  passengers: Passengers;
  status: Status;
  reason: string;
  /** Prix total pour le profil, aller simple, hors bagages en soute. */
  price_eur: number | null;
  cheaper_option: CheaperOption | null;
  /** Trié par date ; jours sans relevé absents. */
  calendar: CalendarDay[] | null;
  reference: Reference | null;
};

/** Origine des données affichées : la vraie base, ou des données de démonstration. */
export type DataSource = "supabase" | "mock";

export type DataResult<T> = {
  data: T;
  source: DataSource;
};

/** Une ligne suivie (origine → destination). */
export type TrackedRoute = {
  origin: Origin;
  destination: Destination;
};
