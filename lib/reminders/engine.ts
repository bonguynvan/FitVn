/**
 * Reminder engine — pure logic deciding which reminders are currently "due",
 * given the user's settings and today's local state. No I/O, so it's testable
 * and drives both the in-app banner and (when permitted) OS notifications.
 *
 * Reminders evaluate while the app is open (in-app banner always; OS
 * notification if permission granted). True background/scheduled push when the
 * app is closed requires the server + a scheduler — see docs/ROADMAP.md.
 */

import type { ReminderSettings } from "@/lib/store/reminders-store";

export type ReminderKey = "water" | "mealLog" | "markerRecheck" | "measurement";

export interface DueReminder {
  key: ReminderKey;
  title: string;
  body: string;
  /** Where to go to act on it. */
  href: string;
}

export interface ReminderInput {
  settings: ReminderSettings;
  /** Current local time as "HH:MM". */
  nowHHMM: string;
  /** Today as yyyy-mm-dd. */
  todayIso: string;
  waterCups: number;
  waterGoal: number;
  mealsToday: number;
  /** Most recent health-marker date (yyyy-mm-dd) or null if none logged. */
  lastMarkerIso: string | null;
  /** Most recent body-measurement date (yyyy-mm-dd) or null if none logged. */
  lastMeasurementIso: string | null;
  /** Reminder keys already dismissed today. */
  dismissed: ReadonlyArray<string>;
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00`).getTime();
  const b = new Date(`${toIso}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function computeDueReminders(input: ReminderInput): DueReminder[] {
  const {
    settings,
    nowHHMM,
    todayIso,
    waterCups,
    waterGoal,
    mealsToday,
    lastMarkerIso,
    lastMeasurementIso,
    dismissed,
  } = input;
  const due: DueReminder[] = [];
  const isDismissed = (k: ReminderKey) => dismissed.includes(k);

  if (
    settings.water.enabled &&
    nowHHMM >= settings.water.time &&
    waterCups < waterGoal &&
    !isDismissed("water")
  ) {
    due.push({
      key: "water",
      title: "Nhắc uống nước",
      body: `Còn ${waterGoal - waterCups} ly để đạt mục tiêu hôm nay.`,
      href: "/nutrition",
    });
  }

  if (
    settings.mealLog.enabled &&
    nowHHMM >= settings.mealLog.time &&
    mealsToday === 0 &&
    !isDismissed("mealLog")
  ) {
    due.push({
      key: "mealLog",
      title: "Nhắc ghi bữa ăn",
      body: "Bạn chưa ghi món nào hôm nay.",
      href: "/nutrition",
    });
  }

  if (settings.markerRecheck.enabled && !isDismissed("markerRecheck")) {
    const overdue =
      lastMarkerIso == null ||
      daysBetween(lastMarkerIso, todayIso) >= settings.markerRecheck.everyDays;
    if (overdue) {
      due.push({
        key: "markerRecheck",
        title: "Đo lại chỉ số sức khỏe",
        body: lastMarkerIso
          ? `Đã ${daysBetween(lastMarkerIso, todayIso)} ngày kể từ lần đo gần nhất.`
          : "Bạn chưa ghi chỉ số nào — hãy đo và theo dõi.",
        href: "/progress",
      });
    }
  }

  if (settings.measurement.enabled && !isDismissed("measurement")) {
    const overdue =
      lastMeasurementIso == null ||
      daysBetween(lastMeasurementIso, todayIso) >= settings.measurement.everyDays;
    if (overdue) {
      due.push({
        key: "measurement",
        title: "Cập nhật số đo cơ thể",
        body: lastMeasurementIso
          ? `Đã ${daysBetween(lastMeasurementIso, todayIso)} ngày kể từ lần cân gần nhất.`
          : "Bạn chưa ghi số đo nào — hãy cân để theo dõi tiến độ.",
        href: "/progress",
      });
    }
  }

  return due;
}
