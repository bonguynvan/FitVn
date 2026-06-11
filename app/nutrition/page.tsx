import type { Metadata } from "next";

import { NutritionScreen } from "@/components/nutrition/NutritionScreen";

export const metadata: Metadata = { title: "Dinh dưỡng" };

export default function NutritionPage() {
  return <NutritionScreen />;
}
