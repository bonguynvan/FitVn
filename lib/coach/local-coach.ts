/**
 * Local rule-based coach — a deterministic Vietnamese fallback used when no
 * ANTHROPIC_API_KEY is configured. It reasons over the same {@link CoachContext}
 * the AI uses, so the app gives genuinely useful, personalized answers offline /
 * unconfigured. When the key is set, the Claude path takes over (see route).
 *
 * Pure string assembly (no I/O) → cheap and testable.
 */

import { FOODS } from "@/lib/data/foods-db";
import type { CoachContext } from "./types";

const round = (n: number) => Math.round(n);

/** High-protein, everyday Vietnamese foods for filling a protein gap. */
const PROTEIN_PICK_IDS = ["uc-ga", "trung-ga", "dau-phu", "ca-ro-phi", "tom", "thit-bo"];

/** Max realistic single-portion suggestion (g) — avoids "583g trứng". */
const MAX_PORTION_G = 200;

/** Suggest 2–3 foods + realistic portions to help fill `gapG` grams of protein. */
function suggestProteinFoods(gapG: number): string[] {
  if (gapG <= 0) return [];
  const share = gapG / 3; // aim to spread across ~3 picks
  const picks = PROTEIN_PICK_IDS.map((id) => FOODS.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f) && f!.per100g.protein > 5)
    // Densest protein first → the top suggestion is the most efficient.
    .sort((a, b) => b.per100g.protein - a.per100g.protein);

  return picks.slice(0, 3).map((f) => {
    const ideal = (share / f.per100g.protein) * 100;
    const grams = Math.min(MAX_PORTION_G, Math.max(30, round(ideal)));
    const protein = round((f.per100g.protein * grams) / 100);
    const kcal = round((f.per100g.calories * grams) / 100);
    return `${f.name} ~${grams}g (≈${protein}g đạm, ${kcal} kcal)`;
  });
}

const bullets = (items: string[]) => items.map((s) => `• ${s}`).join("\n");

function summary(ctx: CoachContext): string {
  const { today, profile } = ctx;
  const name = profile.fullName ? ` ${profile.fullName}` : "";
  const r = today.remaining;
  const lines: string[] = [];

  lines.push(`Chào${name}! Tóm tắt hôm nay:`);
  if (today.hasLog) {
    lines.push(
      `• Đã nạp: ${today.consumed.calories} kcal · đạm ${today.consumed.proteinG}g · tinh bột ${today.consumed.carbsG}g · béo ${today.consumed.fatG}g`,
    );
  } else {
    lines.push("• Bạn chưa ghi món nào hôm nay.");
  }
  if (r.calories != null) {
    lines.push(
      r.calories >= 0
        ? `• Còn lại ${r.calories} kcal để đạt mục tiêu.`
        : `• Đã vượt mục tiêu calo ${Math.abs(r.calories)} kcal.`,
    );
  } else {
    lines.push("• Bạn chưa đặt mục tiêu calo — vào Hồ sơ để thiết lập nhé.");
  }
  return lines.join("\n");
}

function macroAdvice(ctx: CoachContext): string {
  const r = ctx.today.remaining;
  if (r.calories == null && r.proteinG == null) {
    return "Bạn chưa đặt mục tiêu dinh dưỡng. Vào tab Hồ sơ để thiết lập, mình sẽ tính phần còn lại cho từng bữa.";
  }
  const lines: string[] = ["Macro còn lại hôm nay:"];
  if (r.calories != null)
    lines.push(`• Calo: ${r.calories >= 0 ? `còn ${r.calories}` : `vượt ${Math.abs(r.calories)}`} kcal`);
  if (r.proteinG != null)
    lines.push(`• Đạm: ${r.proteinG >= 0 ? `còn ${r.proteinG}` : `vượt ${Math.abs(r.proteinG)}`} g`);
  if (r.carbsG != null)
    lines.push(`• Tinh bột: ${r.carbsG >= 0 ? `còn ${r.carbsG}` : `vượt ${Math.abs(r.carbsG)}`} g`);
  if (r.fatG != null)
    lines.push(`• Béo: ${r.fatG >= 0 ? `còn ${r.fatG}` : `vượt ${Math.abs(r.fatG)}`} g`);

  const gap = r.proteinG ?? 0;
  if (gap > 5) {
    const picks = suggestProteinFoods(gap);
    if (picks.length) {
      lines.push("", `Gợi ý lấp ${round(gap)}g đạm còn thiếu:`, bullets(picks));
    }
  }
  return lines.join("\n");
}

function proteinAdvice(ctx: CoachContext): string {
  const gap = ctx.today.remaining.proteinG;
  if (gap == null)
    return "Bạn chưa đặt mục tiêu đạm. Đặt mục tiêu trong Hồ sơ để mình gợi ý khẩu phần phù hợp.";
  if (gap <= 0) return `Bạn đã đủ (thậm chí vượt ${Math.abs(gap)}g) đạm hôm nay. Rất tốt!`;
  const picks = suggestProteinFoods(gap);
  return [`Bạn còn thiếu khoảng ${round(gap)}g đạm. Vài lựa chọn quen thuộc:`, bullets(picks)].join(
    "\n",
  );
}

function goutAdvice(ctx: CoachContext): string {
  const h = ctx.health;
  const lines: string[] = [];
  // Surface the latest acid-uric reading if logged.
  const uric = ctx.markers?.find((m) => m.name === "Acid uric");
  if (uric) {
    lines.push(
      `Acid uric gần nhất: ${uric.valueText} ${uric.unit} (${uric.statusLabel}).`,
    );
  }
  if (h) {
    const over = h.purineMg > h.purineLimitMg;
    lines.push(
      `Purin hôm nay: ${h.purineMg} / ${h.purineLimitMg} mg${h.goutMode ? " (chế độ gout)" : ""}.`,
      over
        ? "Đã vượt ngưỡng — hạn chế nội tạng, hải sản, thịt đỏ và nước hầm xương phần còn lại của ngày."
        : "Vẫn trong ngưỡng an toàn. Ưu tiên đạm ít purin: trứng, sữa, đậu phụ, ức gà nạc.",
    );
  }
  lines.push("Uống đủ nước giúp đào thải acid uric. Đây là gợi ý dinh dưỡng, không thay thế tư vấn bác sĩ.");
  return lines.join("\n");
}

/** Report out-of-range health markers + advice. */
function markersAdvice(ctx: CoachContext): string {
  const markers = ctx.markers ?? [];
  if (markers.length === 0)
    return "Bạn chưa ghi chỉ số sức khỏe nào. Vào tab Tiến độ → Chỉ số sức khỏe để ghi acid uric, huyết áp, đường huyết, mỡ máu…";
  const abnormal = markers.filter((m) => m.status !== "normal");
  const lines = ["Chỉ số sức khỏe gần nhất:"];
  for (const m of markers) {
    lines.push(`• ${m.name}: ${m.valueText} ${m.unit} — ${m.statusLabel}`);
  }
  if (abnormal.length === 0) {
    lines.push("Tất cả đều trong ngưỡng bình thường. Giữ vững nhé!");
  } else {
    lines.push(
      "",
      `Cần chú ý: ${abnormal.map((m) => m.name).join(", ")}. Điều chỉnh ăn uống/vận động và đi khám nếu kéo dài.`,
    );
  }
  lines.push("Đây là tham khảo, không thay thế chẩn đoán của bác sĩ.");
  return lines.join("\n");
}

function periWorkoutAdvice(): string {
  return [
    "Ăn quanh buổi tập:",
    "• Trước tập 1–2 giờ: tinh bột dễ tiêu + ít đạm (cơm/khoai lang + ức gà/trứng) để có năng lượng.",
    "• Sau tập trong 1–2 giờ: 20–40g đạm + tinh bột để phục hồi (ức gà + cơm, hoặc sữa/whey + chuối).",
    "• Uống đủ nước; nếu tập sáng sớm, một quả chuối trước tập là đủ.",
  ].join("\n");
}

function waterAdvice(): string {
  return "Mục tiêu nước hiển thị ở tab Dinh dưỡng. Hãy uống đều trong ngày; tăng thêm khi tập nặng hoặc trời nóng.";
}

function workoutAdvice(ctx: CoachContext): string {
  const w = ctx.todayWorkout;
  const daysTrained =
    ctx.weekly?.daysTrained ?? ctx.history7d.filter((d) => d.didWorkout).length;
  const lines: string[] = [];
  if (w && w.exercises.length > 0) {
    lines.push(`Buổi tập hôm nay: ${w.exercises.length} bài, ${w.durationMin ?? "?"} phút. Tốt lắm!`);
  } else {
    lines.push("Hôm nay bạn chưa ghi buổi tập nào.");
  }
  if (ctx.weekly && ctx.weekly.totalSessions > 0) {
    const wk = ctx.weekly;
    lines.push(
      `Tuần qua: ${daysTrained}/7 ngày, ${wk.totalSessions} buổi, ${wk.totalSets} set, khối lượng ${wk.totalVolumeKg} kg.`,
    );
    if (wk.topExercise) lines.push(`Bài tập nhiều nhất: ${wk.topExercise}.`);
  } else {
    lines.push(`Tuần qua bạn tập ${daysTrained}/7 ngày.`);
  }
  lines.push(
    daysTrained >= 3
      ? "Tần suất ổn — giữ đều và tăng tải từ từ (progressive overload)."
      : "Cố gắng đạt 3–4 buổi/tuần để tiến bộ đều đặn.",
  );
  return lines.join("\n");
}

/** A data-backed weekly review across nutrition + training. */
function weeklyReview(ctx: CoachContext): string {
  const wk = ctx.weekly;
  if (!wk || (wk.daysLogged === 0 && wk.totalSessions === 0)) {
    return "Chưa đủ dữ liệu tuần này. Ghi bữa ăn và buổi tập vài ngày để mình nhận xét xu hướng nhé.";
  }
  const lines: string[] = ["Nhận xét 7 ngày qua:"];

  // Nutrition
  if (wk.daysLogged > 0) {
    lines.push(
      `• Dinh dưỡng: ghi ${wk.daysLogged}/7 ngày, calo TB ${wk.avgCalories} kcal, đạm TB ${wk.avgProteinG} g (đủ đạm ${wk.proteinGoalDays} ngày).`,
    );
    if (wk.purineOverDays > 0)
      lines.push(`• ⚠️ Vượt purin ${wk.purineOverDays} ngày — chú ý nếu bạn quản lý gout.`);
    if (wk.sodiumOverDays > 0)
      lines.push(`• ⚠️ Vượt natri ${wk.sodiumOverDays} ngày — giảm muối/đồ chế biến sẵn.`);
    if (wk.avgFiberG < 20)
      lines.push(`• Chất xơ TB ${wk.avgFiberG} g hơi thấp — thêm rau, đậu, trái cây.`);
  } else {
    lines.push("• Dinh dưỡng: chưa ghi ngày nào — bắt đầu ghi để theo dõi nhé.");
  }

  // Training
  if (wk.totalSessions > 0) {
    lines.push(
      `• Tập luyện: ${wk.daysTrained}/7 ngày, ${wk.totalSessions} buổi, khối lượng ${wk.totalVolumeKg} kg.`,
    );
  } else {
    lines.push("• Tập luyện: chưa ghi buổi nào tuần này.");
  }

  // One actionable suggestion
  if (wk.daysTrained < 3) lines.push("→ Mục tiêu tuần tới: tập ít nhất 3 buổi.");
  else if (wk.proteinGoalDays < wk.daysLogged)
    lines.push("→ Mục tiêu tuần tới: đủ đạm nhiều ngày hơn để hỗ trợ phục hồi.");
  else lines.push("→ Bạn đang rất đều đặn — giữ vững và tăng tải từ từ!");

  return lines.join("\n");
}

/** Detect intent from the user's message and craft a personalized reply. */
export function generateLocalReply(ctx: CoachContext, userText: string): string {
  const q = userText.toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => q.includes(k));

  let body: string;
  if (has("gout", "gút", "purin", "purine", "acid uric", "uric")) body = goutAdvice(ctx);
  else if (
    has("chỉ số", "huyết áp", "đường huyết", "tiểu đường", "cholesterol", "mỡ máu",
      "triglyceride", "ldl", "hdl", "xét nghiệm", "máu", "nhịp tim")
  )
    body = markersAdvice(ctx);
  else if ((has("trước", "sau", "before", "after") && has("tập", "buổi tập")) )
    body = periWorkoutAdvice();
  else if (has("nhận xét", "tuần", "tổng kết", "review", "đánh giá"))
    body = weeklyReview(ctx);
  else if (has("đạm", "protein")) body = proteinAdvice(ctx);
  else if (has("nước", "water", "uống")) body = waterAdvice();
  else if (has("workout", "gym", "exercise", "buổi tập", "tập"))
    body = workoutAdvice(ctx);
  else if (has("món", "ăn gì", "gợi ý", "suggest", "eat", "macro", "calo", "calories", "còn lại"))
    body = macroAdvice(ctx);
  else if (q.trim() === "" || has("chào", "hi", "hello", "tóm tắt", "summary", "tình hình"))
    body = summary(ctx);
  else body = `${summary(ctx)}\n\nBạn có thể hỏi mình về: macro còn lại, gợi ý món ăn, đạm, purin/gout, nước, hoặc buổi tập.`;

  return body;
}
