/**
 * Coach nudge — pick the single most relevant, personalized insight for the
 * home dashboard from the same {@link CoachContext} the chat coach uses. Pure
 * (no I/O) so it's cheap and testable. Returns null when there's nothing worth
 * surfacing (e.g. no profile yet — the ProfileNudge handles that case).
 */

import type { CoachContext } from "./types";

export type NudgeTone = "primary" | "success" | "danger";

export interface CoachNudge {
  readonly tone: NudgeTone;
  readonly title: string;
  readonly text: string;
}

const round = (n: number) => Math.round(n);

/** Local-time hour in Vietnam, to gate "you still need protein" to later in the day. */
function vietnamHour(): number {
  try {
    const s = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "numeric",
      hour12: false,
    }).format(new Date());
    return Number.parseInt(s, 10) || 0;
  } catch {
    return 0;
  }
}

export function coachNudge(ctx: CoachContext): CoachNudge | null {
  // No profile → nothing personalized to say (setup nudge covers this).
  if (!ctx.profile.goal) return null;

  const h = ctx.health;
  const today = ctx.today;

  // 0) High acid uric — strongest health signal; nudge gout management.
  const uric = ctx.markers?.find((m) => m.name === "Acid uric");
  if (uric && uric.status === "high") {
    return {
      tone: "danger",
      title: `Acid uric cao (${uric.valueText} ${uric.unit})`,
      text: ctx.goutMode
        ? "Hỏi HLV cách giảm purin và acid uric trong tuần này."
        : "Cân nhắc bật chế độ gout trong Hồ sơ. Hỏi HLV để được tư vấn.",
    };
  }

  // 0b) Any other out-of-range biomarker.
  const abnormal = ctx.markers?.find((m) => m.status !== "normal");
  if (abnormal) {
    return {
      tone: "danger",
      title: `${abnormal.name}: ${abnormal.statusLabel}`,
      text: `${abnormal.valueText} ${abnormal.unit}. Hỏi HLV cách cải thiện qua ăn uống & vận động.`,
    };
  }

  // 1) Purine over the (gout-aware) ceiling — highest priority health signal.
  if (h && h.purineMg > h.purineLimitMg) {
    return {
      tone: "danger",
      title: "Purin vượt ngưỡng hôm nay",
      text: `${round(h.purineMg)}/${round(h.purineLimitMg)} mg${
        h.goutMode ? " (chế độ gout)" : ""
      }. Hỏi HLV cách điều chỉnh phần còn lại trong ngày.`,
    };
  }

  // 2) Sodium over the daily limit.
  if (h && h.sodiumMg > h.sodiumLimitMg) {
    return {
      tone: "danger",
      title: "Natri hơi cao hôm nay",
      text: `${round(h.sodiumMg)}/${round(h.sodiumLimitMg)} mg. Ưu tiên món ít muối cho bữa sau.`,
    };
  }

  // 3) Nothing logged yet today.
  if (!today.hasLog) {
    return {
      tone: "primary",
      title: "Bắt đầu ngày mới",
      text: "Chưa ghi bữa nào hôm nay. Hỏi HLV nên ăn gì để đạt mục tiêu nhé.",
    };
  }

  // 4) Protein gap, but only nudge from midday onward so mornings aren't noisy.
  const pGap = today.remaining.proteinG;
  if (pGap != null && pGap > 25 && vietnamHour() >= 12) {
    return {
      tone: "primary",
      title: `Còn thiếu ${round(pGap)}g đạm`,
      text: "Hỏi HLV gợi ý vài món giàu đạm cho phần còn lại của ngày.",
    };
  }

  // 5) Calories over target.
  const cGap = today.remaining.calories;
  if (cGap != null && cGap < -100) {
    return {
      tone: "primary",
      title: `Đã vượt ${round(Math.abs(cGap))} kcal`,
      text: "Không sao cả — hỏi HLV cách cân đối lại trong tuần.",
    };
  }

  // 6) On track → positive reinforcement.
  if (cGap != null && cGap >= 0) {
    return {
      tone: "success",
      title: "Bạn đang đi đúng hướng",
      text: `Còn ${round(cGap)} kcal cho hôm nay. Cần gợi ý món? Hỏi HLV nhé.`,
    };
  }

  // Fallback: generic invite.
  return {
    tone: "primary",
    title: "HLV FitVN sẵn sàng",
    text: "Hỏi về macro, món ăn, hay buổi tập — cá nhân hoá theo dữ liệu của bạn.",
  };
}
