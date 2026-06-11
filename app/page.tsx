import Link from "next/link";

import { PushManager } from "@/components/pwa/PushManager";

type Section = {
  href: string;
  emoji: string;
  title: string;
  description: string;
  cta: string;
};

const SECTIONS: ReadonlyArray<Section> = [
  {
    href: "/coach",
    emoji: "🤖",
    title: "Huấn luyện viên AI",
    description: "Hỏi đáp về tập luyện và dinh dưỡng cùng trợ lý AI tiếng Việt.",
    cta: "Trò chuyện ngay",
  },
  {
    href: "/workouts",
    emoji: "🏋️",
    title: "Lịch tập",
    description: "Theo dõi buổi tập, bài tập và tiến độ theo tuần.",
    cta: "Xem lịch tập",
  },
  {
    href: "/nutrition",
    emoji: "🥗",
    title: "Dinh dưỡng",
    description: "Ghi lại món ăn, tính calo và macro mỗi ngày.",
    cta: "Ghi món ăn",
  },
  {
    href: "/progress",
    emoji: "📈",
    title: "Tiến độ",
    description: "Cân nặng, số đo và thành tích cá nhân theo thời gian.",
    cta: "Xem tiến độ",
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col gap-6 pb-safe pt-safe">
      {/* Header band — asymmetric, branded, not a centered hero */}
      <header className="relative overflow-hidden rounded-card bg-primary px-5 pb-7 pt-8 text-primary-fg shadow-glow">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-accent/40 blur-2xl"
        />
        <p className="text-sm font-medium uppercase tracking-widest opacity-90">
          FitVN
        </p>
        <h1 className="mt-1 max-w-[18ch] text-3xl font-extrabold leading-tight">
          Khỏe hơn mỗi ngày, theo cách của bạn.
        </h1>
        <p className="mt-3 max-w-[34ch] text-sm leading-relaxed opacity-95">
          Tập luyện, dinh dưỡng và huấn luyện viên AI — tất cả trong một ứng dụng
          hoạt động cả khi ngoại tuyến.
        </p>
        <Link
          href="/coach"
          className="mt-5 inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-bold text-accent-fg transition-transform active:scale-95"
        >
          Bắt đầu với HLV AI
          <span aria-hidden>→</span>
        </Link>
      </header>

      {/* Section cards — varied emphasis, bento-ish rhythm */}
      <section aria-labelledby="sections-heading" className="flex flex-col gap-3">
        <h2
          id="sections-heading"
          className="px-1 text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Khám phá
        </h2>
        <ul className="grid grid-cols-2 gap-3">
          {SECTIONS.map((section, index) => (
            <li
              key={section.href}
              className={index === 0 ? "col-span-2" : "col-span-1"}
            >
              <Link
                href={section.href}
                className="group flex h-full flex-col gap-2 rounded-card border border-border bg-surface p-4 shadow-card transition-colors hover:border-primary/60 active:scale-[0.99]"
              >
                <span className="text-2xl" aria-hidden>
                  {section.emoji}
                </span>
                <span className="text-base font-bold text-text">
                  {section.title}
                </span>
                <span className="text-sm leading-snug text-muted">
                  {section.description}
                </span>
                <span className="mt-auto pt-1 text-sm font-semibold text-primary group-hover:underline">
                  {section.cta}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Notification opt-in — wires the Web Push flow into the live UI */}
      <section aria-labelledby="notify-heading" className="flex flex-col gap-3">
        <h2
          id="notify-heading"
          className="px-1 text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Thông báo
        </h2>
        <PushManager />
      </section>

      <footer className="mt-auto px-1 pt-2 text-center text-xs text-muted">
        FitVN · Ứng dụng PWA cho người Việt
      </footer>
    </main>
  );
}
