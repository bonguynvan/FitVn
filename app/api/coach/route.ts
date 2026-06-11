/**
 * FitVN — AI Coach streaming route handler.
 *
 * POST /api/coach
 *   body: { messages: UIMessage[], preset?: 'quick' | 'default' }
 *
 * Flow:
 *   1. Authenticate via the RLS-scoped server Supabase client (401 if none).
 *   2. Build the personalized context (getCoachContext) and system prompt.
 *   3. Route to the right Claude model:
 *        - 'quick'   → claude-haiku-4-5  (cheap "phân tích nhanh")
 *        - default   → claude-sonnet-4-6 (best coaching quality)
 *   4. streamText and return a UI message stream (AI SDK v5).
 *
 * The ANTHROPIC_API_KEY env var is read automatically by @ai-sdk/anthropic.
 * All failures return a clean JSON error; the model's own stream errors are
 * sanitized via toUIMessageStreamResponse({ onError }) so we never leak
 * provider internals to the client.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';

import { createClient } from '@/lib/supabase/server';
import { getCoachContext } from '@/lib/coach/context-fetcher';
import { buildSystemPrompt } from '@/lib/coach/system-prompt';

// Allow streaming responses up to 30 seconds.
export const maxDuration = 30;

// Model routing. Sonnet is the default coach; Haiku handles the lightweight
// "phân tích nhanh" preset to keep cost down on simple lookups.
const MODEL_DEFAULT = 'claude-sonnet-4-6';
const MODEL_QUICK = 'claude-haiku-4-5-20251001';

interface CoachRequestBody {
  messages?: UIMessage[];
  preset?: 'quick' | 'default';
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(req: Request): Promise<Response> {
  // --- Parse + validate the request body at the boundary. -------------------
  let body: CoachRequestBody;
  try {
    body = (await req.json()) as CoachRequestBody;
  } catch {
    return jsonError('Yêu cầu không hợp lệ.', 400);
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonError('Thiếu nội dung tin nhắn.', 400);
  }

  // --- Authenticate. --------------------------------------------------------
  let userId: string;
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonError('Bạn cần đăng nhập để dùng HLV AI.', 401);
    }
    userId = user.id;

    // --- Build personalized context + system prompt. ------------------------
    const context = await getCoachContext(userId, supabase);
    const system = buildSystemPrompt(context);

    const model = body.preset === 'quick' ? MODEL_QUICK : MODEL_DEFAULT;

    const result = streamText({
      model: anthropic(model),
      system,
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        // Sanitize: surface a friendly Vietnamese message, log details server-side.
        console.error('[coach] stream error:', error);
        return 'Đã xảy ra lỗi khi tạo phản hồi. Vui lòng thử lại.';
      },
    });
  } catch (error) {
    console.error('[coach] route error:', error);
    return jsonError(
      'Không thể tạo phản hồi từ HLV AI lúc này. Vui lòng thử lại sau.',
      500,
    );
  }
}
