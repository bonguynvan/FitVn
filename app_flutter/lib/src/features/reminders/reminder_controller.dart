import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import 'reminder_prefs.dart';

final reminderPrefsStoreProvider =
    Provider<ReminderPrefsStore>((ref) => ReminderPrefsStore());

final reminderControllerProvider =
    AsyncNotifierProvider<ReminderController, ReminderPrefs>(
  ReminderController.new,
);

/// Loads reminder prefs and keeps the OS schedule in sync with them: enabling a
/// reminder requests permission + schedules it; disabling cancels it.
class ReminderController extends AsyncNotifier<ReminderPrefs> {
  ReminderPrefsStore get _store => ref.read(reminderPrefsStoreProvider);

  @override
  Future<ReminderPrefs> build() => _store.load();

  Future<void> setMeals({required bool enabled, int? hour, int? minute}) async {
    final prev = state.valueOrNull ?? const ReminderPrefs();
    final next = prev.copyWith(
      mealsEnabled: enabled,
      mealsHour: hour,
      mealsMinute: minute,
    );
    await _apply(
      next,
      id: ReminderPrefs.mealsId,
      enabled: next.mealsEnabled,
      hour: next.mealsHour,
      minute: next.mealsMinute,
      title: 'Ghi bữa ăn',
      body: 'Đừng quên ghi lại bữa ăn hôm nay nhé!',
    );
  }

  Future<void> setWorkout({
    required bool enabled,
    int? hour,
    int? minute,
  }) async {
    final prev = state.valueOrNull ?? const ReminderPrefs();
    final next = prev.copyWith(
      workoutEnabled: enabled,
      workoutHour: hour,
      workoutMinute: minute,
    );
    await _apply(
      next,
      id: ReminderPrefs.workoutId,
      enabled: next.workoutEnabled,
      hour: next.workoutHour,
      minute: next.workoutMinute,
      title: 'Đến giờ tập',
      body: 'Một buổi tập ngắn cũng giúp bạn tiến bộ 💪',
    );
  }

  Future<void> _apply(
    ReminderPrefs next, {
    required int id,
    required bool enabled,
    required int hour,
    required int minute,
    required String title,
    required String body,
  }) async {
    state = AsyncData(next);
    await _store.save(next);

    final notif = ref.read(notificationServiceProvider);
    if (enabled) {
      await notif.requestPermission();
      await notif.scheduleDaily(
          id: id, hour: hour, minute: minute, title: title, body: body);
    } else {
      await notif.cancel(id);
    }
  }
}
