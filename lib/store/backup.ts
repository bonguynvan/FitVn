"use client";

import { readLocal, removeLocal, writeLocal } from "./local-store";

/** Every localStorage key that holds user data (auth cookie is separate). */
export const DATA_KEYS = [
  "fitvn:profile:v1",
  "fitvn:nutrition:v1",
  "fitvn:water:v1",
  "fitvn:workouts:v1",
  "fitvn:measurements:v1",
  "fitvn:custom-foods:v2",
  "fitvn:templates:v1",
  "fitvn:prefs:water-goal:v1",
  "fitvn:health:v1",
  "fitvn:checkin:v1",
  "fitvn:meals:v1",
  "fitvn:reminders:v1",
] as const;

/** Snapshot all local user data into a plain object (skips unset keys). */
export function gatherData(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of DATA_KEYS) {
    const value = readLocal<unknown>(key, null);
    if (value !== null) data[key] = value;
  }
  return data;
}

/** True when at least one local data key holds a value. */
export function hasLocalData(): boolean {
  for (const key of DATA_KEYS) {
    if (readLocal<unknown>(key, null) !== null) return true;
  }
  return false;
}

/** Write known keys from a data object into localStorage. Returns count applied. */
export function applyData(data: Record<string, unknown>): number {
  let applied = 0;
  for (const key of DATA_KEYS) {
    if (key in data) {
      writeLocal(key, data[key]);
      applied += 1;
    }
  }
  return applied;
}

interface BackupFile {
  app: "fitvn";
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
}

function buildBackup(): BackupFile {
  return {
    app: "fitvn",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: gatherData(),
  };
}

/** Trigger a download of all local data as a JSON file. */
export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fitvn-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  ok: boolean;
  error?: string;
  imported?: number;
}

/** Restore data from a backup file's JSON text. Only known keys are written. */
export function importBackup(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Tệp không hợp lệ (không đọc được JSON)." };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Tệp không hợp lệ." };
  }
  const file = parsed as Partial<BackupFile>;
  if (file.app !== "fitvn" || !file.data || typeof file.data !== "object") {
    return { ok: false, error: "Đây không phải tệp sao lưu FitVN." };
  }

  const imported = applyData(file.data as Record<string, unknown>);
  if (imported === 0) {
    return { ok: false, error: "Không tìm thấy dữ liệu để nhập." };
  }
  return { ok: true, imported };
}

/** Remove all local user data. */
export function clearAllData(): void {
  for (const key of DATA_KEYS) removeLocal(key);
}
