"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Droplet, HeartPulse, UtensilsCrossed, X } from "lucide-react";

import { Card, IconBadge, SectionHeader } from "@/components/ui";
import { todayIso } from "@/lib/date";
import { computeDueReminders, type ReminderKey } from "@/lib/reminders/engine";
import {
  dismissReminder,
  useDismissed,
  useReminderSettings,
} from "@/lib/store/reminders-store";
import { useDayFoods, useWater } from "@/lib/store/nutrition-store";
import { useWaterGoal } from "@/lib/store/preferences-store";
import { useHealthReadings } from "@/lib/store/health-store";

const ICON: Record<ReminderKey, typeof Droplet> = {
  water: Droplet,
  mealLog: UtensilsCrossed,
  markerRecheck: HeartPulse,
};

const NOTIFIED_KEY = "fitvn:reminders-notified:v1";

/** Fire an OS notification once per reminder per day (best-effort). */
function maybeNotify(today: string, key: string, title: string, body: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const raw = window.localStorage.getItem(NOTIFIED_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    const done = map[today] ?? [];
    if (done.includes(key)) return;
    navigator.serviceWorker?.ready
      .then((reg) => reg.showNotification(title, { body, tag: `fitvn-${key}` }))
      .catch(() => {});
    window.localStorage.setItem(NOTIFIED_KEY, JSON.stringify({ [today]: [...done, key] }));
  } catch {
    /* ignore */
  }
}

/** Surfaces due reminders on the home screen while the app is open. */
export function RemindersBanner() {
  const today = todayIso();
  const settings = useReminderSettings();
  const water = useWater(today);
  const waterGoal = useWaterGoal();
  const foods = useDayFoods(today);
  const readings = useHealthReadings();
  const dismissed = useDismissed(today);

  // Re-evaluate on mount + every minute so reminders appear when their time passes.
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const lastMarkerIso = useMemo(() => {
    let max: string | null = null;
    for (const r of readings) if (!max || r.measuredOn > max) max = r.measuredOn;
    return max;
  }, [readings]);

  const due = useMemo(() => {
    if (!mounted) return [];
    const now = new Date();
    const nowHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return computeDueReminders({
      settings,
      nowHHMM,
      todayIso: today,
      waterCups: water,
      waterGoal,
      mealsToday: foods.length,
      lastMarkerIso,
      dismissed,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, settings, water, waterGoal, foods.length, lastMarkerIso, dismissed, today]);

  // Best-effort OS notifications for whatever is currently due.
  useEffect(() => {
    for (const r of due) maybeNotify(today, r.key, r.title, r.body);
  }, [due, today]);

  if (due.length === 0) return null;

  return (
    <section aria-labelledby="reminders-heading" className="flex flex-col gap-3">
      <SectionHeader id="reminders-heading">Nhắc nhở</SectionHeader>
      <div className="flex flex-col gap-2">
        {due.map((r) => {
          const Icon = ICON[r.key];
          return (
            <Card key={r.key} padding="md" className="flex items-center gap-3">
              <IconBadge tone="accent" size="md">
                <Icon size={18} aria-hidden />
              </IconBadge>
              <Link href={r.href} className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text">{r.title}</p>
                <p className="text-xs leading-snug text-muted">{r.body}</p>
              </Link>
              <Link
                href={r.href}
                aria-label={`Mở ${r.title}`}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted hover:text-text"
              >
                <ChevronRight size={18} />
              </Link>
              <button
                type="button"
                onClick={() => dismissReminder(today, r.key)}
                aria-label={`Bỏ qua ${r.title}`}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted transition hover:bg-surface-raised hover:text-text"
              >
                <X size={16} />
              </button>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
