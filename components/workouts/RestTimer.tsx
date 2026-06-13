"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Pause, Play, Plus, RotateCcw, Timer, X } from "lucide-react";

import { ProgressRing } from "@/components/ui";
import {
  DEFAULT_REST_SECONDS,
  setRestDuration,
  useRestDuration,
} from "@/lib/store/preferences-store";

/** Quick-pick rest durations (seconds). */
const PRESETS = [60, 90, 120, 180] as const;
const TICK_MS = 200;
const ADD_SECONDS = 30;

type Status = "idle" | "running" | "paused" | "done";

function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/** Compact preset label: 60→"1′", 90→"1′30", 45→"45s". */
function presetLabel(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return r ? `${m}′${r}` : `${m}′`;
}

/** Short two-tone chime + vibration when a rest finishes. Best-effort. */
function notifyDone(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([120, 60, 120]);
    } catch {
      // ignore unsupported
    }
  }
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const beep = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    beep(880, 0, 0.18);
    beep(1175, 0.2, 0.22);
    setTimeout(() => void ctx.close(), 700);
  } catch {
    // audio not available — vibration / visual cue still apply
  }
}

/**
 * Workout rest timer. Idle shows quick-pick durations; running shows a countdown
 * ring with pause, +30s, and reset/skip. Finishes with a chime + vibration. The
 * last-used duration is remembered as the default.
 */
export function RestTimer() {
  const defaultRest = useRestDuration();
  const [status, setStatus] = useState<Status>("idle");
  const [totalSec, setTotalSec] = useState(defaultRest);
  const [remainingMs, setRemainingMs] = useState(defaultRest * 1000);

  const endAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => clearTick, [clearTick]);

  const tick = useCallback(() => {
    if (endAtRef.current == null) return;
    const left = endAtRef.current - Date.now();
    if (left <= 0) {
      setRemainingMs(0);
      setStatus("done");
      clearTick();
      endAtRef.current = null;
      notifyDone();
      return;
    }
    setRemainingMs(left);
  }, [clearTick]);

  const start = useCallback(
    (seconds: number) => {
      clearTick();
      setTotalSec(seconds);
      setRemainingMs(seconds * 1000);
      setStatus("running");
      setRestDuration(seconds);
      endAtRef.current = Date.now() + seconds * 1000;
      intervalRef.current = setInterval(tick, TICK_MS);
    },
    [clearTick, tick],
  );

  const pause = useCallback(() => {
    clearTick();
    if (endAtRef.current != null) setRemainingMs(endAtRef.current - Date.now());
    endAtRef.current = null;
    setStatus("paused");
  }, [clearTick]);

  const resume = useCallback(() => {
    setStatus("running");
    endAtRef.current = Date.now() + remainingMs;
    intervalRef.current = setInterval(tick, TICK_MS);
  }, [remainingMs, tick]);

  const addTime = useCallback(() => {
    setTotalSec((t) => t + ADD_SECONDS);
    if (status === "running" && endAtRef.current != null) {
      endAtRef.current += ADD_SECONDS * 1000;
      setRemainingMs(endAtRef.current - Date.now());
    } else {
      setRemainingMs((ms) => ms + ADD_SECONDS * 1000);
    }
  }, [status]);

  const reset = useCallback(() => {
    clearTick();
    endAtRef.current = null;
    setStatus("idle");
    setRemainingMs(defaultRest * 1000);
    setTotalSec(defaultRest);
  }, [clearTick, defaultRest]);

  // Idle: quick-pick presets.
  if (status === "idle") {
    return (
      <div className="flex flex-col gap-2 rounded-card bg-surface-raised p-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-text">
          <Timer size={15} aria-hidden /> Hẹn giờ nghỉ
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => start(sec)}
              className={`inline-flex h-9 items-center justify-center rounded-btn border text-xs font-bold tabular-nums transition-colors active:scale-95 ${
                sec === defaultRest
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-surface text-text hover:border-primary/40"
              }`}
            >
              {presetLabel(sec)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const done = status === "done";
  const ringMax = totalSec * 1000 || 1;
  const ringValue = done ? ringMax : remainingMs;

  return (
    <div
      className={`flex items-center gap-3 rounded-card border p-3 transition-colors ${
        done ? "border-success/40 bg-success/10" : "border-primary/30 bg-primary/5"
      }`}
    >
      <ProgressRing
        value={ringValue}
        max={ringMax}
        size={56}
        stroke={6}
        label={done ? "Hết giờ nghỉ" : `Còn ${mmss(remainingMs / 1000)}`}
      >
        {done ? (
          <Check size={20} aria-hidden className="text-success" />
        ) : (
          <span className="text-xs font-bold tabular-nums text-text">
            {mmss(remainingMs / 1000)}
          </span>
        )}
      </ProgressRing>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-text">
          {done ? "Hết giờ nghỉ!" : status === "paused" ? "Tạm dừng" : "Đang nghỉ"}
        </p>
        <p className="text-[11px] font-medium text-muted">
          {done ? "Sẵn sàng cho hiệp tiếp theo" : `Tổng ${mmss(totalSec)}`}
        </p>
      </div>

      {/* Controls */}
      <div className="flex shrink-0 items-center gap-1.5">
        {!done && (
          <>
            <TimerButton label="Thêm 30 giây" onClick={addTime}>
              <Plus size={16} aria-hidden />
              <span className="text-[10px] font-bold">30</span>
            </TimerButton>
            {status === "running" ? (
              <TimerButton label="Tạm dừng" onClick={pause}>
                <Pause size={16} aria-hidden />
              </TimerButton>
            ) : (
              <TimerButton label="Tiếp tục" onClick={resume} tone="primary">
                <Play size={16} aria-hidden />
              </TimerButton>
            )}
          </>
        )}
        {done ? (
          <TimerButton label="Nghỉ lại" onClick={() => start(totalSec)} tone="primary">
            <RotateCcw size={16} aria-hidden />
          </TimerButton>
        ) : null}
        <TimerButton label="Bỏ qua" onClick={reset}>
          <X size={16} aria-hidden />
        </TimerButton>
      </div>
    </div>
  );
}

function TimerButton({
  label,
  onClick,
  tone = "neutral",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "neutral" | "primary";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex h-9 min-w-9 items-center justify-center gap-0.5 rounded-btn px-2 transition-colors active:scale-95 ${
        tone === "primary"
          ? "bg-primary text-primary-fg shadow-glow"
          : "border border-border bg-surface text-text hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}
