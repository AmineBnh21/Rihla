/**
 * Périodes proposées dans le formulaire. Mêmes identifiants que pipeline/advisor
 * (CONTRACT.md) : Aïd, vacances scolaires françaises, et un mois au choix.
 * Le site ne calcule rien : il choisit seulement quelle ligne `advice` lire.
 */

import { copy } from "@/lib/copy";

export type PeriodKind = "eid" | "holiday" | "month";
export type PeriodInfo = { id: string; kind: PeriodKind; label: string };

const NAMED: PeriodInfo[] = [
  { id: "eid-fitr-2027", kind: "eid", label: copy.periodLabels["eid-fitr-2027"] },
  { id: "eid-adha-2027", kind: "eid", label: copy.periodLabels["eid-adha-2027"] },
  { id: "noel-2026", kind: "holiday", label: copy.periodLabels["noel-2026"] },
  { id: "hiver-2027", kind: "holiday", label: copy.periodLabels["hiver-2027"] },
  { id: "printemps-2027", kind: "holiday", label: copy.periodLabels["printemps-2027"] },
  { id: "ete-2027", kind: "holiday", label: copy.periodLabels["ete-2027"] },
];

/**
 * Mois proposés : comme le pipeline (11 mois à partir du mois en cours).
 * Liste fixe pour que les pages restent statiques ; à avancer chaque mois
 * (ou au prochain déploiement) en changeant FIRST_MONTH.
 */
const FIRST_MONTH = { year: 2026, month: 11 };
const MONTHS_AHEAD = 11;

const monthFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

function monthPeriods(): PeriodInfo[] {
  const out: PeriodInfo[] = [];
  for (let i = 0; i < MONTHS_AHEAD; i++) {
    const d = new Date(Date.UTC(FIRST_MONTH.year, FIRST_MONTH.month - 1 + i, 1));
    const id = `mois-${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = monthFormat.format(d);
    out.push({ id, kind: "month", label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return out;
}

export const MONTH_PERIODS = monthPeriods();
export const ALL_PERIODS: PeriodInfo[] = [...NAMED, ...MONTH_PERIODS];
export const PERIOD_IDS: readonly string[] = ALL_PERIODS.map((p) => p.id);
export const DEFAULT_PERIOD = "eid-fitr-2027";

const byId = new Map(ALL_PERIODS.map((p) => [p.id, p]));

export function periodInfo(id: string): PeriodInfo | undefined {
  return byId.get(id);
}

export function periodLabel(id: string): string {
  return byId.get(id)?.label ?? id;
}

/** Groupes du menu « Quand pars-tu ? ». */
export const PERIOD_GROUPS: { label: string; periods: PeriodInfo[] }[] = [
  { label: copy.search.periodGroups.eid, periods: NAMED.filter((p) => p.kind === "eid") },
  { label: copy.search.periodGroups.holiday, periods: NAMED.filter((p) => p.kind === "holiday") },
  { label: copy.search.periodGroups.month, periods: MONTH_PERIODS },
];
