// FitVN — AI Coach Supabase Edge Function (Deno).
//
// The native client (and, eventually, the web app) call this single endpoint so
// the coach lives with the rest of the backend instead of being tied to the
// Next.js deployment. Local-first: the client sends the personalized `context`
// built from its local store, so this function fetches no user data.
//
// Modes:
//   - ANTHROPIC_API_KEY set → call Claude (Messages API) grounded in context.
//   - key absent            → return a deterministic Vietnamese fallback so the
//                             coach is useful out of the box.
//
// Response shape (native contract): { "reply": string }. Token streaming is a
// later enhancement; the web app keeps its own AI SDK streaming route until it
// is migrated onto this function.
//
// Deploy: supabase functions deploy coach
// Secrets: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

const MODEL_DEFAULT = "claude-sonnet-4-6";
const MODEL_QUICK = "claude-haiku-4-5-20251001";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CoachMessage {
  role: "user" | "assistant";
  text: string;
}

interface CoachBody {
  messages?: CoachMessage[];
  context?: Record<string, unknown>;
  preset?: "quick" | "default";
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}

/** Minimal Vietnamese fallback. TODO(phase 2.5): port lib/coach/local-coach. */
function localReply(messages: CoachMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  const q = last?.text?.trim() ?? "";
  return q
    ? `Mình đã nhận câu hỏi: "${q}". Hãy cấu hình ANTHROPIC_API_KEY để nhận tư vấn chi tiết từ HLV AI.`
    : "Xin chào! Mình là HLV AI của FitVN. Hãy hỏi mình về dinh dưỡng hoặc tập luyện.";
}

/** Compact system prompt. TODO(phase 2.5): port lib/coach/system-prompt. */
function systemPrompt(context: Record<string, unknown>): string {
  return [
    "Bạn là HLV sức khỏe AI của FitVN, trả lời bằng tiếng Việt, ngắn gọn và thực tế.",
    "Dựa trên dữ liệu cá nhân hoá của người dùng dưới đây (JSON):",
    JSON.stringify(context),
    "Không chẩn đoán y khoa; khuyên gặp bác sĩ khi cần.",
  ].join("\n");
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: CoachBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Yêu cầu không hợp lệ." }, 400);
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: "Thiếu nội dung tin nhắn." }, 400);
  }
  const context = body.context ?? {};

  const key = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
  const hasValidKey = key.startsWith("sk-ant-") && !key.includes("your-");
  if (!hasValidKey) {
    return json({ reply: localReply(messages) });
  }

  try {
    const model = body.preset === "quick" ? MODEL_QUICK : MODEL_DEFAULT;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemPrompt(context),
        messages: messages.map((m) => ({
          role: m.role,
          content: m.text,
        })),
      }),
    });

    if (!res.ok) {
      console.error("[coach] anthropic error", res.status, await res.text());
      return json({ reply: localReply(messages) });
    }

    const data = await res.json();
    const reply =
      (data?.content?.[0]?.text as string | undefined) ?? localReply(messages);
    return json({ reply });
  } catch (err) {
    console.error("[coach] error", err);
    return json({ reply: localReply(messages) });
  }
});
