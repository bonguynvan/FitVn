"use client";

import Link from "next/link";
import { ChevronRight, Target } from "lucide-react";

import { IconBadge } from "@/components/ui";
import { useProfile } from "@/lib/store/profile-store";

/** Prompts first-time users to set up their goal; hides once a profile exists. */
export function ProfileNudge() {
  const profile = useProfile();
  if (profile) return null;

  return (
    <Link
      href="/welcome"
      className="lift flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-card hover:border-primary/50"
    >
      <IconBadge tone="primary" size="md">
        <Target size={20} aria-hidden />
      </IconBadge>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">Thiết lập trong 1 phút</p>
        <p className="text-xs leading-snug text-muted">
          Cá nhân hoá mục tiêu calo &amp; macro phù hợp với bạn.
        </p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
    </Link>
  );
}
