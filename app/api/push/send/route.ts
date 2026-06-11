import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { sendPushToUser, type PushPayload } from "@/lib/push/web-push";

/**
 * POST /api/push/send
 *
 * Sends a Web Push notification to a user's devices.
 *
 * AUTHORIZATION — two accepted modes:
 *
 *   1) Self-notify (no special header):
 *        - Requires a logged-in Supabase session.
 *        - `userId` is ignored; the notification is always sent to the
 *          authenticated user only. Used for "send me a test" buttons.
 *
 *   2) Scheduled / server-to-server (CRON):
 *        - Send header  `Authorization: Bearer <CRON_SECRET>`.
 *        - May target any user via `userId` in the body.
 *        - Used by a scheduled job (e.g. Vercel Cron) for reminders.
 *
 * Requests with neither a session nor a valid CRON secret get 401.
 *
 * ---------------------------------------------------------------------------
 * Example payloads
 *
 * Nhắc lịch tập (workout reminder), self-notify:
 *   POST /api/push/send
 *   { "type": "workout_reminder" }
 *
 * Nhắc lịch tập, scheduled for a specific user:
 *   POST /api/push/send
 *   Authorization: Bearer <CRON_SECRET>
 *   { "type": "workout_reminder", "userId": "<uuid>" }
 *
 * Nhắc uống nước (water reminder), scheduled:
 *   POST /api/push/send
 *   Authorization: Bearer <CRON_SECRET>
 *   { "type": "water_reminder", "userId": "<uuid>" }
 *
 * Custom message:
 *   { "type": "custom", "title": "Tuyệt vời!", "body": "Bạn đã đạt mục tiêu protein hôm nay 💪", "url": "/nutrition" }
 * ---------------------------------------------------------------------------
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PresetType = "workout_reminder" | "water_reminder";

/** Built-in Vietnamese notification presets. */
const PRESETS: Record<PresetType, PushPayload> = {
  workout_reminder: {
    title: "Tới giờ tập rồi 💪",
    body: "Buổi tập hôm nay đang chờ bạn. Bắt đầu ngay để giữ chuỗi nhé!",
    url: "/workout/log",
    tag: "workout-reminder",
  },
  water_reminder: {
    title: "Uống nước nào 💧",
    body: "Nhắc nhẹ: uống một ly nước để giữ đủ nước cho cơ thể.",
    url: "/nutrition",
    tag: "water-reminder",
  },
};

const SendSchema = z
  .object({
    type: z
      .enum(["workout_reminder", "water_reminder", "custom"])
      .default("custom"),
    userId: z.string().uuid().optional(),
    title: z.string().min(1).max(120).optional(),
    body: z.string().min(1).max(300).optional(),
    url: z.string().max(512).optional(),
  })
  .refine(
    (v) => v.type !== "custom" || (Boolean(v.title) && Boolean(v.body)),
    { message: "custom yêu cầu title và body." },
  );

function resolvePayload(input: z.infer<typeof SendSchema>): PushPayload {
  if (input.type === "custom") {
    return {
      title: input.title as string,
      body: input.body as string,
      url: input.url,
    };
  }
  const preset = PRESETS[input.type];
  // Allow overriding url on a preset while keeping its copy.
  return input.url ? { ...preset, url: input.url } : preset;
}

/** Constant-time-ish bearer check for the CRON secret. */
function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (header.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= header.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body không hợp lệ (JSON)." },
      { status: 400 },
    );
  }

  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu thông báo không hợp lệ." },
      { status: 422 },
    );
  }

  const payload = resolvePayload(parsed.data);

  // ---- Mode 2: scheduled CRON send (may target any user) ----
  if (isCronAuthorized(request)) {
    const targetUserId = parsed.data.userId;
    if (!targetUserId) {
      return NextResponse.json(
        { error: "Cron send yêu cầu userId." },
        { status: 422 },
      );
    }
    try {
      const result = await sendPushToUser(targetUserId, payload);
      return NextResponse.json({ ok: true, mode: "cron", ...result });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Gửi thất bại." },
        { status: 500 },
      );
    }
  }

  // ---- Mode 1: self-notify (requires a session) ----
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Bạn cần đăng nhập (hoặc gửi CRON_SECRET)." },
      { status: 401 },
    );
  }

  try {
    // Self-notify loads subscriptions through the request-scoped (RLS-bound)
    // client so we never touch the service-role key for a user-initiated send.
    const result = await sendPushToUser(user.id, payload, {
      load: async (uid) => {
        const { data, error } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("user_id", uid);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
      prune: async (endpoint) => {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", endpoint);
      },
    });
    return NextResponse.json({ ok: true, mode: "self", ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gửi thất bại." },
      { status: 500 },
    );
  }
}
