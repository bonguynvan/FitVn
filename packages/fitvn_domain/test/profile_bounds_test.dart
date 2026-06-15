import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:test/test.dart';

void main() {
  group('clampToRange', () {
    test('snaps below-min up to min', () {
      expect(clampToRange(8, 10, 100), 10);
    });

    test('snaps above-max down to max', () {
      expect(clampToRange(150, 10, 100), 100);
    });

    test('passes in-range values through unchanged', () {
      expect(clampToRange(55, 10, 100), 55);
    });

    test('falls back to min for non-finite input', () {
      expect(clampToRange(double.nan, 10, 100), 10);
      expect(clampToRange(double.infinity, 10, 100), 10);
      expect(clampToRange(double.negativeInfinity, 10, 100), 10);
    });
  });

  group('clampProfileMetrics', () {
    test('clamps each body metric into its range', () {
      final clamped = clampProfileMetrics(const UserProfile(
        age: 8, // below 10
        heightCm: 300, // above 230
        weightKg: 10, // below 30
      ));
      expect(clamped.age, 10);
      expect(clamped.heightCm, 230);
      expect(clamped.weightKg, 30);
    });

    test('leaves a null targetWeightKg as null', () {
      final clamped = clampProfileMetrics(const UserProfile());
      expect(clamped.targetWeightKg, isNull);
    });

    test('clamps a present targetWeightKg', () {
      final clamped = clampProfileMetrics(
        const UserProfile(targetWeightKg: 500),
      );
      expect(clamped.targetWeightKg, 250);
    });

    test('does not mutate other fields', () {
      const profile = UserProfile(
        name: 'An',
        goal: GoalType.gainMuscle,
        sex: SexType.female,
        age: 28,
        heightCm: 165,
        weightKg: 58,
        activityLevel: ActivityLevel.active,
      );
      final clamped = clampProfileMetrics(profile);
      expect(clamped.name, 'An');
      expect(clamped.goal, GoalType.gainMuscle);
      expect(clamped.sex, SexType.female);
      expect(clamped.activityLevel, ActivityLevel.active);
      // In-range metrics untouched.
      expect(clamped.age, 28);
      expect(clamped.heightCm, 165);
      expect(clamped.weightKg, 58);
    });
  });
}
