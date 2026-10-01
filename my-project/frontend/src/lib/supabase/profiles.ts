import { supabase } from "./client";
import { assertOwner } from "./owner";

/**
 * profiles sub-client — matches the REAL Supabase schema:
 *   profiles(user_id uuid PK, name text, age int, email text|null,
 *            onboarding_complete bool, created_at, updated_at)
 * user_id always equals auth.uid() (RLS owner-only).
 *
 * Local StoredProfile keeps displayName + avatarColor for UI;
 * avatarColor lives in localStorage only (no column in DB).
 */

export interface ProfileRow {
  user_id: string;
  /** Normalized name — DB column is `name` (legacy docs called it display_name). */
  display_name: string;
  age: number;
  email: string | null;
  /** Not stored in DB — derived locally so old callers keep working. */
  avatar_color: string;
  onboarding_complete: boolean;
  /** Raw DB `name` value (same as display_name). Kept for forwards-compat. */
  name?: string;
}

export interface UpsertProfileInput {
  userId: string;
  displayName: string;
  age: number;
  /** Mirror of auth.users.email — convenience copy, auth stays source of truth. */
  email?: string | null;
  avatarColor?: string;
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  // Fail-fast ownership check; RLS USING (auth.uid() = user_id) enforces server-side.
  // Select is minimal (no excess fields) — avatar_color lives in localStorage only.
  await assertOwner(userId);
  // Real schema uses `name` (not display_name) and has no avatar_color.
  // Select only columns that exist, then normalize to the app shape.
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,name,age,email,onboarding_complete")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    // Forward-compat: if a future migration renames name→display_name,
    // retry with the legacy column set instead of failing.
    const msg = (error as { message?: string })?.message ?? "";
    if (/display_name|avatar_color|column/i.test(msg)) {
      const retry = await supabase
        .from("profiles")
        .select("user_id,display_name,age,email")
        .eq("user_id", userId)
        .maybeSingle();
      if (retry.error) throw retry.error;
      const r = retry.data as unknown as {
        user_id: string;
        display_name: string;
        age: number;
        email: string | null;
      } | null;
      if (!r) return null;
      return {
        user_id: r.user_id,
        display_name: r.display_name,
        name: r.display_name,
        age: r.age,
        email: r.email,
        avatar_color: "#4F46E5",
        onboarding_complete: true,
      };
    }
    throw error;
  }
  const row = data as unknown as {
    user_id: string;
    name: string;
    age: number;
    email: string | null;
    onboarding_complete: boolean | null;
  } | null;
  if (!row) return null;
  return {
    user_id: row.user_id,
    display_name: row.name,
    name: row.name,
    age: row.age,
    email: row.email,
    avatar_color: "#4F46E5",
    onboarding_complete: row.onboarding_complete ?? false,
  };
}

export async function upsertProfile(input: UpsertProfileInput): Promise<void> {
  // Prevent IDOR: userId MUST equal the signed-in auth.uid().
  await assertOwner(input.userId);
  const payload = {
    user_id: input.userId,
    name: input.displayName.trim().slice(0, 30),
    age: input.age,
    email: input.email?.trim().toLowerCase().slice(0, 254) ?? null,
    onboarding_complete: true,
  };
  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
  if (!error) return;
  // Forward-compat fallback if DB still uses the legacy display_name column.
  const msg = (error as { message?: string })?.message ?? "";
  if (/column|display_name|name/i.test(msg)) {
    const legacy = await supabase.from("profiles").upsert(
      {
        user_id: input.userId,
        display_name: payload.name,
        age: payload.age,
        email: payload.email,
        avatar_color: input.avatarColor ?? "#4F46E5",
      },
      { onConflict: "user_id" }
    );
    if (legacy.error) throw legacy.error;
    return;
  }
  throw error;
}

export async function deleteProfile(userId: string): Promise<void> {
  await assertOwner(userId);
  const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
  if (error) throw error;
}
