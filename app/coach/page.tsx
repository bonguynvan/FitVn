import type { Metadata } from 'next';
import { Bot } from 'lucide-react';

import { CoachChat } from '@/components/coach/CoachChat';
import { BrandHero } from '@/components/nav/BrandHero';
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
      <BrandHero
        eyebrow="Huấn luyện viên AI"
        title="HLV FitVN"
        subtitle="Hỏi đáp dinh dưỡng & tập luyện, cá nhân hoá theo macro và buổi tập của bạn hôm nay."
        icon={
          <IconBadge tone="accent" size="lg" className="bg-white/20 text-primary-fg shadow-card">
            <Bot size={26} aria-hidden />
          </IconBadge>
        }
      />

      <CoachChat />
    </main>
  );
}
