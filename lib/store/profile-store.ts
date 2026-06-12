"use client";

import { readLocal, useLocalValue, writeLocal } from "./local-store";
import {
  computeTargets,
  DEFAULT_TARGETS,
  type DailyTargets,
  type UserProfile,
} from "@/lib/fitness/targets";

const KEY = "fitvn:profile:v1";

/** Reactive user profile (null until the user sets it up). */
export function useProfile(): UserProfile | null {
  return useLocalValue<UserProfile | null>(KEY, null);
}

export function getProfile(): UserProfile | null {
  return readLocal<UserProfile | null>(KEY, null);
}

export function saveProfile(profile: UserProfile): void {
  writeLocal(KEY, profile);
}

export function clearProfile(): void {
  writeLocal<UserProfile | null>(KEY, null);
}

/** Personalized daily targets: a manual override if set, else computed from the
 *  profile, else sensible defaults. */
export function useDailyTargets(): DailyTargets {
  const profile = useProfile();
  if (!profile) return DEFAULT_TARGETS;
  return profile.customTargets ?? computeTargets(profile);
}
