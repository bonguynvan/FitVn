'use client';

/**
 * FitVN — a single chat message bubble.
 *
 * Renders the text parts of a v5 UIMessage. User and assistant bubbles get
 * distinct alignment, color, and corner treatment so the conversation reads
 * as a real dialogue rather than a flat gray log. `whitespace-pre-wrap`
 * preserves the model's line breaks and bullet formatting.
 */

import type { UIMessage } from 'ai';
import { Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: UIMessage;
}

/** Join all text parts of a message; ignore non-text parts for now. */
function getText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === 'text' ? part.text : ''))
    .join('');
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const text = getText(message);

  return (
    <div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      data-role={message.role}
    >
      <div className={`flex max-w-[85%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && (
          <span className="mb-1 ml-1 flex items-center gap-1 text-xs font-semibold text-muted">
            <Bot size={14} aria-hidden /> HLV FitVN
          </span>
        )}
        <div
          className={
            isUser
              ? 'rounded-card rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-fg shadow-card'
              : 'rounded-card rounded-bl-sm border border-border bg-surface px-4 py-2.5 text-sm leading-relaxed text-text shadow-card'
          }
        >
          <p className="whitespace-pre-wrap break-words">{text}</p>
        </div>
      </div>
    </div>
  );
}
