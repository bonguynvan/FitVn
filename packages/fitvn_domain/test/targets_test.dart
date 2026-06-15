import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:test/test.dart';

/// Golden parity tests for `computeTargets`. The expected values are computed
/// from the TypeScript implementation (`lib/fitness/targets.ts`); if these
/// drift, the Dart port no longer matches the web app — fix the port, not the
/// goldens (unless the TS formula itself intentionally changed).
void main() {
  group('computeTargets — golden parity', () {
    test('male 25y 170cm 65kg moderate maintain', () {
      final t = computeTargets(const UserProfile(
        sex: SexType.male,
        age: 25,
        heightCm: 170,
        weightKg: 65,
        activityLevel: ActivityLevel.moderate,
        goal: GoalType.maintain,
      ));
      expect(
        t,
        const DailyTargets(calories: 2470, proteinG: 117, carbsG: 345, fatG: 69),
      );
    });

    test('female 30y 160cm 55kg light lose_fat', () {
      final t = computeTargets(const UserProfile(
        sex: SexType.female,
        age: 30,
        heightCm: 160,
        weightKg: 55,
        activityLevel: ActivityLevel.light,
        goal: GoalType.loseFat,
      ));
      expect(
        t,
        const DailyTargets(calories: 1360, proteinG: 110, carbsG: 145, fatG: 38),
      );
    });

    test('male 22y 180cm 80kg active gain_muscle', () {
      final t = computeTargets(const UserProfile(
        sex: SexType.male,
        age: 22,
        heightCm: 180,
        weightKg: 80,
        activityLevel: ActivityLevel.active,
        goal: GoalType.gainMuscle,
      ));
      expect(
        t,
        const DailyTargets(calories: 3450, proteinG: 160, carbsG: 487, fatG: 96),
      );
    });

    test('enforces the 1200 kcal floor for very low TDEE', () {
      final t = computeTargets(const UserProfile(
        sex: SexType.male,
        age: 80,
        heightCm: 150,
        weightKg: 40,
        activityLevel: ActivityLevel.sedentary,
        goal: GoalType.loseFat,
      ));
      expect(t.calories, 1200);
      expect(
        t,
        const DailyTargets(calories: 1200, proteinG: 80, carbsG: 146, fatG: 33),
      );
    });

    test('carbs never go negative', () {
      final t = computeTargets(const UserProfile(
        sex: SexType.female,
        age: 18,
        heightCm: 145,
        weightKg: 90,
        activityLevel: ActivityLevel.sedentary,
        goal: GoalType.loseFat,
      ));
      expect(t.carbsG, greaterThanOrEqualTo(0));
    });
  });
}
