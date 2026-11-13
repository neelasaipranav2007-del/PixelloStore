import { createClient } from "@supabase/supabase-js";

// Supports both Vite (import.meta.env) and Node/Next (process.env) for zero-breakage transition
const getEnvVar = (viteKey: string, nextKey: string, fallback: string = ""): string => {
  if (typeof import.meta !== "undefined" && (import.meta as any).env?.[viteKey]) {
    return (import.meta as any).env[viteKey];
  }
  if (typeof process !== "undefined" && process.env?.[nextKey]) {
    return process.env[nextKey]!;
  }
  return fallback;
};

export const SUPABASE_URL = getEnvVar("VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "");
export const SUPABASE_ANON_KEY = getEnvVar("VITE_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = createClient(
  SUPABASE_URL || "https://placeholder-project.supabase.co",
  SUPABASE_ANON_KEY || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "pixello_supabase_auth_session",
    },
  }
);

/**
 * Validates connectivity to the configured Supabase project
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      message: "Supabase credentials are not yet configured in environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).",
    };
  }

  try {
    const { data, error } = await supabase.from("product_categories").select("id").limit(1);
    if (error) {
      return { ok: false, message: `Database error: ${error.message}` };
    }
    return { ok: true, message: "Successfully connected to Supabase PostgreSQL database." };
  } catch (err: any) {
    return { ok: false, message: `Network error: ${err.message}` };
  }
}
