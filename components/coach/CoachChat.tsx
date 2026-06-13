'use client';

/**
 * FitVN — AI Coach chat UI (AI SDK v5).
 *
 * Streaming chat against /api/coach using useChat + DefaultChatTransport.
 * Renders message bubbles (text parts only), auto-scrolls to the latest
 * message, shows a typing indicator while the assistant streams, and exposes
 * a stop button. Quick-action chips seed the conversation and disappear once
 * a dialogue is under way. Mobile-first, intentionally styled with the app's
 * design tokens (not a generic gray chat).
 */

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { SendHorizontal, Sparkles, Square, Trash2, Zap } from 'lucide-react';

import { MessageBubble } from './MessageBubble';
import { QuickActions } from './QuickActions';
import { buildLocalCoachContext } from '@/lib/coach/build-context';
import {
  clearChatMessages,
  readChatMessages,
  writeChatMessages,
  type StoredChatMessage,
} from '@/lib/store/coach-chat-store';

/** Empty-state copy shown before the first message. */
const EMPTY_TITLE = 'Chào bạn!';
const EMPTY_BODY =
  'Mình là HLV FitVN. Hỏi mình về dinh dưỡng, macro còn lại hôm nay, hay buổi tập của bạn nhé.';

export function CoachChat() {
  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/coach' }),
  });

  const [input, setInput] = useState('');
  const [quick, setQuick] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  const isBusy = status === 'submitted' || status === 'streaming';
  const hasMessages = messages.length > 0;

  // Rehydrate the saved conversation once after mount (avoids SSR mismatch).
  useEffect(() => {
    const saved = readChatMessages();
    if (saved.length > 0) {
      setMessages(saved as unknown as typeof messages);
    }
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the conversation whenever it settles (not mid-stream).
  useEffect(() => {
    if (!loaded.current || isBusy) return;
    if (messages.length > 0) {
      writeChatMessages(messages as unknown as StoredChatMessage[]);
    }
  }, [messages, isBusy]);

  // Auto-scroll to the newest message / token as the stream grows. Honor the
  // user's reduced-motion preference (instant jump instead of smooth scroll).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [messages, status]);

  function clearConversation() {
    if (isBusy) return;
    setMessages([]);
    clearChatMessages();
  }

  function send(text: string) {
    // Attach a fresh snapshot of the user's local data so the coach answers
    // with real numbers (the server is stateless / local-first). `preset`
    // selects the model: quick → Haiku (cheap/fast), default → Sonnet.
    sendMessage(
      { text },
      {
        body: {
          context: buildLocalCoachContext(),
          preset: quick ? 'quick' : 'default',
        },
      },
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;
    send(text);
    setInput('');
  }

  function handleQuickAction(text: string) {
    if (isBusy) return;
    send(text);
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden">
      {/* Scrollable conversation area */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-card bg-bg/40 p-1"
        aria-live="polite"
        aria-label="Cuộc trò chuyện với HLV AI"
      >
        {!hasMessages && (
          <div className="m-auto flex max-w-[34ch] flex-col items-center gap-3 px-4 py-8 text-center">
            <span
              aria-hidden
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary"
            >
              <Sparkles size={26} />
            </span>
            <p className="text-lg font-bold text-text">{EMPTY_TITLE}</p>
            <p className="text-sm leading-relaxed text-muted">{EMPTY_BODY}</p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Typing indicator while the assistant prepares/streams a reply */}
        {status === 'submitted' && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-card rounded-bl-sm border border-border bg-surface px-4 py-3 shadow-card">
              <Dot delay="0ms" />
              <Dot delay="150ms" />
              <Dot delay="300ms" />
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            Đã có lỗi xảy ra. Vui lòng thử gửi lại tin nhắn.
          </div>
        )}
      </div>

      {/* Quick actions — only before the conversation starts */}
      {!hasMessages && (
        <QuickActions onSend={handleQuickAction} disabled={isBusy} />
      )}

      {/* Clear conversation + quick-analysis (Haiku) toggle */}
      <div className="flex items-center justify-between gap-2">
        {hasMessages ? (
          <button
            type="button"
            onClick={clearConversation}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-danger/40 hover:text-danger active:scale-95 disabled:opacity-50"
          >
            <Trash2 size={14} aria-hidden /> Xóa hội thoại
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          role="switch"
          aria-checked={quick}
          onClick={() => setQuick((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold transition-colors ${
            quick
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-surface text-muted hover:border-primary/40'
          }`}
        >
          <Zap size={14} aria-hidden fill={quick ? 'currentColor' : 'none'} />
          Phân tích nhanh
        </button>
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 rounded-card border border-border bg-surface p-2 shadow-card transition-colors focus-within:border-primary"
      >
        <label htmlFor="coach-input" className="sr-only">
          Nhập câu hỏi cho HLV AI
        </label>
        <textarea
          id="coach-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter inserts a newline.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          rows={1}
          placeholder="Hỏi HLV về dinh dưỡng hoặc buổi tập…"
          className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-text outline-none placeholder:text-muted"
        />

        {isBusy ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-btn bg-danger px-4 text-sm font-bold text-primary-fg transition-transform active:scale-95"
            aria-label="Dừng tạo phản hồi"
          >
            <Square size={16} fill="currentColor" aria-hidden /> Dừng
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-btn bg-primary px-4 text-sm font-bold text-primary-fg transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Gửi tin nhắn"
          >
            Gửi <SendHorizontal size={16} aria-hidden />
          </button>
        )}
      </form>
    </div>
  );
}

/** A single bouncing dot for the typing indicator. */
function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-muted"
      style={{ animationDelay: delay }}
      aria-hidden
    />
  );
}
