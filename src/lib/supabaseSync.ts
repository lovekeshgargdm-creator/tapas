"use client";

import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./supabase";
import { selectStoredAppData, useStore, type StoredAppData } from "./store";

export const ADMIN_DEMO_EMAIL = "admin@admin.com";

type UserStateRow = {
  state: Partial<StoredAppData> | null;
};

function userDisplayName(user: User) {
  const metadata = user.user_metadata || {};
  const name = metadata.name || metadata.full_name || metadata.display_name;
  return typeof name === "string" ? name : undefined;
}

function userEmail(user: User) {
  return (user.email || "").trim().toLowerCase();
}

export async function loadCloudUserState(userId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { hasRemoteState: false, state: null };

  const { data, error } = await supabase
    .from("user_state")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle<UserStateRow>();

  if (error) throw error;

  const state = data?.state || null;
  return { hasRemoteState: Boolean(state && Object.keys(state).length > 0), state };
}

export async function saveCloudUserState(userId: string, state: StoredAppData) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const { error } = await supabase.from("user_state").upsert({
    user_id: userId,
    state,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function prepareSignedInUser(user: User) {
  const email = userEmail(user);
  const name = userDisplayName(user);
  const current = useStore.getState();
  const remote = await loadCloudUserState(user.id);

  if (remote.hasRemoteState && remote.state) {
    current.replaceStoredData(remote.state, email, name);
  } else {
    current.login(email, name);
  }

  if (email === ADMIN_DEMO_EMAIL) {
    useStore.getState().seedDemo();
  }

  return useStore.getState().profile.onboarded;
}

export function currentStoredAppData() {
  return selectStoredAppData(useStore.getState());
}
