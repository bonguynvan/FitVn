import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:test/test.dart';

void main() {
  test('UserProfile round-trips through JSON', () {
    const profile = UserProfile(
      name: 'Linh',
      goal: GoalType.gainMuscle,
      sex: SexType.female,
      age: 27,
      heightCm: 162.5,
      weightKg: 56,
      activityLevel: ActivityLevel.active,
      targetWeightKg: 58,
      customTargets:
          DailyTargets(calories: 2100, proteinG: 130, carbsG: 220, fatG: 60),
      goutMode: false,
      conditions: [ConditionKey.diabetes, ConditionKey.hypertension],
    );

    final restored = UserProfile.fromJson(profile.toJson());

    expect(restored.name, 'Linh');
    expect(restored.goal, GoalType.gainMuscle);
    expect(restored.sex, SexType.female);
    expect(restored.age, 27);
    expect(restored.heightCm, 162.5);
    expect(restored.weightKg, 56);
    expect(restored.activityLevel, ActivityLevel.active);
    expect(restored.targetWeightKg, 58);
    expect(restored.customTargets,
        const DailyTargets(calories: 2100, proteinG: 130, carbsG: 220, fatG: 60));
    expect(restored.conditions,
        [ConditionKey.diabetes, ConditionKey.hypertension]);
  });

  test('fromJson tolerates a minimal/empty payload with sane defaults', () {
    final p = UserProfile.fromJson(const {});
    expect(p.goal, GoalType.maintain);
    expect(p.sex, SexType.male);
    expect(p.age, 25);
    expect(p.targetWeightKg, isNull);
    expect(p.conditions, isEmpty);
  });
}
