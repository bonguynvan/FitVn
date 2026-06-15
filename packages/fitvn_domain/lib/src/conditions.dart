/// Health conditions — opt-in profiles that re-tune the app's limits, warnings
/// and coach tone. Pure config + helpers. Ported from `lib/health/conditions.ts`.

enum ConditionKey {
  gout('gout'),
  diabetes('diabetes'),
  hypertension('hypertension'),
  cholesterol('cholesterol');

  const ConditionKey(this.wire);

  final String wire;

  static ConditionKey fromWire(String value) =>
      values.firstWhere((e) => e.wire == value);
}

class ConditionDef {
  const ConditionDef({
    required this.key,
    required this.label,
    required this.hint,
    required this.focus,
  });

  final ConditionKey key;

  /// Vietnamese name.
  final String label;

  /// Short description shown in the profile toggle.
  final String hint;

  /// One-line dietary focus the coach surfaces.
  final String focus;
}

const Map<ConditionKey, ConditionDef> conditions = {
  ConditionKey.gout: ConditionDef(
    key: ConditionKey.gout,
    label: 'Gout',
    hint: 'Siết purin (200mg) và cảnh báo món nhiều purin',
    focus: 'Hạn chế nội tạng, hải sản, thịt đỏ, bia rượu; uống nhiều nước.',
  ),
  ConditionKey.diabetes: ConditionDef(
    key: ConditionKey.diabetes,
    label: 'Tiểu đường',
    hint: 'Lưu ý đường và tinh bột nhanh',
    focus:
        'Giảm đường và tinh bột tinh chế; ưu tiên chất xơ, ăn cân đối để ổn định đường huyết.',
  ),
  ConditionKey.hypertension: ConditionDef(
    key: ConditionKey.hypertension,
    label: 'Huyết áp cao',
    hint: 'Siết natri xuống 1.500mg/ngày',
    focus:
        'Ăn nhạt (giảm muối, nước mắm, đồ chế biến sẵn); tăng rau quả giàu kali.',
  ),
  ConditionKey.cholesterol: ConditionDef(
    key: ConditionKey.cholesterol,
    label: 'Mỡ máu cao',
    hint: 'Lưu ý chất béo bão hòa',
    focus:
        'Giảm mỡ động vật, đồ chiên; tăng chất xơ hòa tan, cá và chất béo tốt.',
  ),
};

const List<ConditionKey> conditionOrder = [
  ConditionKey.gout,
  ConditionKey.diabetes,
  ConditionKey.hypertension,
  ConditionKey.cholesterol,
];

bool hasCondition(Iterable<ConditionKey>? conditionsList, ConditionKey key) =>
    conditionsList != null && conditionsList.contains(key);

/// Sodium daily limit (mg) — tightened to 1500 when managing hypertension.
int sodiumLimitFor(Iterable<ConditionKey>? conditionsList) =>
    hasCondition(conditionsList, ConditionKey.hypertension) ? 1500 : 2000;

/// Active condition focus lines (for coach advice).
List<String> conditionFocuses(Iterable<ConditionKey>? conditionsList) =>
    (conditionsList ?? const [])
        .map((k) => '${conditions[k]!.label}: ${conditions[k]!.focus}')
        .toList();
