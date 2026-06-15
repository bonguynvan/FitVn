/// Nutrition target computation. Ported from `lib/fitness/targets.ts`.
///
/// Mifflin-St Jeor BMR → TDEE (activity) → goal adjustment, then macro split
/// (protein by bodyweight, fat at 25% of kcal, carbs as the remainder).

import 'dart:math' as math;

import 'conditions.dart' show ConditionKey;
import 'enums.dart' show ActivityLevel, GoalType, SexType;

/// Personal profile used to compute daily nutrition targets.
///
/// Body metrics are [double] to mirror the web app's `number` fields exactly
/// (the inputs allow free typing, e.g. "65.5"); validation/clamping lives in
/// `profile_bounds.dart` and runs on confirm, never here.
class UserProfile {
  const UserProfile({
    this.name = '',
    this.goal = GoalType.maintain,
    this.sex = SexType.male,
    this.age = 25,
    this.heightCm = 170,
    this.weightKg = 65,
    this.activityLevel = ActivityLevel.moderate,
    this.targetWeightKg,
    this.customTargets,
    this.goutMode,
    this.conditions = const [],
  });

  final String name;
  final GoalType goal;
  final SexType sex;
  final double age;
  final double heightCm;
  final double weightKg;
  final ActivityLevel activityLevel;

  /// Optional goal body weight (kg) for the Progress tracker.
  final double? targetWeightKg;

  /// When set, overrides the auto-computed targets.
  final DailyTargets? customTargets;

  /// Gout management: tightens the purine ceiling. Kept in sync with
  /// [conditions] containing [ConditionKey.gout] for backward compat.
  final bool? goutMode;

  /// Opt-in health conditions that re-tune limits + advice.
  final List<ConditionKey> conditions;

  /// JSON for local persistence (shared_preferences) and cloud sync. Enums use
  /// their wire strings so the payload matches what Supabase/the web app store.
  Map<String, dynamic> toJson() => {
        'name': name,
        'goal': goal.wire,
        'sex': sex.wire,
        'age': age,
        'heightCm': heightCm,
        'weightKg': weightKg,
        'activityLevel': activityLevel.wire,
        'targetWeightKg': targetWeightKg,
        'customTargets': customTargets?.toJson(),
        'goutMode': goutMode,
        'conditions': conditions.map((c) => c.wire).toList(),
      };

  static UserProfile fromJson(Map<String, dynamic> json) {
    final custom = json['customTargets'];
    final conds = (json['conditions'] as List?) ?? const [];
    return UserProfile(
      name: (json['name'] as String?) ?? '',
      goal: GoalType.fromWire((json['goal'] as String?) ?? 'maintain'),
      sex: SexType.fromWire((json['sex'] as String?) ?? 'male'),
      age: ((json['age'] as num?) ?? 25).toDouble(),
      heightCm: ((json['heightCm'] as num?) ?? 170).toDouble(),
      weightKg: ((json['weightKg'] as num?) ?? 65).toDouble(),
      activityLevel:
          ActivityLevel.fromWire((json['activityLevel'] as String?) ?? 'moderate'),
      targetWeightKg: (json['targetWeightKg'] as num?)?.toDouble(),
      customTargets:
          custom == null ? null : DailyTargets.fromJson(custom as Map<String, dynamic>),
      goutMode: json['goutMode'] as bool?,
      conditions:
          conds.map((c) => ConditionKey.fromWire(c as String)).toList(),
    );
  }

  UserProfile copyWith({
    String? name,
    GoalType? goal,
    SexType? sex,
    double? age,
    double? heightCm,
    double? weightKg,
    ActivityLevel? activityLevel,
    double? Function()? targetWeightKg,
    DailyTargets? Function()? customTargets,
    bool? Function()? goutMode,
    List<ConditionKey>? conditions,
  }) {
    return UserProfile(
      name: name ?? this.name,
      goal: goal ?? this.goal,
      sex: sex ?? this.sex,
      age: age ?? this.age,
      heightCm: heightCm ?? this.heightCm,
      weightKg: weightKg ?? this.weightKg,
      activityLevel: activityLevel ?? this.activityLevel,
      targetWeightKg:
          targetWeightKg != null ? targetWeightKg() : this.targetWeightKg,
      customTargets:
          customTargets != null ? customTargets() : this.customTargets,
      goutMode: goutMode != null ? goutMode() : this.goutMode,
      conditions: conditions ?? this.conditions,
    );
  }
}

class DailyTargets {
  const DailyTargets({
    required this.calories,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
  });

  final int calories;
  final int proteinG;
  final int carbsG;
  final int fatG;

  Map<String, dynamic> toJson() => {
        'calories': calories,
        'proteinG': proteinG,
        'carbsG': carbsG,
        'fatG': fatG,
      };

  static DailyTargets fromJson(Map<String, dynamic> json) => DailyTargets(
        calories: (json['calories'] as num).toInt(),
        proteinG: (json['proteinG'] as num).toInt(),
        carbsG: (json['carbsG'] as num).toInt(),
        fatG: (json['fatG'] as num).toInt(),
      );

  @override
  bool operator ==(Object other) =>
      other is DailyTargets &&
      other.calories == calories &&
      other.proteinG == proteinG &&
      other.carbsG == carbsG &&
      other.fatG == fatG;

  @override
  int get hashCode => Object.hash(calories, proteinG, carbsG, fatG);

  @override
  String toString() =>
      'DailyTargets(calories: $calories, proteinG: $proteinG, '
      'carbsG: $carbsG, fatG: $fatG)';
}

const Map<GoalType, double> _goalFactor = {
  GoalType.loseFat: 0.8,
  GoalType.maintain: 1,
  GoalType.gainMuscle: 1.1,
};

const Map<GoalType, double> _proteinPerKg = {
  GoalType.loseFat: 2.0,
  GoalType.maintain: 1.8,
  GoalType.gainMuscle: 2.0,
};

DailyTargets computeTargets(UserProfile p) {
  final sexConstant = p.sex == SexType.female ? -161 : 5;
  final bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + sexConstant;
  final factor = p.activityLevel.factor;
  final tdee = bmr * factor * _goalFactor[p.goal]!;

  final calories = math.max(1200, (tdee / 10).round() * 10);
  final proteinG = (p.weightKg * _proteinPerKg[p.goal]!).round();
  final fatG = (calories * 0.25 / 9).round();
  final carbsG = math.max(0, ((calories - proteinG * 4 - fatG * 9) / 4).round());

  return DailyTargets(
    calories: calories,
    proteinG: proteinG,
    carbsG: carbsG,
    fatG: fatG,
  );
}
