/**
 * Build a short, shareable Vietnamese progress summary from the user's local
 * stats. Pure (no I/O) so it's testable; the UI passes it to the Web Share API
 * or the clipboard.
 */

export interface ProgressSummaryInput {
  name: string | null;
  currentWeightKg: number | null;
  startWeightKg: number | null;
  targetWeightKg: number | null;
  workoutStreak: number;
  weekSessions: number;
  weekVolumeKg: number;
  daysLogged: number;
  avgCalories: number;
}

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");
const fmtKg = (n: number) => (Math.round(n * 10) / 10).toString().replace(".", ",");

export function buildProgressSummary(input: ProgressSummaryInput): string {
  const lines: string[] = [];
  lines.push(input.name ? `Tiến độ FitVN của ${input.name} 💪` : "Tiến độ FitVN của tôi 💪");

  if (input.currentWeightKg != null) {
    let w = `Cân nặng: ${fmtKg(input.currentWeightKg)} kg`;
    if (input.startWeightKg != null && input.startWeightKg !== input.currentWeightKg) {
      const d = input.currentWeightKg - input.startWeightKg;
      w += ` (${d > 0 ? "+" : "−"}${fmtKg(Math.abs(d))} kg từ đầu)`;
    }
    if (input.targetWeightKg != null) {
      const rem = Math.abs(input.currentWeightKg - input.targetWeightKg);
      w += rem === 0 ? " — đã đạt mục tiêu!" : `, còn ${fmtKg(rem)} kg tới mục tiêu`;
    }
    lines.push(w);
  }

  if (input.workoutStreak > 0) lines.push(`Chuỗi tập: ${input.workoutStreak} ngày liên tiếp`);
  if (input.weekSessions > 0) {
    lines.push(
      `Tuần này: ${input.weekSessions} buổi tập${
        input.weekVolumeKg > 0 ? `, khối lượng ${fmt(input.weekVolumeKg)} kg` : ""
      }`,
    );
  }
  if (input.daysLogged > 0) {
    lines.push(`Dinh dưỡng: ghi ${input.daysLogged}/7 ngày, TB ${fmt(input.avgCalories)} kcal/ngày`);
  }

  lines.push("— theo dõi cùng FitVN");
  return lines.join("\n");
}
