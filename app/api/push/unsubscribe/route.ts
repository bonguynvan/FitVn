import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/push/unsubscribe
 *
 * Removes the caller's subscription row for a given endpoint. RLS guarantees a
 * user can only delete their own rows, but we additionally scope the delete to
 * the authenticated user_id for defense in depth.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UnsubscribeSchema = z.object({
  endpoint: z.string().url(),
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

  const parsed = UnsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Thiếu endpoint hợp lệ." },
      { status: 422 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", parsed.data.endpoint);

  if (error) {
    return NextResponse.json(
      { error: "Không huỷ được đăng ký thông báo." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
