"use client";

import { useEffect, useState } from "react";
import { Check, Flame, LogOut } from "lucide-react";

import { logout } from "@/app/login/actions";
import { PageHeader } from "@/components/nav/PageHeader";
import { Card, IconBadge, SectionHeader } from "@/components/ui";
import {
  ACTIVITY_OPTIONS,
  GOAL_OPTIONS,
  SEX_OPTIONS,
  computeTargets,
  type UserProfile,
} from "@/lib/fitness/targets";
import { getProfile, saveProfile } from "@/lib/store/profile-store";

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

export function ProfileScreen() {
  const [form, setForm] = useState<UserProfile>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  // Load the stored profile after mount (avoids SSR/hydration mismatch).
  useEffect(() => {
    const stored = getProfile();
    if (stored) setForm({ ...DEFAULTS, ...stored });
  }, []);

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  const targets = computeTargets(form);

  function onSave() {
    saveProfile({ ...form, name: form.name.trim() });
    setSaved(true);
  }

  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      <PageHeader
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
      <section className="flex flex-col gap-4">
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
          <NumberField label="Tuổi" value={form.age} onChange={(v) => set("age", v)} min={10} max={100} />
          <NumberField label="Cao (cm)" value={form.heightCm} onChange={(v) => set("heightCm", v)} min={120} max={230} />
          <NumberField label="Nặng (kg)" value={form.weightKg} onChange={(v) => set("weightKg", v)} min={30} max={250} />
        </div>

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
      </section>

      {/* Account */}
      <section className="flex flex-col gap-3">
        <SectionHeader>Tài khoản</SectionHeader>
        <form action={logout}>
          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-btn border border-border bg-surface text-sm font-semibold text-danger transition-colors hover:border-danger/40 active:scale-[0.98]"
          >
            <LogOut size={18} aria-hidden />
            Đăng xuất
          </button>
        </form>
      </section>
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

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        className="w-full rounded-btn border border-border bg-surface px-3 py-3 text-center text-base font-semibold text-text outline-none focus:border-primary"
      />
    </label>
  );
}
