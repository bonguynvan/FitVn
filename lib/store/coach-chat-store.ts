"use client";

import { readLocal, removeLocal, writeLocal } from "./local-store";

/**
 * Local persistence for the coach conversation so it survives reload and tab
 * navigation. Device-local only (not part of the cloud-sync blob) — chat history
 * is ephemeral and per-device. Bounded to the most recent messages.
 */

const KEY = "fitvn:coach-chat:v1";
const MAX_MESSAGES = 50;

/** Minimal shape we rely on; the AI SDK UIMessage is a superset. */
export interface StoredChatMessage {
  id: string;
  role: string;
  [extra: string]: unknown;
}

export function readChatMessages(): StoredChatMessage[] {
  const v = readLocal<StoredChatMessage[]>(KEY, []);
  return Array.isArray(v) ? v : [];
}

export function writeChatMessages(messages: readonly StoredChatMessage[]): void {
  // Keep only the tail to bound storage growth.
  writeLocal(KEY, messages.slice(-MAX_MESSAGES));
}

export function clearChatMessages(): void {
  removeLocal(KEY);
}
