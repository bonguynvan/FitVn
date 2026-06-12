/**
 * Whether Supabase is configured (public env vars present). Used to switch the
 * app between real Supabase auth/data and the local-first fallback, so the repo
 * still runs end-to-end without a backend.
 *
 * NEXT_PUBLIC_* vars are inlined at build time, so this is safe on server,
 * client, and edge (middleware).
 */
export function isSupabaseConfigured(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
