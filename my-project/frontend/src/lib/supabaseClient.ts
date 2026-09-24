import { createClient } from "@supabase/supabase-js";

// Public client only — NEVER use service_role key in the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Friendly dev warning (not a crash) — Stage 1 skeleton runs without DB too.
  console.warn(
    "[Control Key] Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY. Add them to frontend/.env.local"
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key"
);
