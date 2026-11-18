import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase en lecture seule (clé anon, règles RLS).
 * La clé service ne doit jamais être utilisée côté site.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Vrai si les variables d'environnement Supabase sont renseignées. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/** `null` si Supabase n'est pas configuré : le site passe alors en données de démonstration. */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
