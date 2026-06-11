import type { Metadata } from "next";

import { ProfileScreen } from "@/components/profile/ProfileScreen";

export const metadata: Metadata = { title: "Hồ sơ" };

export default function ProfilePage() {
  return <ProfileScreen />;
}
