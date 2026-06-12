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

import {
  CalendarCheck,
  Compass,
  Dumbbell,
  Timer,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

interface QuickAction {
  readonly label: string;
  readonly prompt: string;
  readonly icon: LucideIcon;
}

const QUICK_ACTIONS: ReadonlyArray<QuickAction> = [
  {
    icon: CalendarCheck,
    label: 'Tổng kết tuần',
    prompt: 'Tổng kết tuần của tôi: dinh dưỡng và tập luyện, kèm đề xuất.',
  },
  {
    icon: Dumbbell,
    label: 'Còn thiếu protein?',
    prompt: 'Hôm nay tôi còn thiếu bao nhiêu protein?',
  },
  {
    icon: UtensilsCrossed,
    label: 'Gợi ý món ăn',
    prompt: 'Gợi ý món ăn cho lượng macro còn lại của tôi hôm nay.',
  },
  {
    icon: Compass,
    label: 'Hôm nay nên làm gì?',
    prompt: 'Hôm nay tôi nên ưu tiên làm gì?',
  },
  {
    icon: Timer,
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
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.prompt}
            type="button"
            disabled={disabled}
            onClick={() => onSend(action.prompt)}
            className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3.5 py-2 text-sm font-medium text-text shadow-card transition-colors hover:border-primary/60 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon size={16} className="text-primary" aria-hidden />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
