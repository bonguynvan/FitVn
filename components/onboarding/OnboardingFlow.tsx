"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Flame, Sparkles } from "lucide-react";

import { Card, IconBadge, NumberField, Toggle } from "@/components/ui";
import {
  ACTIVITY_OPTIONS,
  GOAL_OPTIONS,
  SEX_OPTIONS,
  computeTargets,
  type UserProfile,
} from "@/lib/fitness/targets";
import { PROFILE_BOUNDS, clampProfileMetrics } from "@/lib/fitness/profile-bounds";
import {
  CONDITION_ORDER,
  CONDITIONS,
  hasCondition,
  type ConditionKey,
} from "@/lib/health/conditions";
import { getProfile, saveProfile } from "@/lib/store/profile-store";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

const DEFAULTS: UserProfile = {
  name: "",
  goal: "maintain",
  sex: "male",
  age: 25,
  heightCm: 170,
  weightKg: 65,
  activityLevel: "moderate",
  targetWeightKg: null,
  conditions: [],
};

const STEPS = ["Chào mừng", "Mục tiêu", "Cơ thể", "Sức khỏe"] as const;

/** First-run guided setup: name → goal → body → health, then saves the profile. */
export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<UserProfile>(() => getProfile() ?? DEFAULTS);

  const targets = useMemo(() => computeTargets(form), [form]);
  const set = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Only the first step gates progress (a name personalizes everything).
  const canContinue = step !== 0 || form.name.trim().length > 0;

  function next() {
    if (step < STEPS.length - 1 && canContinue) setStep((s) => s + 1);
  }

  function toggleCondition(key: ConditionKey) {
    setForm((f) => {
      const cur = f.conditions ?? [];
      const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
      return { ...f, conditions: next, goutMode: next.includes("gout") };
    });
  }

  function finish() {
    const conditions = form.conditions ?? [];
    // Validate body metrics here — not while typing — so partial entries are
    // never rewritten under the user's cursor.
    const clamped = clampProfileMetrics(form);
    saveProfile({
      ...clamped,
      name: clamped.name.trim(),
      conditions,
      goutMode: conditions.includes("gout"),
      customTargets: null,
    });
    router.push("/");
  }

  return (
    <main className="flex min-h-dvh flex-1 flex-col gap-6 px-5 pb-safe pt-safe">
      {/* Progress */}
      <div className="flex items-center gap-2 pt-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              className={`h-1.5 rounded-pill transition-colors ${
                i <= step ? "bg-primary" : "bg-surface-raised"
              }`}
            />
            <span className={`text-[11px] ${i === step ? "font-semibold text-text" : "text-muted"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {step === 0 ? (
        <div className="flex flex-1 flex-col gap-5">
          <IconBadge tone="primary" size="lg">
            <Sparkles size={26} aria-hidden />
          </IconBadge>
          <div>
            <h1 className="text-2xl font-extrabold leading-tight text-text">
              Chào mừng đến FitVN
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Theo dõi dinh dưỡng, tập luyện và sức khỏe — cá nhân hoá cho người Việt.
              Hãy thiết lập vài thông tin để tính mục tiêu phù hợp với bạn.
            </p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-text">Tên hiển thị</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  next();
                }
              }}
              autoFocus
              placeholder="Tên của bạn"
              className="w-full rounded-btn border border-border bg-surface px-4 py-3 text-base text-text outline-none placeholder:text-muted focus:border-primary"
            />
            <span className="text-[11px] text-muted">
              FitVN dùng tên này để cá nhân hoá lời khuyên của bạn.
            </span>
          </label>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-1 flex-col gap-5">
          <Field label="Mục tiêu của bạn">
            <div className="grid grid-cols-1 gap-2">
              {GOAL_OPTIONS.map((g) => (
                <Choice
                  key={g.value}
                  active={form.goal === g.value}
                  onClick={() => set("goal", g.value)}
                  title={g.label}
                  hint={g.hint}
                />
              ))}
            </div>
          </Field>
          <Field label="Giới tính">
            <div className="grid grid-cols-3 gap-2">
              {SEX_OPTIONS.map((s) => (
                <Choice
                  key={s.value}
                  active={form.sex === s.value}
                  onClick={() => set("sex", s.value)}
                  title={s.label}
                />
              ))}
            </div>
          </Field>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-1 flex-col gap-5">
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Tuổi" value={form.age} onChange={(v) => set("age", v)} min={PROFILE_BOUNDS.age.min} max={PROFILE_BOUNDS.age.max} />
            <NumberField label="Cao (cm)" value={form.heightCm} onChange={(v) => set("heightCm", v)} min={PROFILE_BOUNDS.heightCm.min} max={PROFILE_BOUNDS.heightCm.max} />
            <NumberField label="Nặng (kg)" value={form.weightKg} onChange={(v) => set("weightKg", v)} min={PROFILE_BOUNDS.weightKg.min} max={PROFILE_BOUNDS.weightKg.max} />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-text">
              Cân nặng mục tiêu <span className="font-medium text-muted">(kg, tùy chọn)</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={30}
              max={250}
              value={form.targetWeightKg ?? ""}
              onChange={(e) =>
                set("targetWeightKg", e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder="Ví dụ: 60"
              className="w-full rounded-btn border border-border bg-surface px-4 py-3 text-base font-semibold text-text outline-none placeholder:font-normal placeholder:text-muted focus:border-primary"
            />
          </label>
          <Field label="Mức vận động">
            <div className="flex flex-col gap-2">
              {ACTIVITY_OPTIONS.map((a) => (
                <Choice
                  key={a.value}
                  active={form.activityLevel === a.value}
                  onClick={() => set("activityLevel", a.value)}
                  title={a.label}
                />
              ))}
            </div>
          </Field>
          <TargetSummaryCard targets={targets} />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-1 flex-col gap-5">
          <div>
            <h1 className="text-2xl font-extrabold leading-tight text-text">Tình trạng sức khỏe</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Chọn tình trạng (nếu có) để FitVN điều chỉnh cảnh báo và lời khuyên. Có thể bỏ qua.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {CONDITION_ORDER.map((key) => {
              const def = CONDITIONS[key];
              const on = hasCondition(form.conditions, key);
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between gap-2 rounded-btn border px-4 py-3 transition-colors ${
                    on ? "border-primary bg-primary/10" : "border-border bg-surface"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleCondition(key)}
                    className="flex min-w-0 flex-1 flex-col text-left"
                  >
                    <span className="text-sm font-medium text-text">{def.label}</span>
                    <span className="text-[11px] leading-tight text-muted">{def.hint}</span>
                  </button>
                  <Toggle checked={on} onChange={() => toggleCondition(key)} ariaLabel={def.label} />
                </div>
              );
            })}
          </div>
          {/* Payoff: the personalized target the user is about to start with. */}
          <TargetSummaryCard targets={targets} />
        </div>
      ) : null}

      {/* Nav */}
      <div className="mt-auto flex items-center gap-2 pb-4">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-btn border border-border bg-surface px-4 text-sm font-semibold text-text active:scale-95"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex h-12 items-center justify-center rounded-btn px-4 text-sm font-semibold text-muted active:scale-95"
          >
            Bỏ qua
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            disabled={!canContinue}
            className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-btn bg-primary text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tiếp tục <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-btn bg-primary text-sm font-semibold text-primary-fg shadow-glow active:scale-[0.98]"
          >
            <Check size={16} /> Bắt đầu
          </button>
        )}
      </div>
    </main>
  );
}

function TargetSummaryCard({
  targets,
}: {
  targets: ReturnType<typeof computeTargets>;
}) {
  return (
    <Card raised padding="lg" className="flex items-center gap-4">
      <IconBadge tone="primary" size="md">
        <Flame size={20} aria-hidden />
      </IconBadge>
      <div>
        <p className="text-sm text-muted">Mục tiêu hằng ngày</p>
        <p className="text-2xl font-extrabold text-text">
          {fmt(targets.calories)}{" "}
          <span className="text-base font-semibold text-muted">kcal</span>
        </p>
        <p className="text-xs text-muted">
          Đạm {targets.proteinG}g · Tinh bột {targets.carbsG}g · Béo {targets.fatG}g
        </p>
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-text">{label}</span>
      {children}
    </div>
  );
}

function Choice({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-0.5 rounded-btn border px-4 py-3 text-left transition-colors ${
        active ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-primary/40"
      }`}
    >
      <span className={`text-sm font-semibold ${active ? "text-text" : "text-muted"}`}>{title}</span>
      {hint ? <span className="text-[11px] leading-tight text-muted">{hint}</span> : null}
    </button>
  );
}

