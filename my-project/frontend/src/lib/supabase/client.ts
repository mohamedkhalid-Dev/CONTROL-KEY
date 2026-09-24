import { supabase } from "@/lib/supabaseClient";

/**
 * Base Supabase client shared by all sub-clients.
 * Publishable (anon) key only — NEVER service_role in the browser.
 * RLS: every row is owner-only (auth.uid() = user_id).
 */
export { supabase };
