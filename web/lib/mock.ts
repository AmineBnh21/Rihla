/**
 * DONNÉES DE DÉMONSTRATION (mock) : tous ces chiffres sont FICTIFS.
 *
 * Utilisées uniquement quand Supabase n'est pas configuré (variables
 * d'environnement absentes), et toujours affichées avec le bandeau
 * « Données de démonstration ». À retirer avant la mise en ligne.
 */

import {
  DESTINATIONS,
  ORIGINS,
  PASSENGERS,
  EID_PERIODS,
  type Advice,
  type CalendarDay,
  type Destination,
  type Origin,
  type Passengers,
  type EidPeriod,
  type Status,
} from "@/lib/types";

const MOCK_COMPUTED_AT = "2026-11-18";

/** Dates d'Aïd fictives pour la démo (alignées sur pipeline/data/calendar.csv). */
const MOCK_EID_DATE: Record<EidPeriod, string> = {
  "eid-fitr-2027": "2027-03-10",
  "eid-adha-2027": "2027-05-17",
};

/** Prix fictif 1 adulte, aller simple, par trajet. */
const MOCK_BASE_PRICE: Record<Origin, Record<Destination, number>> = {
  LYS: { ALG: 168, ORN: 182, CZL: 205 },
  MRS: { ALG: 139, ORN: 151, CZL: 176 },
  PAR: { ALG: 189, ORN: 197, CZL: 214 },
};

/** Multiplicateur fictif pour passer d'1 adulte au profil famille. */
const MOCK_FAMILY_FACTOR: Record<Passengers, number> = {
  "1A": 1,
  "2A2C": 3.6,
  "2A3C": 4.4,
};

const MOCK_STATUSES: Status[] = ["book", "watch", "wait"];

const MOCK_REASONS: Record<Status, string> = {
  book: "Démo : les prix de ce trajet sont déjà au-dessus de ce qu'on voit d'habitude à cette distance de l'Aïd, et ils montent vite.",
  watch: "Démo : les prix sont dans la moyenne pour l'instant, mais les places les moins chères commencent à partir.",
  wait: "Démo : il reste beaucoup de temps avant l'Aïd et les prix sont plutôt hauts, tu peux attendre quelques semaines.",
};

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toIso: string): number {
  const ms = Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Calendrier fictif de J-14 à J+3 autour de l'Aïd, prix famille. */
function mockCalendar(origin: Origin, destination: Destination, period: EidPeriod, passengers: Passengers): CalendarDay[] {
  const eid = MOCK_EID_DATE[period];
  const base = MOCK_BASE_PRICE[origin][destination] * MOCK_FAMILY_FACTOR[passengers];
  const days: CalendarDay[] = [];
  for (let offset = -14; offset <= 3; offset++) {
    // Un jour sans relevé, pour montrer que les jours absents sont gérés.
    if (offset === -9) continue;
    const closeness = offset <= 0 ? (14 + offset) / 14 : (3 - offset) / 3;
    const wobble = ((offset * 7 + origin.length * 3 + destination.charCodeAt(0)) % 5) * 0.03;
    days.push({
      date: addDays(eid, offset),
      price_eur: Math.round(base * (1 + 0.6 * closeness + wobble)),
    });
  }
  return days;
}

function buildMockAdvice(
  id: number,
  origin: Origin,
  destination: Destination,
  period: EidPeriod,
  passengers: Passengers,
): Advice {
  const calendar = mockCalendar(origin, destination, period, passengers);
  const cheapest = calendar.reduce((a, b) => (b.price_eur < a.price_eur ? b : a));
  const status = MOCK_STATUSES[id % MOCK_STATUSES.length];
  const base = MOCK_BASE_PRICE[origin][destination];

  let cheaper_option: Advice["cheaper_option"] = null;
  if (origin !== "MRS") {
    const alt = mockCalendar("MRS", destination, period, passengers).reduce((a, b) =>
      b.price_eur < a.price_eur ? b : a,
    );
    if (alt.price_eur < cheapest.price_eur) {
      cheaper_option = {
        kind: "airport",
        origin: "MRS",
        destination,
        departure_date: alt.date,
        price_eur: alt.price_eur,
        saving_eur: cheapest.price_eur - alt.price_eur,
      };
    }
  }

  return {
    id,
    computed_at: MOCK_COMPUTED_AT,
    origin,
    destination,
    period,
    passengers,
    status,
    reason: MOCK_REASONS[status],
    price_eur: cheapest.price_eur,
    cheaper_option,
    calendar,
    reference: {
      p25: Math.round(base * 0.9),
      p50: base,
      p75: Math.round(base * 1.25),
      n_obs: 30 + ((id * 13) % 25),
      days_to_eid: daysBetween(MOCK_COMPUTED_AT, MOCK_EID_DATE[period]),
    },
  };
}

/** Toutes les lignes `advice` fictives (une par trajet, période et profil). */
export const MOCK_ADVICE: Advice[] = (() => {
  const rows: Advice[] = [];
  let id = 1;
  for (const origin of ORIGINS)
    for (const destination of DESTINATIONS)
      for (const period of EID_PERIODS)
        for (const passengers of PASSENGERS)
          rows.push(buildMockAdvice(id++, origin, destination, period, passengers));
  return rows;
})();
