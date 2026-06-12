"use client";

import { useEffect, useState } from "react";
import { Bell, Droplet, HeartPulse, UtensilsCrossed } from "lucide-react";

import { Card, IconBadge, SectionHeader, Toggle } from "@/components/ui";
import { setReminder, useReminderSettings } from "@/lib/store/reminders-store";

/** Reminder preferences + device-notification opt-in (Profile screen). */
export function RemindersSection() {
  const s = useReminderSettings();
  const [mounted, setMounted] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && "Notification" in window) {
      setPerm(Notification.permission);
    } else {
      setPerm("unsupported");
    }
  }, []);

  async function requestPerm() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPerm(result);
  }

  const inputClass =
    "rounded-btn border border-border bg-surface px-3 py-2 text-sm font-semibold text-text outline-none focus:border-primary";

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader>Nhắc nhở</SectionHeader>
      <Card padding="md" className="flex flex-col gap-1 divide-y divide-border">
        <Row
          icon={<Droplet size={18} aria-hidden />}
          title="Uống nước"
          hint="Nhắc nếu chưa đủ nước"
          enabled={s.water.enabled}
          onToggle={() => setReminder("water", { enabled: !s.water.enabled })}
        >
          <input
            type="time"
            value={s.water.time}
            onChange={(e) => setReminder("water", { time: e.target.value })}
            aria-label="Giờ nhắc uống nước"
            className={inputClass}
          />
        </Row>
        <Row
          icon={<UtensilsCrossed size={18} aria-hidden />}
          title="Ghi bữa ăn"
          hint="Nhắc nếu chưa ghi món nào"
          enabled={s.mealLog.enabled}
          onToggle={() => setReminder("mealLog", { enabled: !s.mealLog.enabled })}
        >
          <input
            type="time"
            value={s.mealLog.time}
            onChange={(e) => setReminder("mealLog", { time: e.target.value })}
            aria-label="Giờ nhắc ghi bữa ăn"
            className={inputClass}
          />
        </Row>
        <Row
          icon={<HeartPulse size={18} aria-hidden />}
          title="Đo lại chỉ số"
          hint="Nhắc đo lại sau số ngày"
          enabled={s.markerRecheck.enabled}
          onToggle={() =>
            setReminder("markerRecheck", { enabled: !s.markerRecheck.enabled })
          }
        >
          <span className="flex items-center gap-1.5 text-sm text-muted">
            mỗi
            <input
              type="number"
              min={1}
              max={365}
              value={s.markerRecheck.everyDays}
              onChange={(e) =>
                setReminder("markerRecheck", {
                  everyDays: Math.max(1, Number(e.target.value) || 1),
                })
              }
              aria-label="Số ngày đo lại"
              className={`${inputClass} w-16 text-center`}
            />
            ngày
          </span>
        </Row>
      </Card>

      {mounted && perm !== "unsupported" ? (
        perm === "granted" ? (
          <p className="px-1 text-xs text-muted">
            Đã bật thông báo thiết bị — nhắc nhở sẽ hiện khi đến hạn lúc mở app.
          </p>
        ) : perm === "denied" ? (
          <p className="px-1 text-xs text-muted">
            Thông báo đang bị chặn. Nhắc nhở vẫn hiển thị trong app ở Trang chủ.
          </p>
        ) : (
          <button
            type="button"
            onClick={requestPerm}
            className="inline-flex items-center justify-center gap-2 rounded-btn border border-border bg-surface px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-primary/40 active:scale-[0.98]"
          >
            <Bell size={16} aria-hidden /> Bật thông báo thiết bị
          </button>
        )
      ) : null}
    </section>
  );
}

function Row({
  icon,
  title,
  hint,
  enabled,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  enabled: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <IconBadge tone={enabled ? "primary" : "muted"} size="sm">
          {icon}
        </IconBadge>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-text">{title}</span>
          <span className="block text-[11px] leading-tight text-muted">{hint}</span>
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-3">
        {enabled ? children : null}
        <Toggle checked={enabled} onChange={onToggle} ariaLabel={title} />
      </div>
    </div>
  );
}
