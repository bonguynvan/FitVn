import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Daily reminder preferences (meals + workout), persisted locally. Times are
/// 24h hour/minute. Reminder notification ids are fixed so re-scheduling
/// replaces the previous one.
class ReminderPrefs {
  const ReminderPrefs({
    this.mealsEnabled = false,
    this.mealsHour = 19,
    this.mealsMinute = 0,
    this.workoutEnabled = false,
    this.workoutHour = 18,
    this.workoutMinute = 0,
  });

  final bool mealsEnabled;
  final int mealsHour;
  final int mealsMinute;
  final bool workoutEnabled;
  final int workoutHour;
  final int workoutMinute;

  static const mealsId = 101;
  static const workoutId = 102;

  ReminderPrefs copyWith({
    bool? mealsEnabled,
    int? mealsHour,
    int? mealsMinute,
    bool? workoutEnabled,
    int? workoutHour,
    int? workoutMinute,
  }) =>
      ReminderPrefs(
        mealsEnabled: mealsEnabled ?? this.mealsEnabled,
        mealsHour: mealsHour ?? this.mealsHour,
        mealsMinute: mealsMinute ?? this.mealsMinute,
        workoutEnabled: workoutEnabled ?? this.workoutEnabled,
        workoutHour: workoutHour ?? this.workoutHour,
        workoutMinute: workoutMinute ?? this.workoutMinute,
      );

  Map<String, dynamic> toJson() => {
        'mealsEnabled': mealsEnabled,
        'mealsHour': mealsHour,
        'mealsMinute': mealsMinute,
        'workoutEnabled': workoutEnabled,
        'workoutHour': workoutHour,
        'workoutMinute': workoutMinute,
      };

  static ReminderPrefs fromJson(Map<String, dynamic> j) => ReminderPrefs(
        mealsEnabled: j['mealsEnabled'] as bool? ?? false,
        mealsHour: j['mealsHour'] as int? ?? 19,
        mealsMinute: j['mealsMinute'] as int? ?? 0,
        workoutEnabled: j['workoutEnabled'] as bool? ?? false,
        workoutHour: j['workoutHour'] as int? ?? 18,
        workoutMinute: j['workoutMinute'] as int? ?? 0,
      );
}

class ReminderPrefsStore {
  static const _key = 'fitvn.reminders.v1';

  Future<ReminderPrefs> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return const ReminderPrefs();
    try {
      return ReminderPrefs.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return const ReminderPrefs();
    }
  }

  Future<void> save(ReminderPrefs p) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(p.toJson()));
  }
}
