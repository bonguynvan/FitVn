import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/push/subscribe
 *
 * Persists (upserts) the caller's Web Push subscription. Auth is required; the
 * row is owned by the authenticated user and protected by RLS. Conflicts on the
 * globally-unique `endpoint` update the keys/owner (re-subscribe on same
 * device, possibly after a different login).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  userAgent: z.string().max(512).optional(),
});

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

  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu đăng ký thông báo không hợp lệ." },
      { status: 422 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Bạn cần đăng nhập." },
      { status: 401 },
    );
  }

  const { endpoint, p256dh, auth, userAgent } = parsed.data;

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent ?? null,
      },
      { onConflict: "endpoint" },
    );

  if (error) {
    return NextResponse.json(
      { error: "Không lưu được đăng ký thông báo." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
