"use client";

import { useMemo, useState } from "react";
import {
  Clock,
  Dumbbell,
  Hash,
  LayoutTemplate,
  Minus,
  Play,
  Plus,
  Trash2,
  Weight,
} from "lucide-react";

import { PageHeader } from "@/components/nav/PageHeader";
import {
  Card,
  IconBadge,
  MiniBarChart,
  Pill,
  SectionHeader,
  Sheet,
  StatTile,
} from "@/components/ui";
import { shortDateVi, todayIso } from "@/lib/date";
import { newId } from "@/lib/store/local-store";
import {
  addSession,
  removeSession,
  useSessions,
} from "@/lib/store/workout-store";
import {
  addTemplate,
  removeTemplate,
  useTemplates,
} from "@/lib/store/template-store";
import { PRESET_TEMPLATES } from "@/lib/data/workout-templates";
import type {
  LoggedExercise,
  LoggedSet,
  WorkoutSession,
} from "@/lib/store/types";

/** Shape used to prefill the add-session form from a template. */
interface TemplateInitial {
  name: string;
  exercises: { name: string; setCount: number }[];
}

const DEFAULT_SESSION_NAME = "Buổi tập";
/** Weekday labels T2..CN, indexed Monday-first. */
const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;
const DAYS_IN_WEEK = 7;

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

/** Σ over every set of reps × weight (kg). Nulls count as 0. */
function sessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce(
    (exTotal, ex) =>
      exTotal +
      ex.sets.reduce(
        (setTotal, set) =>
          setTotal + (set.reps ?? 0) * (set.weightKg ?? 0),
        0,
      ),
    0,
  );
}

function totalSets(session: WorkoutSession): number {
  return session.exercises.reduce((n, ex) => n + ex.sets.length, 0);
}

/** Monday-first weekday index (0 = Mon … 6 = Sun) for a yyyy-mm-dd string. */
function weekdayIndex(iso: string): number {
  const day = new Date(`${iso}T00:00:00`).getDay(); // 0 = Sun … 6 = Sat
  return (day + 6) % 7;
}

/** yyyy-mm-dd of the Monday opening the week that contains `iso`. */
function startOfWeekIso(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() - weekdayIndex(iso));
  return date.toISOString().slice(0, 10);
}

export function WorkoutsScreen() {
  const sessions = useSessions();
  const templates = useTemplates();
  const today = todayIso();
  const [adding, setAdding] = useState(false);
  // The template to prefill the form with (null = blank manual session).
  const [formInitial, setFormInitial] = useState<TemplateInitial | null>(null);
  // Bumped whenever the form should re-seed, so AddSessionForm remounts.
  const [formKey, setFormKey] = useState(0);

  function openBlank() {
    setFormInitial(null);
    setFormKey((k) => k + 1);
    setAdding(true);
  }

  function openFromTemplate(initial: TemplateInitial) {
    setFormInitial(initial);
    setFormKey((k) => k + 1);
    setAdding(true);
  }

  const weekStartIso = useMemo(() => startOfWeekIso(today), [today]);

  const weekSessions = useMemo(
    () => sessions.filter((s) => s.performedOn >= weekStartIso),
    [sessions, weekStartIso],
  );

  const weekMinutes = useMemo(
    () => weekSessions.reduce((sum, s) => sum + (s.durationMin ?? 0), 0),
    [weekSessions],
  );

  // Sessions-per-day across the current Mon–Sun week for the bar chart.
  const weeklyChart = useMemo(() => {
    const counts = Array.from({ length: DAYS_IN_WEEK }, () => 0);
    for (const s of weekSessions) {
      if (s.performedOn >= weekStartIso) counts[weekdayIndex(s.performedOn)] += 1;
    }
    return WEEKDAY_LABELS.map((label, i) => ({ label, value: counts[i] }));
  }, [weekSessions, weekStartIso]);

  const hasSessions = sessions.length > 0;

  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      <PageHeader
        eyebrow="Lịch tập"
        title="Nhật ký tập luyện"
        subtitle={
          hasSessions
            ? `${weekSessions.length} buổi tập trong tuần này`
            : "Ghi lại buổi tập để theo dõi tiến độ của bạn"
        }
        action={
          <button
            type="button"
            onClick={openBlank}
            aria-label="Ghi buổi tập"
            className="inline-flex h-11 w-11 items-center justify-center rounded-btn bg-primary text-primary-fg shadow-glow transition-transform active:scale-95"
          >
            <Plus size={22} />
          </button>
        }
      />

      {/* Quick-start templates (shown in both empty and populated states) */}
      <TemplatesSection
        templates={templates}
        onStart={openFromTemplate}
        onRemove={removeTemplate}
      />

      {hasSessions ? (
        <>
          {/* Week stats */}
          <section aria-labelledby="stats-heading" className="flex flex-col gap-3">
            <SectionHeader id="stats-heading">Tổng quan tuần này</SectionHeader>
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Số buổi"
                value={weekSessions.length}
                unit="buổi"
                icon={<Dumbbell size={18} aria-hidden />}
              />
              <StatTile
                label="Tổng thời lượng"
                value={fmt(weekMinutes)}
                unit="phút"
                icon={<Clock size={18} aria-hidden />}
              />
            </div>
          </section>

          {/* Weekly sessions chart */}
          <section aria-labelledby="chart-heading" className="flex flex-col gap-3">
            <SectionHeader id="chart-heading">Buổi tập theo ngày</SectionHeader>
            <Card raised padding="lg" className="flex flex-col gap-3">
              <p className="text-xs font-medium leading-snug text-muted">
                Số buổi tập mỗi ngày trong tuần này.
              </p>
              <MiniBarChart
                data={weeklyChart}
                height={104}
                ariaLabel="Số buổi tập theo từng ngày trong tuần này"
              />
            </Card>
          </section>

          {/* Recent sessions */}
          <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
            <SectionHeader id="recent-heading">Buổi tập gần đây</SectionHeader>
            <ul className="flex flex-col gap-3">
              {sessions.map((session) => (
                <li key={session.id}>
                  <SessionCard session={session} />
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <section aria-labelledby="empty-heading" className="flex flex-col gap-3">
          <SectionHeader id="empty-heading">Bắt đầu</SectionHeader>
          <Card
            padding="lg"
            className="flex flex-col items-center gap-3 border-dashed text-center"
          >
            <IconBadge tone="primary" size="lg">
              <Dumbbell size={26} aria-hidden />
            </IconBadge>
            <p className="text-sm font-semibold text-text">Chưa có buổi tập nào</p>
            <p className="max-w-[36ch] text-sm text-muted">
              Ghi buổi tập đầu tiên để FitVN theo dõi thời lượng, số bài và khối
              lượng cho bạn.
            </p>
            <button
              type="button"
              onClick={openBlank}
              className="inline-flex items-center gap-2 rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-95"
            >
              <Plus size={16} /> Ghi buổi tập
            </button>
          </Card>
        </section>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Ghi buổi tập">
        <AddSessionForm
          key={formKey}
          today={today}
          initial={formInitial ?? undefined}
          onSaved={() => setAdding(false)}
        />
      </Sheet>
    </main>
  );
}

function TemplatesSection({
  templates,
  onStart,
  onRemove,
}: {
  templates: ReturnType<typeof useTemplates>;
  onStart: (initial: TemplateInitial) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section aria-labelledby="templates-heading" className="flex flex-col gap-3">
      <SectionHeader id="templates-heading">Mẫu tập nhanh</SectionHeader>
      <ul className="flex flex-col gap-3">
        {templates.map((tpl) => (
          <li key={tpl.id}>
            <TemplateCard
              name={tpl.name}
              exerciseCount={tpl.exercises.length}
              isUser
              onStart={() =>
                onStart({ name: tpl.name, exercises: tpl.exercises })
              }
              onRemove={() => onRemove(tpl.id)}
            />
          </li>
        ))}
        {PRESET_TEMPLATES.map((preset) => (
          <li key={preset.id}>
            <TemplateCard
              name={preset.name}
              exerciseCount={preset.exercises.length}
              onStart={() =>
                onStart({
                  name: preset.name,
                  exercises: preset.exercises.map((ex) => ({ ...ex })),
                })
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function TemplateCard({
  name,
  exerciseCount,
  isUser = false,
  onStart,
  onRemove,
}: {
  name: string;
  exerciseCount: number;
  isUser?: boolean;
  onStart: () => void;
  onRemove?: () => void;
}) {
  return (
    <Card padding="md" className="flex items-center gap-3">
      <IconBadge tone="primary" size="md">
        <LayoutTemplate size={20} aria-hidden />
      </IconBadge>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-text">{name}</p>
          {isUser ? <Pill tone="primary">Của bạn</Pill> : null}
        </div>
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
          <Hash size={12} aria-hidden />
          {exerciseCount} bài
        </p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-btn bg-primary px-3 py-2 text-xs font-semibold text-primary-fg shadow-glow transition-transform active:scale-95"
      >
        <Play size={14} aria-hidden /> Bắt đầu
      </button>
      {isUser && onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Xóa mẫu ${name}`}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted transition hover:bg-surface-raised hover:text-danger"
        >
          <Trash2 size={16} />
        </button>
      ) : null}
    </Card>
  );
}

function SessionCard({ session }: { session: WorkoutSession }) {
  const volume = sessionVolume(session);
  const exerciseCount = session.exercises.length;

  return (
    <Card padding="md" className="flex items-start gap-3">
      <IconBadge tone="primary" size="md">
        <Dumbbell size={22} aria-hidden />
      </IconBadge>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-sm font-bold text-text">{session.name}</p>
          <span className="shrink-0 text-[11px] font-medium text-muted">
            {shortDateVi(session.performedOn)}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-muted">
          {session.durationMin != null ? (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} aria-hidden />
              {fmt(session.durationMin)} phút
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Hash size={12} aria-hidden />
            {exerciseCount} bài
          </span>
          {volume > 0 ? (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Weight size={12} aria-hidden />
              {fmt(volume)} kg
            </span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => removeSession(session.id)}
        aria-label={`Xóa ${session.name}`}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted transition hover:bg-surface-raised hover:text-danger"
      >
        <Trash2 size={16} />
      </button>
    </Card>
  );
}

/** A draft exercise being built in the form (mirrors LoggedExercise shape). */
interface DraftExercise {
  id: string;
  name: string;
  sets: LoggedSet[];
}

function emptySet(): LoggedSet {
  return { reps: null, weightKg: null };
}

function newDraftExercise(): DraftExercise {
  return { id: newId(), name: "", sets: [emptySet()] };
}

/** Build draft exercises from a template: each exercise gets `setCount` empty
 *  sets (reps/weight null). Always at least one set per exercise. */
function draftsFromInitial(initial: TemplateInitial): DraftExercise[] {
  if (initial.exercises.length === 0) return [newDraftExercise()];
  return initial.exercises.map((ex) => ({
    id: newId(),
    name: ex.name,
    sets: Array.from({ length: Math.max(1, ex.setCount) }, emptySet),
  }));
}

function AddSessionForm({
  today,
  initial,
  onSaved,
}: {
  today: string;
  initial?: TemplateInitial;
  onSaved: () => void;
}) {
  // Seeded once at mount; the parent remounts via `key` when `initial` changes.
  const [name, setName] = useState(initial?.name ?? DEFAULT_SESSION_NAME);
  const [duration, setDuration] = useState("");
  const [exercises, setExercises] = useState<DraftExercise[]>(() =>
    initial ? draftsFromInitial(initial) : [newDraftExercise()],
  );
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  function updateExercise(id: string, patch: Partial<DraftExercise>) {
    setExercises((list) =>
      list.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)),
    );
  }

  function updateSet(
    exId: string,
    index: number,
    patch: Partial<LoggedSet>,
  ) {
    setExercises((list) =>
      list.map((ex) =>
        ex.id === exId
          ? {
              ...ex,
              sets: ex.sets.map((set, i) =>
                i === index ? { ...set, ...patch } : set,
              ),
            }
          : ex,
      ),
    );
  }

  function addSet(exId: string) {
    setExercises((list) =>
      list.map((ex) =>
        ex.id === exId ? { ...ex, sets: [...ex.sets, emptySet()] } : ex,
      ),
    );
  }

  function removeSet(exId: string, index: number) {
    setExercises((list) =>
      list.map((ex) =>
        ex.id === exId
          ? { ...ex, sets: ex.sets.filter((_, i) => i !== index) }
          : ex,
      ),
    );
  }

  function addExercise() {
    setExercises((list) => [...list, newDraftExercise()]);
  }

  function removeExercise(id: string) {
    setExercises((list) => list.filter((ex) => ex.id !== id));
  }

  const namedExercises = exercises.filter((ex) => ex.name.trim().length > 0);
  const canSave = name.trim().length > 0 && namedExercises.length > 0;

  function submit() {
    if (!canSave) return;
    const builtExercises: LoggedExercise[] = namedExercises.map((ex) => ({
      id: ex.id,
      name: ex.name.trim(),
      // Keep only sets that carry at least one value; default to one empty set
      // so an exercise always has structure.
      sets: ex.sets
        .filter((s) => s.reps != null || s.weightKg != null)
        .map((s) => ({ reps: s.reps, weightKg: s.weightKg })),
    }));

    const parsedDuration = duration.trim() === "" ? null : Number(duration);
    const durationMin =
      parsedDuration != null && Number.isFinite(parsedDuration) && parsedDuration > 0
        ? parsedDuration
        : null;

    addSession({
      name: name.trim(),
      performedOn: today,
      durationMin,
      exercises: builtExercises,
    });

    if (saveAsTemplate) {
      addTemplate({
        name: name.trim(),
        exercises: namedExercises.map((ex) => ({
          name: ex.name.trim(),
          setCount: Math.max(1, ex.sets.length),
        })),
      });
    }

    onSaved();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Session name */}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-text">Tên buổi tập</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Ngực và tay sau"
          className="w-full rounded-btn border border-border bg-surface px-4 py-3 text-base text-text outline-none placeholder:text-muted focus:border-primary"
        />
      </label>

      {/* Duration */}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-text">
          Thời lượng <span className="font-normal text-muted">(phút, không bắt buộc)</span>
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="60"
          className="w-full rounded-btn border border-border bg-surface px-4 py-3 text-base text-text outline-none placeholder:text-muted focus:border-primary"
        />
      </label>

      {/* Exercise builder */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-sm font-semibold text-text">Bài tập</span>
          <span className="text-xs text-muted">{exercises.length} bài</span>
        </div>

        {exercises.map((ex, exIndex) => (
          <div
            key={ex.id}
            className="flex flex-col gap-3 rounded-card bg-surface-raised p-3"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums text-muted">
                {exIndex + 1}
              </span>
              <input
                type="text"
                value={ex.name}
                onChange={(e) => updateExercise(ex.id, { name: e.target.value })}
                placeholder="Tên bài tập"
                className="min-w-0 flex-1 rounded-btn border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none placeholder:text-muted focus:border-primary"
              />
              <button
                type="button"
                onClick={() => removeExercise(ex.id)}
                disabled={exercises.length <= 1}
                aria-label="Xóa bài tập"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-btn text-muted transition hover:bg-surface hover:text-danger disabled:opacity-40"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Sets */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-0.5 text-[11px] font-semibold text-muted">
                <span className="w-5 shrink-0 text-center">#</span>
                <span className="flex-1 text-center">Số lần</span>
                <span className="flex-1 text-center">Tạ (kg)</span>
                <span className="w-9 shrink-0" />
              </div>
              {ex.sets.map((set, setIndex) => (
                <div key={setIndex} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums text-muted">
                    {setIndex + 1}
                  </span>
                  <NumberField
                    ariaLabel={`Số lần, hiệp ${setIndex + 1}`}
                    value={set.reps}
                    placeholder="reps"
                    onChange={(v) => updateSet(ex.id, setIndex, { reps: v })}
                  />
                  <NumberField
                    ariaLabel={`Tạ kg, hiệp ${setIndex + 1}`}
                    value={set.weightKg}
                    placeholder="kg"
                    onChange={(v) => updateSet(ex.id, setIndex, { weightKg: v })}
                  />
                  <button
                    type="button"
                    onClick={() => removeSet(ex.id, setIndex)}
                    disabled={ex.sets.length <= 1}
                    aria-label={`Xóa hiệp ${setIndex + 1}`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-btn text-muted transition hover:bg-surface hover:text-danger disabled:opacity-40"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addSet(ex.id)}
                className="inline-flex items-center justify-center gap-1.5 rounded-btn border border-dashed border-border py-2 text-xs font-semibold text-muted transition-colors hover:border-primary/50 hover:text-primary"
              >
                <Plus size={14} /> Thêm hiệp
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addExercise}
          className="inline-flex items-center justify-center gap-2 rounded-btn border border-dashed border-border py-2.5 text-sm font-semibold text-muted transition-colors hover:border-primary/50 hover:text-primary"
        >
          <Plus size={16} /> Thêm bài tập
        </button>
      </div>

      {/* Save as template toggle */}
      <label className="flex cursor-pointer items-center gap-3 rounded-card bg-surface-raised p-3">
        <input
          type="checkbox"
          checked={saveAsTemplate}
          onChange={(e) => setSaveAsTemplate(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-primary"
        />
        <span className="flex min-w-0 flex-col">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-text">
            <LayoutTemplate size={15} aria-hidden /> Lưu làm mẫu
          </span>
          <span className="text-xs text-muted">
            Dùng lại buổi tập này cho lần sau.
          </span>
        </span>
      </label>

      {!canSave ? (
        <p className="text-xs text-muted">
          Nhập tên buổi tập và ít nhất một bài tập để lưu.
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={!canSave}
        className="inline-flex h-12 items-center justify-center rounded-btn bg-primary text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        Lưu buổi tập
      </button>
    </div>
  );
}

/** Numeric input that maps empty string ⇄ null and parses to a finite number. */
function NumberField({
  value,
  placeholder,
  ariaLabel,
  onChange,
}: {
  value: number | null;
  placeholder: string;
  ariaLabel: string;
  onChange: (value: number | null) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      aria-label={ariaLabel}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") {
          onChange(null);
          return;
        }
        const parsed = Number(raw);
        onChange(Number.isFinite(parsed) ? parsed : null);
      }}
      className="min-w-0 flex-1 rounded-btn border border-border bg-surface px-3 py-2.5 text-center text-sm tabular-nums text-text outline-none placeholder:text-muted focus:border-primary"
    />
  );
}
