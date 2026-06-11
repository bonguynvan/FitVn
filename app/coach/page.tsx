import type { Metadata } from 'next';
import { Bot } from 'lucide-react';

import { CoachChat } from '@/components/coach/CoachChat';
import { IconBadge } from '@/components/ui';

export const metadata: Metadata = {
  title: 'HLV AI · FitVN',
  description:
    'Trò chuyện với huấn luyện viên thể hình & dinh dưỡng AI tiếng Việt, cá nhân hoá theo dữ liệu của bạn.',
};

/**
 * Coach page — composes a compact header with the streaming chat surface.
 *
 * The page itself is a Server Component; CoachChat is the 'use client'
 * island that owns the useChat streaming state. Layout fills the available
 * height so the composer stays pinned to the bottom on mobile.
 */
export default function CoachPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 pb-safe pt-safe">
      <header className="relative overflow-hidden rounded-card bg-primary px-5 pb-5 pt-6 text-primary-fg shadow-glow">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-accent/40 blur-2xl"
        />
        <div className="flex items-start gap-3">
          <IconBadge tone="accent" size="lg" className="shadow-card">
            <Bot size={26} aria-hidden />
          </IconBadge>
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide opacity-90">
              Huấn luyện viên AI
            </p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight">
              HLV FitVN
            </h1>
            <p className="mt-2 max-w-[40ch] text-sm leading-relaxed opacity-95">
              Hỏi đáp dinh dưỡng &amp; tập luyện, cá nhân hoá theo macro và buổi
              tập của bạn hôm nay.
            </p>
          </div>
        </div>
      </header>

      <CoachChat />
    </main>
  );
}
