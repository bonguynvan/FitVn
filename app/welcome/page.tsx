import type { Metadata } from "next";

import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = {
  title: "Bắt đầu · FitVN",
  description: "Thiết lập hồ sơ để FitVN cá nhân hoá mục tiêu của bạn.",
};

/** First-run onboarding. The bottom nav hides here (see BottomNav). */
export default function WelcomePage() {
  return <OnboardingFlow />;
}
