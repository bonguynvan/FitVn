/**
 * Health markers — biomarker definitions with adult reference ranges, status
 * evaluation, and short Vietnamese advice. Pure (no I/O), testable.
 *
 * NOT medical advice: ranges are general adult references for orientation only.
 * The UI shows a disclaimer to consult a doctor for diagnosis/treatment.
 */

import type { SexType } from "@/types/database.types";

export type MarkerStatus = "low" | "normal" | "high";
export type MarkerKey =
  | "uric_acid"
  | "glucose_fasting"
  | "blood_pressure"
  | "cholesterol_total"
  | "ldl"
  | "hdl"
  | "triglycerides"
  | "resting_hr";

export interface MarkerEval {
  status: MarkerStatus;
  tone: "success" | "warning" | "danger";
  /** Short Vietnamese label for the status (e.g. "Cao", "Bình thường"). */
  label: string;
  /** One-line actionable advice for the current status. */
  advice: string;
}

export interface MarkerDef {
  key: MarkerKey;
  /** Vietnamese name. */
  name: string;
  unit: string;
  /** Blood pressure carries a second value (diastolic). */
  hasSecond?: boolean;
  secondUnit?: string;
  /** Human-readable normal range, for display. */
  rangeText: string;
  /** Typical input step for the entry control. */
  step: number;
  evaluate: (value: number, value2: number | null, sex: SexType) => MarkerEval;
}

const ok = (label = "Bình thường", advice = "Chỉ số trong ngưỡng bình thường. Duy trì lối sống lành mạnh."): MarkerEval => ({
  status: "normal",
  tone: "success",
  label,
  advice,
});
const hi = (label: string, advice: string): MarkerEval => ({
  status: "high",
  tone: "danger",
  label,
  advice,
});
const lo = (label: string, advice: string): MarkerEval => ({
  status: "low",
  tone: "warning",
  label,
  advice,
});

export const MARKERS: Record<MarkerKey, MarkerDef> = {
  uric_acid: {
    key: "uric_acid",
    name: "Acid uric",
    unit: "µmol/L",
    rangeText: "Nam < 420 · Nữ < 360 µmol/L",
    step: 10,
    evaluate: (v, _2, sex) => {
      const limit = sex === "female" ? 360 : 420;
      if (v > limit)
        return hi(
          "Cao",
          "Acid uric cao làm tăng nguy cơ gout. Hạn chế nội tạng, hải sản, thịt đỏ, bia rượu; uống nhiều nước. Bật chế độ gout trong Hồ sơ.",
        );
      if (v < 150) return lo("Thấp", "Acid uric thấp — thường không đáng lo. Theo dõi cùng bác sĩ nếu cần.");
      return ok();
    },
  },
  glucose_fasting: {
    key: "glucose_fasting",
    name: "Đường huyết lúc đói",
    unit: "mmol/L",
    rangeText: "3,9 – 5,5 mmol/L",
    step: 0.1,
    evaluate: (v) => {
      if (v >= 7) return hi("Cao (nguy cơ tiểu đường)", "Đường huyết đói ≥ 7 mmol/L gợi ý tiểu đường. Hãy đi khám để xác nhận. Giảm đường, tinh bột nhanh; tăng vận động.");
      if (v >= 5.6) return hi("Tiền tiểu đường", "Mức tiền tiểu đường. Giảm đồ ngọt/tinh bột tinh chế, tăng chất xơ và vận động đều.");
      if (v < 3.9) return lo("Thấp", "Đường huyết thấp. Ăn nhẹ và theo dõi; gặp bác sĩ nếu hay bị.");
      return ok();
    },
  },
  blood_pressure: {
    key: "blood_pressure",
    name: "Huyết áp",
    unit: "mmHg",
    hasSecond: true,
    secondUnit: "mmHg",
    rangeText: "< 120/80 mmHg",
    step: 1,
    evaluate: (sys, dia) => {
      const d = dia ?? 0;
      if (sys >= 140 || d >= 90) return hi("Cao", "Huyết áp cao. Giảm muối (< 2 g natri/ngày), hạn chế rượu bia, tăng vận động; đi khám nếu kéo dài.");
      if (sys >= 120 || d >= 80) return hi("Hơi cao", "Huyết áp hơi cao. Theo dõi, giảm muối và căng thẳng, vận động đều.");
      if (sys < 90 || d < 60) return lo("Thấp", "Huyết áp thấp. Uống đủ nước; gặp bác sĩ nếu chóng mặt/mệt.");
      return ok();
    },
  },
  cholesterol_total: {
    key: "cholesterol_total",
    name: "Cholesterol toàn phần",
    unit: "mmol/L",
    rangeText: "< 5,2 mmol/L",
    step: 0.1,
    evaluate: (v) => {
      if (v >= 6.2) return hi("Cao", "Cholesterol cao. Giảm mỡ bão hòa/đồ chiên, tăng rau & chất xơ, vận động; cân nhắc khám.");
      if (v >= 5.2) return hi("Ranh giới cao", "Mức ranh giới. Điều chỉnh chế độ ăn và vận động để đưa về < 5,2.");
      return ok();
    },
  },
  ldl: {
    key: "ldl",
    name: "LDL (mỡ xấu)",
    unit: "mmol/L",
    rangeText: "< 3,4 mmol/L",
    step: 0.1,
    evaluate: (v) => {
      if (v >= 4.1) return hi("Cao", "LDL cao. Giảm mỡ bão hòa và chất béo chuyển hóa; tăng chất xơ hòa tan (yến mạch, đậu).");
      if (v >= 3.4) return hi("Ranh giới cao", "LDL hơi cao. Ưu tiên chất béo tốt (cá, dầu ô liu, hạt).");
      return ok();
    },
  },
  hdl: {
    key: "hdl",
    name: "HDL (mỡ tốt)",
    unit: "mmol/L",
    rangeText: "Nam > 1,0 · Nữ > 1,3 mmol/L",
    step: 0.1,
    evaluate: (v, _2, sex) => {
      const min = sex === "female" ? 1.3 : 1.0;
      if (v < min) return lo("Thấp", "HDL thấp. Tăng vận động, chất béo tốt; bỏ thuốc lá giúp cải thiện HDL.");
      return ok("Tốt", "HDL ở mức tốt — cao có lợi cho tim mạch.");
    },
  },
  triglycerides: {
    key: "triglycerides",
    name: "Triglyceride",
    unit: "mmol/L",
    rangeText: "< 1,7 mmol/L",
    step: 0.1,
    evaluate: (v) => {
      if (v >= 2.3) return hi("Cao", "Triglyceride cao. Giảm đường, rượu bia và tinh bột nhanh; tăng omega-3 và vận động.");
      if (v >= 1.7) return hi("Ranh giới cao", "Hơi cao. Hạn chế đồ ngọt và rượu bia.");
      return ok();
    },
  },
  resting_hr: {
    key: "resting_hr",
    name: "Nhịp tim nghỉ",
    unit: "bpm",
    rangeText: "60 – 100 bpm",
    step: 1,
    evaluate: (v) => {
      if (v > 100) return hi("Cao", "Nhịp tim nghỉ cao. Có thể do căng thẳng, cà phê, thiếu ngủ; nếu kéo dài hãy khám.");
      if (v < 50) return lo("Thấp", "Nhịp tim nghỉ thấp — bình thường ở người tập luyện nhiều; khám nếu chóng mặt.");
      return ok();
    },
  },
};

/** Markers in display order. */
export const MARKER_ORDER: MarkerKey[] = [
  "uric_acid",
  "glucose_fasting",
  "blood_pressure",
  "cholesterol_total",
  "ldl",
  "hdl",
  "triglycerides",
  "resting_hr",
];
