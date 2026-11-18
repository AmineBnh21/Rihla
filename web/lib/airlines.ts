/**
 * Compagnies qui volent entre la France et l'Algérie (hiver 2026-2027).
 * Diaspora Routes n'a de partenariat avec aucune d'elles : on affiche leurs noms
 * en texte, sans logo (voir CLAUDE.md, LogoMarquee).
 * Sources : presse spécialisée, novembre 2026 (algerie360, observalgerie,
 * voyagefrancealgerie). À revoir à chaque saison IATA.
 */

export type Airline = {
  /** Code IATA, tel qu'il arrive dans `prices.airline`. */
  code: string;
  name: string;
  /** Une phrase, en français, sur sa présence sur nos lignes. */
  note: string;
};

export const AIRLINES: Airline[] = [
  {
    code: "AH",
    name: "Air Algérie",
    note: "La compagnie nationale algérienne, présente sur la plupart des lignes suivies.",
  },
  {
    code: "TO",
    name: "Transavia",
    note: "La low-cost du groupe Air France-KLM, la plus présente cet hiver, surtout depuis Lyon et Paris-Orly.",
  },
  {
    code: "5O",
    name: "ASL Airlines France",
    note: "Des vols depuis plusieurs aéroports français, dont Paris-Orly vers Alger.",
  },
  {
    code: "AF",
    name: "Air France",
    note: "Des vols depuis Paris-Charles-de-Gaulle vers l'Algérie.",
  },
  {
    code: "V7",
    name: "Volotea",
    note: "Surtout depuis Marseille, avec moins de vols cet hiver.",
  },
];

const byCode = new Map(AIRLINES.map((a) => [a.code, a]));

/** Nom lisible d'une compagnie à partir de son code IATA (sinon le code lui-même). */
export function airlineName(code: string | null | undefined): string | null {
  if (!code) return null;
  return byCode.get(code)?.name ?? code;
}
