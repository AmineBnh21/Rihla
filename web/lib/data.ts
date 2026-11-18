/**
 * Lecture des données (table `advice`). Aucun calcul métier ici :
 * le conseil, les prix et le calendrier sont calculés par pipeline/.
 *
 * Si Supabase n'est pas configuré, les fonctions renvoient les données
 * de démonstration de lib/mock.ts avec `source: "mock"`, pour que les pages
 * affichent le bandeau « Données de démonstration ».
 */

import { cacheLife } from "next/cache";
import { MOCK_ADVICE } from "@/lib/mock";
import { supabase } from "@/lib/supabase";
import type {
  Advice,
  DataResult,
  Destination,
  Origin,
  Passengers,
  Period,
  TrackedRoute,
} from "@/lib/types";

const ADVICE_COLUMNS =
  "id, computed_at, origin, destination, period, passengers, status, reason, price_eur, cheaper_option, calendar, reference";

/** Les colonnes numeric de Postgres peuvent arriver en texte : on les ramène en nombre. */
function normalizeAdvice(row: Advice): Advice {
  return {
    ...row,
    id: Number(row.id),
    price_eur: row.price_eur === null ? null : Number(row.price_eur),
  };
}

/** Dernière ligne `advice` (computed_at le plus récent) pour un trajet, une période et un profil. */
export async function getLatestAdvice(
  origin: Origin,
  destination: Destination,
  period: Period,
  passengers: Passengers,
): Promise<DataResult<Advice | null>> {
  "use cache";
  cacheLife("hours");

  if (!supabase) {
    const row = MOCK_ADVICE.find(
      (a) =>
        a.origin === origin &&
        a.destination === destination &&
        a.period === period &&
        a.passengers === passengers,
    );
    return { data: row ?? null, source: "mock" };
  }

  const { data, error } = await supabase
    .from("advice")
    .select(ADVICE_COLUMNS)
    .eq("origin", origin)
    .eq("destination", destination)
    .eq("period", period)
    .eq("passengers", passengers)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle<Advice>();

  if (error) {
    console.error("Lecture advice impossible :", error.message);
    return { data: null, source: "supabase" };
  }
  return { data: data ? normalizeAdvice(data) : null, source: "supabase" };
}

/** Toutes les lignes `advice` du dernier calcul (computed_at le plus récent). */
export async function getLatestAdviceSnapshot(): Promise<DataResult<Advice[]>> {
  "use cache";
  cacheLife("hours");

  if (!supabase) {
    return { data: MOCK_ADVICE, source: "mock" };
  }

  const latest = await supabase
    .from("advice")
    .select("computed_at")
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ computed_at: string }>();

  if (latest.error || !latest.data) {
    if (latest.error) console.error("Lecture advice impossible :", latest.error.message);
    return { data: [], source: "supabase" };
  }

  const { data, error } = await supabase
    .from("advice")
    .select(ADVICE_COLUMNS)
    .eq("computed_at", latest.data.computed_at)
    .returns<Advice[]>();

  if (error) {
    console.error("Lecture advice impossible :", error.message);
    return { data: [], source: "supabase" };
  }
  return { data: (data ?? []).map(normalizeAdvice), source: "supabase" };
}

/** Liste des lignes suivies (origine → destination) présentes dans le dernier calcul. */
export async function getTrackedRoutes(): Promise<DataResult<TrackedRoute[]>> {
  const snapshot = await getLatestAdviceSnapshot();
  return { data: uniqueRoutes(snapshot.data), source: snapshot.source };
}

function uniqueRoutes(rows: Advice[]): TrackedRoute[] {
  const seen = new Map<string, TrackedRoute>();
  for (const r of rows) {
    const key = `${r.origin}-${r.destination}`;
    if (!seen.has(key)) seen.set(key, { origin: r.origin, destination: r.destination });
  }
  return [...seen.values()];
}

/**
 * Chiffres clés affichés sur l'accueil, lus dans le dernier calcul.
 * Chaque valeur vaut `null` si la donnée manque : la carte n'est alors pas affichée.
 * (Comptages et sélection pour l'affichage uniquement, pas de calcul de prix.)
 */
export type Overview = {
  computedAt: string | null;
  routesCount: number | null;
  profilesCount: number | null;
  daysToEidFitr: number | null;
  cheapestFitrSolo: { price: number; origin: Origin; destination: Destination } | null;
  maxObservations: number | null;
};

export async function getOverview(): Promise<DataResult<Overview>> {
  const { data: rows, source } = await getLatestAdviceSnapshot();

  const routes = uniqueRoutes(rows);
  const profiles = new Set(rows.map((r) => r.passengers));
  const fitr = rows.filter((r) => r.period === "eid-fitr-2027");

  const daysToEid = fitr.find((r) => r.reference?.days_to_eid != null)?.reference?.days_to_eid ?? null;

  let cheapest: Overview["cheapestFitrSolo"] = null;
  for (const r of fitr) {
    if (r.passengers !== "1A" || r.price_eur === null) continue;
    if (!cheapest || r.price_eur < cheapest.price) {
      cheapest = { price: r.price_eur, origin: r.origin, destination: r.destination };
    }
  }

  const obs = rows.map((r) => r.reference?.n_obs).filter((n): n is number => typeof n === "number");

  return {
    source,
    data: {
      computedAt: rows[0]?.computed_at ?? null,
      routesCount: routes.length > 0 ? routes.length : null,
      profilesCount: profiles.size > 0 ? profiles.size : null,
      daysToEidFitr: daysToEid,
      cheapestFitrSolo: cheapest,
      maxObservations: obs.length > 0 ? Math.max(...obs) : null,
    },
  };
}
