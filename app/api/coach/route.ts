/**
 * FitVN — AI Coach route handler.
 *
 * POST /api/coach
 *   body: { messages: UIMessage[], context?: CoachContext, preset?: 'quick' | 'default' }
 *
 * The app is local-first: the client builds the personalized CoachContext from
 * localStorage (see lib/coach/build-context) and sends it with each request, so
 * this route does not depend on Supabase auth or server data.
 *
 * Two modes:
 *   - ANTHROPIC_API_KEY set  → stream a personalized answer from Claude
 *       ('quick' → Haiku, default → Sonnet), grounded in the context.
 *   - key absent             → stream a deterministic, rule-based Vietnamese
 *       reply (lib/coach/local-coach) so the coach is useful out of the box.
 *
 * Both modes return the AI SDK v5 UI message stream the chat client expects.
 */

import { anthropic } from '@ai-sdk/anthropic';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from 'ai';

import { buildSystemPrompt } from '@/lib/coach/system-prompt';
import { generateLocalReply } from '@/lib/coach/local-coach';
import type { CoachContext } from '@/lib/coach/types';

export const maxDuration = 30;

const MODEL_DEFAULT = 'claude-sonnet-4-6';
const MODEL_QUICK = 'claude-haiku-4-5-20251001';

interface CoachRequestBody {
  messages?: UIMessage[];
  context?: CoachContext;
  preset?: 'quick' | 'default';
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Extract the plain text of the latest user message. */
function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m.role !== 'user') continue;
    return m.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join(' ')
      .trim();
  }
  return '';
}

/** A safe default context when the client did not send one. */
const EMPTY_CONTEXT: CoachContext = {
  profile: {
    fullName: null,
    goal: null,
    activityLevel: null,
    heightCm: null,
    weightKg: null,
    targets: { calories: null, proteinG: null, carbsG: null, fatG: null },
  },
  today: {
    date: '',
    hasLog: false,
    consumed: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    remaining: { calories: null, proteinG: null, carbsG: null, fatG: null },
    meals: [],
  },
  todayWorkout: null,
  history7d: [],
  health: null,
};

/** Stream a fixed string as a UI message (chunked for a natural typing feel). */
function streamLocalReply(text: string): Response {
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const id = 'local-1';
      writer.write({ type: 'text-start', id });
      // Chunk by line so the client renders progressively.
      for (const piece of text.split('\n')) {
        writer.write({ type: 'text-delta', id, delta: piece + '\n' });
      }
      writer.write({ type: 'text-end', id });
    },
  });
  return createUIMessageStreamResponse({ stream });
}

export async function POST(req: Request): Promise<Response> {
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

  const context = body.context ?? EMPTY_CONTEXT;

  // --- Local fallback when no model key is configured. ----------------------
  if (!process.env.ANTHROPIC_API_KEY) {
    const reply = generateLocalReply(context, lastUserText(messages));
    return streamLocalReply(reply);
  }

  // --- Claude path. ---------------------------------------------------------
  try {
    const system = buildSystemPrompt(context);
    const model = body.preset === 'quick' ? MODEL_QUICK : MODEL_DEFAULT;

    const result = streamText({
      model: anthropic(model),
      system,
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error('[coach] stream error:', error);
        return 'Đã xảy ra lỗi khi tạo phản hồi. Vui lòng thử lại.';
      },
    });
  } catch (error) {
    console.error('[coach] route error:', error);
    // Fall back to the local coach rather than failing the request outright.
    const reply = generateLocalReply(context, lastUserText(messages));
    return streamLocalReply(reply);
  }
}
