import type { Metadata } from "next";

import { ProgressScreen } from "@/components/progress/ProgressScreen";

export const metadata: Metadata = {
  title: "Tiến độ",
  description:
    "Theo dõi cân nặng, số đo cơ thể và xu hướng tiến độ của bạn theo thời gian.",
};

export default function ProgressPage() {
  return <ProgressScreen />;
}
