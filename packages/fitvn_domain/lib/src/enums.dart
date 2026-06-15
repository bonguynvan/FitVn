/// Wire-compatible enums mirroring `types/database.types.ts`.
///
/// Each enum carries the exact string used by Supabase / the web app so values
/// round-trip cleanly across the two clients. Use [fromWire] when decoding.

enum GoalType {
  loseFat('lose_fat'),
  gainMuscle('gain_muscle'),
  maintain('maintain');

  const GoalType(this.wire);

  /// The string stored in Supabase and used by the TypeScript app.
  final String wire;

  static GoalType fromWire(String value) =>
      values.firstWhere((e) => e.wire == value);
}

enum ActivityLevel {
  sedentary('sedentary', 1.2),
  light('light', 1.375),
  moderate('moderate', 1.55),
  active('active', 1.725),
  veryActive('very_active', 1.9);

  const ActivityLevel(this.wire, this.factor);

  final String wire;

  /// TDEE multiplier applied to BMR (see [computeTargets]).
  final double factor;

  static ActivityLevel fromWire(String value) =>
      values.firstWhere((e) => e.wire == value);
}

enum SexType {
  male('male'),
  female('female'),
  other('other');

  const SexType(this.wire);

  final String wire;

  static SexType fromWire(String value) =>
      values.firstWhere((e) => e.wire == value);
}
