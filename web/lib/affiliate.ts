/**
 * Lien partenaire Aviasales (programme Travelpayouts). Seul lien affilié du site,
 * ajouté avec l'accord de l'auteur. Toujours affiché avec la mention « lien partenaire ».
 *
 * Format testé le 18/11/2026 : https://www.aviasales.com/search/PAR2502ALG23?marker=…&currency=eur
 *   PAR + 2502 (JJMM) + ALG + 2 (adultes) + 3 (enfants)
 * Le clic ouvre une recherche réelle sur Aviasales : elle remplit aussi le cache de prix
 * que lit le pipeline pour nos lignes.
 */

/** Identifiant partenaire Travelpayouts (public : il apparaît dans chaque lien). */
const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER ?? "";

export const isAffiliateConfigured = MARKER.length > 0;

type SearchLink = {
  origin: string;
  destination: string;
  /** Date de départ ISO AAAA-MM-JJ. */
  date: string;
  adults: number;
  children: number;
};

export function aviasalesSearchUrl({ origin, destination, date, adults, children }: SearchLink): string | null {
  if (!isAffiliateConfigured) return null;
  const [, month, day] = date.split("-");
  if (!month || !day) return null;
  const a = Math.min(Math.max(adults, 1), 9);
  const c = Math.min(Math.max(children, 0), 6);
  const pax = c > 0 ? `${a}${c}` : `${a}`;
  const params = new URLSearchParams({ marker: MARKER, currency: "eur" });
  return `https://www.aviasales.com/search/${origin}${day}${month}${destination}${pax}?${params.toString()}`;
}
