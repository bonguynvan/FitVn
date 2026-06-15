"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CalendarOff,
  Check,
  Database,
  Flame,
  LogOut,
  UserCircle,
} from "lucide-react";

import { logout } from "@/app/login/actions";
import { BrandHero } from "@/components/nav/BrandHero";
import { Card, CollapsibleSection, IconBadge, NumberField, Toggle } from "@/components/ui";
import {
  ACTIVITY_OPTIONS,
  GOAL_OPTIONS,
  SEX_OPTIONS,
  computeTargets,
  type DailyTargets,
  type UserProfile,
} from "@/lib/fitness/targets";
import { PROFILE_BOUNDS, clampProfileMetrics } from "@/lib/fitness/profile-bounds";
import { getProfile, saveProfile } from "@/lib/store/profile-store";
import { DataSection } from "@/components/profile/DataSection";
import { RemindersSection } from "@/components/profile/RemindersSection";
import { RestDaysSection } from "@/components/profile/RestDaysSection";
import {
  CONDITION_ORDER,
  CONDITIONS,
  hasCondition,
  type ConditionKey,
} from "@/lib/health/conditions";

const DEFAULTS: UserProfile = {
  name: "",
  goal: "maintain",
  sex: "male",
  age: 25,
  heightCm: 170,
  weightKg: 65,
  activityLevel: "moderate",
};

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");
const num = (v: string) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};
const toStrings = (t: DailyTargets) => ({
  calories: String(t.calories),
  proteinG: String(t.proteinG),
  carbsG: String(t.carbsG),
  fatG: String(t.fatG),
});

export function ProfileScreen() {
  const [form, setForm] = useState<UserProfile>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [manual, setManual] = useState(false);
  const [custom, setCustom] = useState({
    calories: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
  });

  // Load the stored profile after mount (avoids SSR/hydration mismatch).
  useEffect(() => {
    const stored = getProfile();
    const base = stored ?? DEFAULTS;
    if (stored) {
      // Migrate legacy goutMode → conditions.
      const conditions =
        stored.conditions ?? (stored.goutMode ? (["gout"] as ConditionKey[]) : []);
      setForm({ ...DEFAULTS, ...stored, conditions });
    }
    if (stored?.customTargets) {
      setManual(true);
      setCustom(toStrings(stored.customTargets));
    } else {
      setCustom(toStrings(computeTargets(base)));
    }
  }, []);

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function setCustomField(key: keyof typeof custom, value: string) {
    setCustom((c) => ({ ...c, [key]: value }));
    setSaved(false);
  }

  function toggleCondition(key: ConditionKey) {
    setForm((f) => {
      const cur = f.conditions ?? [];
      const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
      return { ...f, conditions: next, goutMode: next.includes("gout") };
    });
    setSaved(false);
  }

  const computed = computeTargets(form);
  const customTargets: DailyTargets = {
    calories: num(custom.calories),
    proteinG: num(custom.proteinG),
    carbsG: num(custom.carbsG),
    fatG: num(custom.fatG),
  };
  const targets = manual ? customTargets : computed;

  function toggleManual() {
    setManual((prev) => {
      const next = !prev;
      if (next) setCustom(toStrings(computeTargets(form)));
      return next;
    });
    setSaved(false);
  }

  function onSave() {
    const conditions = form.conditions ?? [];
    // Validate body metrics on save, not while typing. Reflect the clamped
    // values back into the form so the fields show what was actually stored.
    const clamped = clampProfileMetrics(form);
    setForm(clamped);
    saveProfile({
      ...clamped,
      name: clamped.name.trim(),
      conditions,
      goutMode: conditions.includes("gout"),
      customTargets: manual ? customTargets : null,
    });
    setSaved(true);
  }

  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      <BrandHero
        eyebrow="Hồ sơ"
        title="Thông tin & mục tiêu"
        subtitle="Cá nhân hoá mục tiêu calo và macro mỗi ngày"
        backHref="/"
      />

      {/* Computed targets preview */}
      <Card raised padding="lg" className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <IconBadge tone="primary" size="md">
            <Flame size={20} aria-hidden />
          </IconBadge>
          <div>
            <p className="text-sm text-muted">Mục tiêu hàng ngày</p>
            <p className="text-2xl font-semibold text-text">
              {fmt(targets.calories)}{" "}
              <span className="text-base font-medium text-muted">kcal</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Đạm", value: `${targets.proteinG}g` },
            { label: "Tinh bột", value: `${targets.carbsG}g` },
            { label: "Chất béo", value: `${targets.fatG}g` },
          ].map((m) => (
            <div key={m.label} className="rounded-btn bg-surface-raised py-2">
              <p className="text-sm font-semibold text-text">{m.value}</p>
              <p className="text-xs text-muted">{m.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Form */}
      <CollapsibleSection
        title="Thông tin & mục tiêu"
        icon={<UserCircle size={16} aria-hidden />}
        defaultOpen
      >
        <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text">Tên hiển thị</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Tên của bạn"
            className="w-full rounded-btn border border-border bg-surface px-4 py-3 text-base text-text outline-none placeholder:text-muted focus:border-primary"
          />
        </label>

        <Field label="Mục tiêu">
          <div className="grid grid-cols-3 gap-2">
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

        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Tuổi" value={form.age} onChange={(v) => set("age", v)} min={PROFILE_BOUNDS.age.min} max={PROFILE_BOUNDS.age.max} />
          <NumberField label="Cao (cm)" value={form.heightCm} onChange={(v) => set("heightCm", v)} min={PROFILE_BOUNDS.heightCm.min} max={PROFILE_BOUNDS.heightCm.max} />
          <NumberField label="Nặng (kg)" value={form.weightKg} onChange={(v) => set("weightKg", v)} min={PROFILE_BOUNDS.weightKg.min} max={PROFILE_BOUNDS.weightKg.max} />
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text">
            Cân nặng mục tiêu{" "}
            <span className="font-medium text-muted">(kg, tùy chọn)</span>
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
            placeholder="Ví dụ: 65"
            className="w-full rounded-btn border border-border bg-surface px-4 py-3 text-base font-semibold text-text outline-none placeholder:font-normal placeholder:text-muted focus:border-primary"
          />
        </label>

        <Field label="Mức vận động">
          <div className="flex flex-col gap-2">
            {ACTIVITY_OPTIONS.map((a) => {
              const active = form.activityLevel === a.value;
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => set("activityLevel", a.value)}
                  className={`flex items-center justify-between rounded-btn border px-4 py-3 text-left text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary/10 font-semibold text-text"
                      : "border-border bg-surface text-muted hover:border-primary/40"
                  }`}
                >
                  {a.label}
                  {active ? <Check size={18} className="text-primary" /> : null}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Mục tiêu dinh dưỡng">
          <div className="flex items-center justify-between rounded-btn border border-border bg-surface px-4 py-3">
            <span className="text-sm font-medium text-text">Tự đặt mục tiêu</span>
            <Toggle checked={manual} onChange={toggleManual} ariaLabel="Tự đặt mục tiêu" />
          </div>
          {manual ? (
            <div className="grid grid-cols-2 gap-2">
              <CustomField
                label="Calo (kcal)"
                value={custom.calories}
                onChange={(v) => setCustomField("calories", v)}
              />
              <CustomField
                label="Đạm (g)"
                value={custom.proteinG}
                onChange={(v) => setCustomField("proteinG", v)}
              />
              <CustomField
                label="Tinh bột (g)"
                value={custom.carbsG}
                onChange={(v) => setCustomField("carbsG", v)}
              />
              <CustomField
                label="Béo (g)"
                value={custom.fatG}
                onChange={(v) => setCustomField("fatG", v)}
              />
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              Mục tiêu được tính tự động từ thông tin của bạn. Bật để tự nhập.
            </p>
          )}
        </Field>

        <Field label="Tình trạng sức khỏe">
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
        </Field>

        <button
          type="button"
          onClick={onSave}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-primary text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-[0.98]"
        >
          {saved ? (
            <>
              <Check size={18} /> Đã lưu
            </>
          ) : (
            "Lưu hồ sơ"
          )}
        </button>
        </div>
      </CollapsibleSection>

      {/* Reminders */}
      <CollapsibleSection title="Nhắc nhở" icon={<Bell size={16} aria-hidden />}>
        <RemindersSection />
      </CollapsibleSection>

      {/* Planned rest days (protect the workout streak) */}
      <CollapsibleSection title="Ngày nghỉ" icon={<CalendarOff size={16} aria-hidden />}>
        <RestDaysSection />
      </CollapsibleSection>

      {/* Data backup */}
      <CollapsibleSection title="Dữ liệu" icon={<Database size={16} aria-hidden />}>
        <DataSection />
      </CollapsibleSection>

      {/* Account */}
      <CollapsibleSection title="Tài khoản" icon={<LogOut size={16} aria-hidden />}>
        <form action={logout}>
          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-btn border border-border bg-surface text-sm font-semibold text-danger transition-colors hover:border-danger/40 active:scale-[0.98]"
          >
            <LogOut size={18} aria-hidden />
            Đăng xuất
          </button>
        </form>
      </CollapsibleSection>
    </main>
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
      className={`flex flex-col items-center gap-0.5 rounded-btn border px-2 py-2.5 text-center transition-colors ${
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-surface hover:border-primary/40"
      }`}
    >
      <span className={`text-sm font-semibold ${active ? "text-text" : "text-muted"}`}>
        {title}
      </span>
      {hint ? <span className="text-[11px] leading-tight text-muted">{hint}</span> : null}
    </button>
  );
}

function CustomField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="w-full rounded-btn border border-border bg-surface px-3 py-2.5 text-base font-semibold text-text outline-none focus:border-primary"
      />
    </label>
  );
}
