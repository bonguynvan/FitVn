/// Health markers — biomarker definitions with adult reference ranges, status
/// evaluation, and short Vietnamese advice. Pure (no I/O), testable. Ported
/// from `lib/health/markers.ts`.
///
/// NOT medical advice: ranges are general adult references for orientation only.

import 'enums.dart' show SexType;

enum MarkerStatus { low, normal, high }

enum MarkerTone { success, warning, danger }

enum MarkerKey {
  uricAcid('uric_acid'),
  glucoseFasting('glucose_fasting'),
  bloodPressure('blood_pressure'),
  cholesterolTotal('cholesterol_total'),
  ldl('ldl'),
  hdl('hdl'),
  triglycerides('triglycerides'),
  restingHr('resting_hr');

  const MarkerKey(this.wire);

  final String wire;

  static MarkerKey fromWire(String value) =>
      values.firstWhere((e) => e.wire == value);
}

class MarkerEval {
  const MarkerEval({
    required this.status,
    required this.tone,
    required this.label,
    required this.advice,
  });

  final MarkerStatus status;
  final MarkerTone tone;

  /// Short Vietnamese label for the status (e.g. "Cao", "Bình thường").
  final String label;

  /// One-line actionable advice for the current status.
  final String advice;

  @override
  bool operator ==(Object other) =>
      other is MarkerEval &&
      other.status == status &&
      other.tone == tone &&
      other.label == label &&
      other.advice == advice;

  @override
  int get hashCode => Object.hash(status, tone, label, advice);

  @override
  String toString() => 'MarkerEval($status, $tone, "$label")';
}

typedef MarkerEvaluator = MarkerEval Function(
  double value,
  double? value2,
  SexType sex,
);

class MarkerDef {
  const MarkerDef({
    required this.key,
    required this.name,
    required this.unit,
    required this.rangeText,
    required this.step,
    required this.evaluate,
    this.hasSecond = false,
    this.secondUnit,
  });

  final MarkerKey key;

  /// Vietnamese name.
  final String name;
  final String unit;

  /// Blood pressure carries a second value (diastolic).
  final bool hasSecond;
  final String? secondUnit;

  /// Human-readable normal range, for display.
  final String rangeText;

  /// Typical input step for the entry control.
  final double step;
  final MarkerEvaluator evaluate;
}

MarkerEval _ok([
  String label = 'Bình thường',
  String advice =
      'Chỉ số trong ngưỡng bình thường. Duy trì lối sống lành mạnh.',
]) =>
    MarkerEval(
      status: MarkerStatus.normal,
      tone: MarkerTone.success,
      label: label,
      advice: advice,
    );

MarkerEval _hi(String label, String advice) => MarkerEval(
      status: MarkerStatus.high,
      tone: MarkerTone.danger,
      label: label,
      advice: advice,
    );

MarkerEval _lo(String label, String advice) => MarkerEval(
      status: MarkerStatus.low,
      tone: MarkerTone.warning,
      label: label,
      advice: advice,
    );

final Map<MarkerKey, MarkerDef> markers = {
  MarkerKey.uricAcid: MarkerDef(
    key: MarkerKey.uricAcid,
    name: 'Acid uric',
    unit: 'µmol/L',
    rangeText: 'Nam < 420 · Nữ < 360 µmol/L',
    step: 10,
    evaluate: (v, _, sex) {
      final limit = sex == SexType.female ? 360 : 420;
      if (v > limit) {
        return _hi(
          'Cao',
          'Acid uric cao làm tăng nguy cơ gout. Hạn chế nội tạng, hải sản, thịt đỏ, bia rượu; uống nhiều nước. Bật chế độ gout trong Hồ sơ.',
        );
      }
      if (v < 150) {
        return _lo('Thấp',
            'Acid uric thấp — thường không đáng lo. Theo dõi cùng bác sĩ nếu cần.');
      }
      return _ok();
    },
  ),
  MarkerKey.glucoseFasting: MarkerDef(
    key: MarkerKey.glucoseFasting,
    name: 'Đường huyết lúc đói',
    unit: 'mmol/L',
    rangeText: '3,9 – 5,5 mmol/L',
    step: 0.1,
    evaluate: (v, _, __) {
      if (v >= 7) {
        return _hi('Cao (nguy cơ tiểu đường)',
            'Đường huyết đói ≥ 7 mmol/L gợi ý tiểu đường. Hãy đi khám để xác nhận. Giảm đường, tinh bột nhanh; tăng vận động.');
      }
      if (v >= 5.6) {
        return _hi('Tiền tiểu đường',
            'Mức tiền tiểu đường. Giảm đồ ngọt/tinh bột tinh chế, tăng chất xơ và vận động đều.');
      }
      if (v < 3.9) {
        return _lo('Thấp',
            'Đường huyết thấp. Ăn nhẹ và theo dõi; gặp bác sĩ nếu hay bị.');
      }
      return _ok();
    },
  ),
  MarkerKey.bloodPressure: MarkerDef(
    key: MarkerKey.bloodPressure,
    name: 'Huyết áp',
    unit: 'mmHg',
    hasSecond: true,
    secondUnit: 'mmHg',
    rangeText: '< 120/80 mmHg',
    step: 1,
    evaluate: (sys, dia, _) {
      final d = dia ?? 0;
      if (sys >= 140 || d >= 90) {
        return _hi('Cao',
            'Huyết áp cao. Giảm muối (< 2 g natri/ngày), hạn chế rượu bia, tăng vận động; đi khám nếu kéo dài.');
      }
      if (sys >= 120 || d >= 80) {
        return _hi('Hơi cao',
            'Huyết áp hơi cao. Theo dõi, giảm muối và căng thẳng, vận động đều.');
      }
      if (sys < 90 || d < 60) {
        return _lo('Thấp',
            'Huyết áp thấp. Uống đủ nước; gặp bác sĩ nếu chóng mặt/mệt.');
      }
      return _ok();
    },
  ),
  MarkerKey.cholesterolTotal: MarkerDef(
    key: MarkerKey.cholesterolTotal,
    name: 'Cholesterol toàn phần',
    unit: 'mmol/L',
    rangeText: '< 5,2 mmol/L',
    step: 0.1,
    evaluate: (v, _, __) {
      if (v >= 6.2) {
        return _hi('Cao',
            'Cholesterol cao. Giảm mỡ bão hòa/đồ chiên, tăng rau & chất xơ, vận động; cân nhắc khám.');
      }
      if (v >= 5.2) {
        return _hi('Ranh giới cao',
            'Mức ranh giới. Điều chỉnh chế độ ăn và vận động để đưa về < 5,2.');
      }
      return _ok();
    },
  ),
  MarkerKey.ldl: MarkerDef(
    key: MarkerKey.ldl,
    name: 'LDL (mỡ xấu)',
    unit: 'mmol/L',
    rangeText: '< 3,4 mmol/L',
    step: 0.1,
    evaluate: (v, _, __) {
      if (v >= 4.1) {
        return _hi('Cao',
            'LDL cao. Giảm mỡ bão hòa và chất béo chuyển hóa; tăng chất xơ hòa tan (yến mạch, đậu).');
      }
      if (v >= 3.4) {
        return _hi('Ranh giới cao',
            'LDL hơi cao. Ưu tiên chất béo tốt (cá, dầu ô liu, hạt).');
      }
      return _ok();
    },
  ),
  MarkerKey.hdl: MarkerDef(
    key: MarkerKey.hdl,
    name: 'HDL (mỡ tốt)',
    unit: 'mmol/L',
    rangeText: 'Nam > 1,0 · Nữ > 1,3 mmol/L',
    step: 0.1,
    evaluate: (v, _, sex) {
      final min = sex == SexType.female ? 1.3 : 1.0;
      if (v < min) {
        return _lo('Thấp',
            'HDL thấp. Tăng vận động, chất béo tốt; bỏ thuốc lá giúp cải thiện HDL.');
      }
      return _ok('Tốt', 'HDL ở mức tốt — cao có lợi cho tim mạch.');
    },
  ),
  MarkerKey.triglycerides: MarkerDef(
    key: MarkerKey.triglycerides,
    name: 'Triglyceride',
    unit: 'mmol/L',
    rangeText: '< 1,7 mmol/L',
    step: 0.1,
    evaluate: (v, _, __) {
      if (v >= 2.3) {
        return _hi('Cao',
            'Triglyceride cao. Giảm đường, rượu bia và tinh bột nhanh; tăng omega-3 và vận động.');
      }
      if (v >= 1.7) {
        return _hi('Ranh giới cao', 'Hơi cao. Hạn chế đồ ngọt và rượu bia.');
      }
      return _ok();
    },
  ),
  MarkerKey.restingHr: MarkerDef(
    key: MarkerKey.restingHr,
    name: 'Nhịp tim nghỉ',
    unit: 'bpm',
    rangeText: '60 – 100 bpm',
    step: 1,
    evaluate: (v, _, __) {
      if (v > 100) {
        return _hi('Cao',
            'Nhịp tim nghỉ cao. Có thể do căng thẳng, cà phê, thiếu ngủ; nếu kéo dài hãy khám.');
      }
      if (v < 50) {
        return _lo('Thấp',
            'Nhịp tim nghỉ thấp — bình thường ở người tập luyện nhiều; khám nếu chóng mặt.');
      }
      return _ok();
    },
  ),
};

/// Markers in display order.
const List<MarkerKey> markerOrder = [
  MarkerKey.uricAcid,
  MarkerKey.glucoseFasting,
  MarkerKey.bloodPressure,
  MarkerKey.cholesterolTotal,
  MarkerKey.ldl,
  MarkerKey.hdl,
  MarkerKey.triglycerides,
  MarkerKey.restingHr,
];
