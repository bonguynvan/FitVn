"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";

import { IconBadge } from "@/components/ui";
import type { Achievement } from "@/lib/fitness/achievements";
import { initSeen, markSeen, readSeen } from "@/lib/store/achievements-seen";
import { useStats } from "@/lib/store/stats-store";

const VISIBLE_MS = 4500;
/** Deterministic confetti pieces (no Math.random at render). */
const CONFETTI = [
  { left: "8%", delay: "0ms", color: "var(--color-primary)" },
  { left: "24%", delay: "90ms", color: "var(--color-accent)" },
  { left: "42%", delay: "40ms", color: "var(--color-success)" },
  { left: "58%", delay: "150ms", color: "var(--color-primary)" },
  { left: "74%", delay: "70ms", color: "var(--color-accent)" },
  { left: "90%", delay: "120ms", color: "var(--color-success)" },
] as const;

function buzz() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([90, 50, 90]);
    } catch {
      // unsupported — visual cue still applies
    }
  }
}

/**
 * Watches earned achievements and celebrates ones newly unlocked with a top
 * toast + confetti. On first run it silently baselines the already-earned set so
 * existing users aren't spammed. Mounted app-wide.
 */
export function AchievementCelebration() {
  const { achievements } = useStats();
  const earnedKey = achievements
    .filter((a) => a.earned)
    .map((a) => a.id)
    .join(",");

  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect newly-earned achievements whenever the earned set changes.
  useEffect(() => {
    const earned = achievements.filter((a) => a.earned);
    const seen = readSeen();
    if (!seen.initialized) {
      initSeen(earned.map((a) => a.id)); // silent baseline
      return;
    }
    const seenSet = new Set(seen.ids);
    const fresh = earned.filter((a) => !seenSet.has(a.id));
    if (fresh.length > 0) {
      markSeen(fresh.map((a) => a.id));
      setQueue((q) => [...q, ...fresh]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earnedKey]);

  // Pull the next achievement off the queue when idle.
  useEffect(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0]);
    setQueue((q) => q.slice(1));
    buzz();
    hideTimer.current = setTimeout(() => setCurrent(null), VISIBLE_MS);
  }, [queue, current]);

  useEffect(() => {
    const t = hideTimer.current;
    return () => {
      if (t) clearTimeout(t);
    };
  }, [current]);

  if (!current) return null;

  const Icon = current.icon;

  function dismiss() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setCurrent(null);
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-safe"
      role="status"
      aria-live="polite"
    >
      <div className="animate-pop-in pointer-events-auto relative mt-3 w-full max-w-app overflow-hidden rounded-card border border-primary/30 bg-surface p-4 shadow-raised">
        {/* Confetti burst */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0">
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className="confetti-piece absolute top-0 h-2 w-2 rounded-[2px]"
              style={{ left: c.left, animationDelay: c.delay, backgroundColor: c.color }}
            />
          ))}
        </div>

        <Link
          href="/progress"
          onClick={dismiss}
          className="flex items-center gap-3"
          aria-label={`Thành tích mới: ${current.title}`}
        >
          <IconBadge tone="primary" size="lg">
            <Icon size={24} aria-hidden />
          </IconBadge>
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1 text-eyebrow text-primary">
              <Sparkles size={12} aria-hidden /> Thành tích mới
            </p>
            <p className="truncate text-sm font-bold text-text">{current.title}</p>
            <p className="truncate text-xs text-muted">{current.description}</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Đóng"
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-btn text-muted transition hover:bg-surface-raised hover:text-text"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
