import { supabase } from "./client";

/**
 * owner — single DRY ownership guard for all Supabase sub-clients.
 * Server (RLS) is the real enforcer: USING (auth.uid() = user_id).
 * This client check fails fast with a 403-style error instead of
 * sending a cross-user request that RLS would reject anyway.
 * Never rely on UI hiding alone — every by-id fetch/mutation must
 * pass through here.
 */
export async function assertOwner(userId: string): Promise<string> {
  if (!userId || typeof userId !== "string") {
    throw new Error("Forbidden: missing owner id (403)");
  }
  try {
    const { data } = await supabase.auth.getSession();
    const authId = data?.session?.user?.id ?? null;
    // Logged-out / demo-local sessions never touch Supabase (callers
    // already guard with isCloudId); a missing session means RLS
    // would reject, so fail fast here.
    if (!authId) {
      throw new Error("Forbidden: not authenticated (403)");
    }
    if (authId !== userId) {
      throw new Error("Forbidden: cross-user access denied (403)");
    }
    return authId;
  } catch (e) {
    // Preserve our own 403 errors; only network failures fall through
    // to a generic auth error (callers treat as offline / paused sync).
    if (/Forbidden/.test((e as { message?: string })?.message ?? "")) throw e;
    throw new Error("Forbidden: not authenticated (403)");
  }
}
