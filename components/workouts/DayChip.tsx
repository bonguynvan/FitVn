import { Check, Dumbbell, Moon } from "lucide-react";

/**
 * DayChip — one day in the weekly plan strip (T2..CN).
 *
 * Encodes four states with token classes only: "done" (completed session,
 * filled primary), "today" (planned + highlighted with the brand ring),
 * "planned" (upcoming session, outlined), and "rest" (no session, quiet).
 * A lucide glyph reinforces the state; never an emoji.
 */

export type DayState = "done" | "today" | "planned" | "rest";

export interface PlannedDay {
  /** Short weekday label, e.g. "T2". */
  readonly label: string;
  readonly state: DayState;
}

interface DayChipProps {
  day: PlannedDay;
}

const CONTAINER: Record<DayState, string> = {
  done: "border-primary/30 bg-primary text-primary-fg shadow-glow",
  today: "border-primary bg-surface text-text ring-2 ring-primary ring-offset-2 ring-offset-bg",
  planned: "border-border bg-surface text-text",
  rest: "border-border/70 bg-surface-raised text-muted",
};

const ICON_WRAP: Record<DayState, string> = {
  done: "text-primary-fg",
  today: "text-primary",
  planned: "text-primary",
  rest: "text-muted",
};

function StateIcon({ state }: { state: DayState }) {
  if (state === "done") return <Check size={16} strokeWidth={3} aria-hidden />;
  if (state === "rest") return <Moon size={15} aria-hidden />;
  return <Dumbbell size={15} aria-hidden />;
}

const STATE_TEXT: Record<DayState, string> = {
  done: "đã hoàn thành",
  today: "hôm nay, có buổi tập",
  planned: "có buổi tập",
  rest: "ngày nghỉ",
};

export function DayChip({ day }: DayChipProps) {
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl border px-1 py-2.5 transition-colors ${CONTAINER[day.state]}`}
    >
      <span className="text-[11px] font-bold tracking-wide">
        {day.label}
      </span>
      <span className={ICON_WRAP[day.state]}>
        <StateIcon state={day.state} />
      </span>
      <span className="sr-only">
        {day.label}: {STATE_TEXT[day.state]}
      </span>
    </div>
  );
}
