"use client";

import { createClient } from "@/lib/supabase/client";
import { applyData, gatherData } from "@/lib/store/backup";

/**
 * Per-user cloud sync of the local data blob (profile, diary, workouts,
 * measurements, markers, check-ins, meals, reminders…) into public.user_data,
 * protected by RLS. Last-write-wins by updated_at — simple, robust multi-device
 * continuity without rewriting the local-first stores. The stores stay the
 * source of truth at runtime; this pushes/pulls the whole snapshot.
 */

export interface SyncResult {
  ok: boolean;
  error?: string;
  /** pull only: number of keys applied; or empty=true when no cloud row yet. */
  applied?: number;
  empty?: boolean;
  updatedAt?: string | null;
}

async function currentUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** True when there is an authenticated Supabase session. */
export async function isCloudAuthed(): Promise<boolean> {
  return (await currentUserId()) !== null;
}

/** Bounded poll for the initial session: ~12s, covering the post-login race. */
const SESSION_POLL_MS = 800;
const SESSION_POLL_TRIES = 15;

/**
 * Run `cb` once with the user id as soon as an authenticated session is
 * available, and again on later sign-ins.
 *
 * Right after a server-action login + redirect there is a brief window where
 * the auth cookie isn't yet visible to the freshly-mounted browser client, so
 * onAuthStateChange emits INITIAL_SESSION=null and never re-fires. getSession()
 * re-reads the cookie each call, so we also poll briefly until it appears.
 * Returns an unsubscribe function.
 */
export function onAuthedUser(cb: (userId: string) => void): () => void {
  const supabase = createClient();
  let fired = false;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const fire = (userId: string) => {
    if (fired || stopped) return;
    fired = true;
    cb(userId);
  };

  let tries = 0;
  const poll = async () => {
    if (stopped || fired) return;
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      fire(data.session.user.id);
      return;
    }
    if (++tries < SESSION_POLL_TRIES && !stopped) {
      timer = setTimeout(() => void poll(), SESSION_POLL_MS);
    }
  };
  void poll();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) fire(session.user.id);
  });

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    subscription.unsubscribe();
  };
}

/** Upload the current local snapshot to the cloud. */
export async function pushToCloud(): Promise<SyncResult> {
  try {
    const supabase = createClient();
    const userId = await currentUserId();
    if (!userId) return { ok: false, error: "Bạn cần đăng nhập để đồng bộ." };
    const updatedAt = new Date().toISOString();
    const { error } = await supabase
      .from("user_data")
      .upsert({ user_id: userId, data: gatherData(), updated_at: updatedAt }, { onConflict: "user_id" });
    if (error) return { ok: false, error: error.message };
    return { ok: true, updatedAt };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi đồng bộ." };
  }
}

/** Pull the cloud snapshot and apply it locally. */
export async function pullFromCloud(): Promise<SyncResult> {
  try {
    const supabase = createClient();
    const userId = await currentUserId();
    if (!userId) return { ok: false, error: "Bạn cần đăng nhập để đồng bộ." };
    const { data, error } = await supabase
      .from("user_data")
      .select("data, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: true, empty: true };
    const applied = applyData((data.data ?? {}) as Record<string, unknown>);
    return { ok: true, applied, updatedAt: data.updated_at as string };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi đồng bộ." };
  }
}

/** The cloud snapshot's updated_at, or null if none / unauthenticated. */
export async function cloudUpdatedAt(): Promise<string | null> {
  try {
    const supabase = createClient();
    const userId = await currentUserId();
    if (!userId) return null;
    const { data } = await supabase
      .from("user_data")
      .select("updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    return (data?.updated_at as string | undefined) ?? null;
  } catch {
    return null;
  }
}
