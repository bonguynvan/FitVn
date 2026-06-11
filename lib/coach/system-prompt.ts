/**
 * FitVN — AI Coach system prompt builder.
 *
 * `buildSystemPrompt` turns a resolved `CoachContext` into a single
 * Vietnamese system prompt: a persona + behavioral guardrails section,
 * followed by a compact, machine-readable data block of the user's real
 * numbers so the model answers with the user's actual situation rather than
 * generic advice.
 *
 * Everything is plain string assembly (no I/O), so it is cheap and testable.
 */

import type {
  CoachContext,
  CoachProfile,
  CoachToday,
  CoachTodayWorkout,
  CoachDaySummary,
  MacroRemaining,
} from './types';

// -----------------------------------------------------------------------------
// Vietnamese label maps for enum values.
// -----------------------------------------------------------------------------
const GOAL_VI: Record<string, string> = {
  lose_fat: 'Giảm mỡ',
  gain_muscle: 'Tăng cơ',
  maintain: 'Duy trì',
};

const ACTIVITY_VI: Record<string, string> = {
  sedentary: 'Ít vận động',
  light: 'Vận động nhẹ',
  moderate: 'Vận động vừa',
  active: 'Năng động',
  very_active: 'Rất năng động',
};

const MEAL_VI: Record<string, string> = {
  breakfast: 'Bữa sáng',
  lunch: 'Bữa trưa',
  dinner: 'Bữa tối',
  snack: 'Bữa phụ',
};

/** Render a value that may be unset as a Vietnamese placeholder. */
function orUnset(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === ''
    ? 'chưa thiết lập'
    : String(value);
}

// -----------------------------------------------------------------------------
// Persona + guardrails — the stable "who you are / how you behave" section.
// -----------------------------------------------------------------------------
const PERSONA = `Bạn là "HLV FitVN" — một huấn luyện viên thể hình & dinh dưỡng người Việt.

Tính cách & phong cách:
- Thân thiện, gần gũi, tạo động lực như một người bạn đồng hành, nhưng luôn dựa trên bằng chứng khoa học (evidence-based).
- Trả lời HOÀN TOÀN bằng tiếng Việt, văn phong tự nhiên, dễ hiểu với người tập gym phổ thông.
- Ngắn gọn và đi thẳng vào hành động cụ thể (actionable). Ưu tiên gạch đầu dòng và con số rõ ràng hơn là lý thuyết dài dòng.
- Dùng đơn vị hệ mét (gam, kg, kcal, cm) và văn hoá ẩm thực Việt: khi gợi ý món ăn, ưu tiên món Việt quen thuộc, dễ mua (ví dụ: ức gà luộc, cơm tấm, phở, đậu phụ, trứng, khoai lang, sữa tươi...).
- Luôn dùng SỐ LIỆU THỰC TẾ của người dùng ở khối DỮ LIỆU bên dưới. Tuyệt đối không bịa số hay giả định mục tiêu mà người dùng chưa thiết lập.`;

const GUARDRAILS = `Nguyên tắc an toàn (BẮT BUỘC tuân thủ):
- KHÔNG đưa lời khuyên y khoa hay chẩn đoán bệnh. Nếu người dùng mô tả triệu chứng bệnh, chấn thương nghiêm trọng, rối loạn ăn uống, mang thai, hoặc dùng thuốc/chất bổ sung đặc biệt → khuyên họ gặp bác sĩ hoặc chuyên gia dinh dưỡng được cấp phép.
- KHÔNG khuyến nghị ăn kiêng cực đoan, nhịn ăn kéo dài, cắt calo xuống mức nguy hiểm, hay dùng thuốc giảm cân/doping. Mức thâm hụt/thặng dư calo nên ở ngưỡng an toàn và bền vững (thường ±300–500 kcal/ngày).
- Khi dữ liệu còn thiếu (chưa có mục tiêu, chưa ghi nhật ký), hãy nói rõ điều đó và gợi ý người dùng thiết lập/ghi lại, thay vì đoán bừa.
- Không hứa hẹn kết quả phi thực tế (ví dụ "giảm 10kg trong 1 tuần"). Nhấn mạnh tính bền vững và đều đặn.`;

// -----------------------------------------------------------------------------
// Data block sections.
// -----------------------------------------------------------------------------
function renderProfile(p: CoachProfile): string {
  const lines = [
    `- Tên: ${orUnset(p.fullName)}`,
    `- Mục tiêu: ${p.goal ? GOAL_VI[p.goal] : 'chưa thiết lập'}`,
    `- Mức vận động: ${p.activityLevel ? ACTIVITY_VI[p.activityLevel] : 'chưa thiết lập'}`,
    `- Chiều cao: ${orUnset(p.heightCm)} cm | Cân nặng: ${orUnset(p.weightKg)} kg`,
    `- Mục tiêu calo/ngày: ${orUnset(p.targets.calories)} kcal`,
    `- Mục tiêu macro/ngày: protein ${orUnset(p.targets.proteinG)} g, carb ${orUnset(p.targets.carbsG)} g, fat ${orUnset(p.targets.fatG)} g`,
  ];
  return `HỒ SƠ NGƯỜI DÙNG:\n${lines.join('\n')}`;
}

function renderRemaining(r: MacroRemaining): string {
  const fmt = (label: string, value: number | null, unit: string): string => {
    if (value === null) return `${label}: (chưa đặt mục tiêu)`;
    if (value < 0) return `${label}: đã vượt ${Math.abs(value)}${unit}`;
    return `${label}: còn ${value}${unit}`;
  };
  return [
    fmt('Calo', r.calories, ' kcal'),
    fmt('Protein', r.proteinG, ' g'),
    fmt('Carb', r.carbsG, ' g'),
    fmt('Fat', r.fatG, ' g'),
  ].join(' | ');
}

function renderToday(t: CoachToday): string {
  const header = `HÔM NAY (${t.date}):`;
  if (!t.hasLog) {
    return `${header}\n- Chưa ghi nhật ký ăn uống hôm nay.\n- Còn lại so với mục tiêu: ${renderRemaining(t.remaining)}`;
  }

  const mealLines = t.meals
    .map(
      (m) =>
        `  • ${MEAL_VI[m.mealType] ?? m.mealType}: ${m.foodNameVi} (${m.quantity}${m.unit}) → ${m.contributed.calories} kcal, P ${m.contributed.proteinG}g`,
    )
    .join('\n');

  return [
    header,
    `- Đã nạp: ${t.consumed.calories} kcal | P ${t.consumed.proteinG}g | C ${t.consumed.carbsG}g | F ${t.consumed.fatG}g`,
    `- Còn lại so với mục tiêu: ${renderRemaining(t.remaining)}`,
    `- Các món đã ghi:`,
    mealLines,
  ].join('\n');
}

function renderWorkout(w: CoachTodayWorkout | null): string {
  const header = 'BUỔI TẬP HÔM NAY:';
  if (!w) return `${header}\n- Chưa ghi buổi tập nào hôm nay.`;

  if (w.exercises.length === 0) {
    return `${header}\n- Có buổi tập (${orUnset(w.durationMin)} phút) nhưng chưa ghi bài tập cụ thể.`;
  }

  const exLines = w.exercises
    .map((e) => {
      const reps = e.totalReps === null ? '' : `, tổng ${e.totalReps} reps`;
      const weight =
        e.topWeightKg === null ? '' : `, tạ nặng nhất ${e.topWeightKg}kg`;
      return `  • ${e.nameVi} (${e.muscleGroup}): ${e.sets} set${reps}${weight}`;
    })
    .join('\n');

  return [
    header,
    `- Thời lượng: ${orUnset(w.durationMin)} phút`,
    w.notes ? `- Ghi chú: ${w.notes}` : null,
    '- Bài tập:',
    exLines,
  ]
    .filter((x): x is string => x !== null)
    .join('\n');
}

function renderHistory(history: readonly CoachDaySummary[]): string {
  const header = 'XU HƯỚNG 7 NGÀY (mới nhất trước):';
  if (history.length === 0) return `${header}\n- Chưa có dữ liệu.`;

  const rows = history
    .map((d) => {
      const workout = d.didWorkout ? 'có tập' : 'nghỉ';
      const weight = d.weightKg === null ? '' : `, cân nặng ${d.weightKg}kg`;
      return `  • ${d.date}: ${d.calories} kcal, P ${d.proteinG}g, ${workout}${weight}`;
    })
    .join('\n');

  return `${header}\n${rows}`;
}

// -----------------------------------------------------------------------------
// Public entry point
// -----------------------------------------------------------------------------
export function buildSystemPrompt(ctx: CoachContext): string {
  const dataBlock = [
    '=== DỮ LIỆU NGƯỜI DÙNG (dùng để trả lời, không lặp lại nguyên văn) ===',
    renderProfile(ctx.profile),
    '',
    renderToday(ctx.today),
    '',
    renderWorkout(ctx.todayWorkout),
    '',
    renderHistory(ctx.history7d),
    '=== HẾT DỮ LIỆU ===',
  ].join('\n');

  const closing = `Cách trả lời:
- Dựa vào khối DỮ LIỆU ở trên để cá nhân hoá câu trả lời.
- Nếu người dùng hỏi về macro còn thiếu, hãy gợi ý 2–3 món Việt cụ thể kèm khẩu phần ước lượng để lấp đầy phần còn lại.
- Nếu nhận xét tuần tập, hãy chỉ ra xu hướng (đều đặn? đủ protein? tần suất tập?) và 1–2 điều chỉnh khả thi.
- Giữ câu trả lời gọn, ưu tiên hành động, kết thúc bằng một bước tiếp theo rõ ràng khi phù hợp.`;

  return [PERSONA, '', GUARDRAILS, '', dataBlock, '', closing].join('\n');
}
