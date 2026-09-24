import { supabase } from "./client";

/**
 * profiles sub-client — REQUIRED fields only:
 * display_name (name), age, email. Nothing else.
 * user_id always equals auth.uid() (RLS owner-only).
 */

export interface ProfileRow {
  user_id: string;
  display_name: string;
  age: number;
  email: string | null;
  avatar_color: string;
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
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,display_name,age,email,avatar_color")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

export async function upsertProfile(input: UpsertProfileInput): Promise<void> {
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: input.userId,
      display_name: input.displayName.trim().slice(0, 30),
      age: input.age,
      email: input.email?.trim().toLowerCase().slice(0, 254) ?? null,
      avatar_color: input.avatarColor ?? "#4F46E5",
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export async function deleteProfile(userId: string): Promise<void> {
  const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
  if (error) throw error;
}
