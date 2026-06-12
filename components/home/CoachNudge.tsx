"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";

import { IconBadge } from "@/components/ui";
import { buildLocalCoachContext } from "@/lib/coach/build-context";
import { coachNudge, type NudgeTone } from "@/lib/coach/nudge";
import { useLocalValue } from "@/lib/store/local-store";

const NUTRITION_KEY = "fitvn:nutrition:v1";
const PROFILE_KEY = "fitvn:profile:v1";
const HEALTH_KEY = "fitvn:health:v1";

const TONE_BADGE: Record<NudgeTone, "accent" | "success" | "danger"> = {
  primary: "accent",
  success: "success",
  danger: "danger",
};

/**
 * A personalized one-line coach insight on the home dashboard, linking into the
 * full chat. Reactive to today's meals + profile so it updates as the user logs.
 */
export function CoachNudge() {
  // Subscribe to the keys that drive the nudge so it recomputes on change.
  const foodsRaw = useLocalValue<Record<string, unknown>>(NUTRITION_KEY, {});
  const profileRaw = useLocalValue<unknown>(PROFILE_KEY, null);
  const healthRaw = useLocalValue<unknown>(HEALTH_KEY, null);

  // Avoid hydration mismatch: buildLocalCoachContext reads localStorage, which
  // is empty on the server. Only render after mount so SSR + first client render
  // agree (both null).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const nudge = useMemo(
    () => (mounted ? coachNudge(buildLocalCoachContext()) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mounted, foodsRaw, profileRaw, healthRaw],
  );

  if (!nudge) return null;

  return (
    <Link
      href="/coach"
      className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-card transition-colors hover:border-primary/50 active:scale-[0.99]"
    >
      <IconBadge tone={TONE_BADGE[nudge.tone]} size="md">
        <Sparkles size={20} aria-hidden />
      </IconBadge>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">{nudge.title}</p>
        <p className="text-xs leading-snug text-muted">{nudge.text}</p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
    </Link>
  );
}
