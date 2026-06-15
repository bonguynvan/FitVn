import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Reads/writes the Supabase `profiles` row and maps it to the shared
/// [UserProfile] domain model. The web app keeps the profile local-first; this
/// is the cloud copy so the native and web clients converge on one identity.
///
/// SCHEMA GAP: `profiles` stores `date_of_birth` (not age) and has no columns
/// for `targetWeightKg` or health `conditions`. Age is derived from DOB; the
/// other two stay client-local until a migration adds columns (tracked for a
/// later phase). Do not silently drop them — persist locally meanwhile.
class ProfileRepository {
  ProfileRepository(this._client);

  final SupabaseClient _client;

  Future<UserProfile?> fetch(String userId) async {
    final row =
        await _client.from('profiles').select().eq('id', userId).maybeSingle();
    if (row == null) return null;
    return _fromRow(row);
  }

  /// Upsert the domain profile back into the `profiles` row. Targets are
  /// computed here so the cloud copy always carries a consistent snapshot.
  Future<void> save(String userId, UserProfile profile) async {
    final targets = profile.customTargets ?? computeTargets(profile);
    await _client.from('profiles').upsert({
      'id': userId,
      'full_name': profile.name,
      'goal': profile.goal.wire,
      'sex': profile.sex.wire,
      'activity_level': profile.activityLevel.wire,
      'height_cm': profile.heightCm,
      'weight_kg': profile.weightKg,
      'date_of_birth': _dobFromAge(profile.age),
      'daily_calorie_target': targets.calories,
      'protein_target_g': targets.proteinG,
      'carbs_target_g': targets.carbsG,
      'fat_target_g': targets.fatG,
      'updated_at': DateTime.now().toUtc().toIso8601String(),
    });
  }

  UserProfile _fromRow(Map<String, dynamic> row) {
    return UserProfile(
      name: (row['full_name'] as String?) ?? '',
      goal: _goal(row['goal'] as String?),
      sex: _sex(row['sex'] as String?),
      activityLevel: _activity(row['activity_level'] as String?),
      age: _ageFromDob(row['date_of_birth'] as String?),
      heightCm: ((row['height_cm'] as num?) ?? 170).toDouble(),
      weightKg: ((row['weight_kg'] as num?) ?? 65).toDouble(),
      customTargets: _targets(row),
    );
  }

  DailyTargets? _targets(Map<String, dynamic> row) {
    final cal = row['daily_calorie_target'] as int?;
    if (cal == null) return null;
    return DailyTargets(
      calories: cal,
      proteinG: (row['protein_target_g'] as int?) ?? 0,
      carbsG: (row['carbs_target_g'] as int?) ?? 0,
      fatG: (row['fat_target_g'] as int?) ?? 0,
    );
  }

  GoalType _goal(String? w) =>
      w == null ? GoalType.maintain : GoalType.fromWire(w);
  SexType _sex(String? w) => w == null ? SexType.male : SexType.fromWire(w);
  ActivityLevel _activity(String? w) =>
      w == null ? ActivityLevel.moderate : ActivityLevel.fromWire(w);

  double _ageFromDob(String? dob) {
    if (dob == null) return 25;
    final birth = DateTime.tryParse(dob);
    if (birth == null) return 25;
    final now = DateTime.now();
    var age = now.year - birth.year;
    if (now.month < birth.month ||
        (now.month == birth.month && now.day < birth.day)) {
      age -= 1;
    }
    return age.toDouble();
  }

  /// Approximate a date_of_birth from an age (Jan 1 of the birth year). Lossy
  /// but round-trips the age the UI collects until DOB capture is added.
  String _dobFromAge(double age) {
    final year = DateTime.now().year - age.round();
    return '$year-01-01';
  }
}
