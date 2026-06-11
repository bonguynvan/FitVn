'use client';

/**
 * FitVN — Coach quick-action prompt chips.
 *
 * Presets the four highest-value coaching questions so the user can start a
 * conversation in one tap. Each chip calls the parent's `onSend` callback,
 * which wires into useChat's sendMessage({ text }).
 *
 * Chips are disabled while the assistant is responding to avoid stacking
 * requests, and the whole strip hides itself once a conversation is under way
 * (the parent decides via `visible`) to keep the chat focused.
 */

interface QuickAction {
  readonly label: string;
  readonly prompt: string;
  readonly emoji: string;
}

const QUICK_ACTIONS: ReadonlyArray<QuickAction> = [
  {
    emoji: '💪',
    label: 'Còn thiếu protein?',
    prompt: 'Hôm nay tôi còn thiếu bao nhiêu protein?',
  },
  {
    emoji: '🍱',
    label: 'Gợi ý món ăn',
    prompt: 'Gợi ý món ăn cho lượng macro còn lại của tôi hôm nay.',
  },
  {
    emoji: '📊',
    label: 'Nhận xét tuần tập',
    prompt: 'Nhận xét tuần tập vừa rồi của tôi và đề xuất điều chỉnh.',
  },
  {
    emoji: '⏱️',
    label: 'Ăn quanh buổi tập',
    prompt: 'Tôi nên ăn gì trước và sau buổi tập?',
  },
];

interface QuickActionsProps {
  /** Called with the preset prompt text when a chip is tapped. */
  onSend: (text: string) => void;
  /** Disable chips while the assistant is streaming. */
  disabled?: boolean;
}

export function QuickActions({ onSend, disabled = false }: QuickActionsProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Câu hỏi gợi ý cho HLV AI"
    >
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSend(action.prompt)}
          className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3.5 py-2 text-sm font-medium text-text shadow-card transition-colors hover:border-primary/60 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden>{action.emoji}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}
