/** Mise en forme pour l'affichage (fr-FR). Aucun calcul de prix. */

const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatEuro(value: number): string {
  return euro.format(value);
}

function toUtcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

/** « 5 mars 2027 » */
export function formatDateLong(isoDate: string): string {
  return toUtcDate(isoDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** « 5 mars » */
export function formatDayMonth(isoDate: string): string {
  return toUtcDate(isoDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** « ven. » */
export function formatWeekday(isoDate: string): string {
  return toUtcDate(isoDate).toLocaleDateString("fr-FR", { weekday: "short", timeZone: "UTC" });
}

/** « 24 févr. » */
export function formatDayShortMonth(isoDate: string): string {
  return toUtcDate(isoDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
