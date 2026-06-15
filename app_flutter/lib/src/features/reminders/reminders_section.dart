import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/tokens.dart';
import '../../widgets/app_card.dart';
import 'reminder_controller.dart';
import 'reminder_prefs.dart';

/// Daily reminder settings (meals + workout) — schedules local notifications.
class RemindersSection extends ConsumerWidget {
  const RemindersSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(reminderControllerProvider).valueOrNull;
    final ctrl = ref.read(reminderControllerProvider.notifier);
    if (prefs == null) {
      return const AppCard(child: Text('Đang tải nhắc nhở…'));
    }
    return AppCard(
      child: Column(
        children: [
          _ReminderRow(
            label: 'Nhắc ghi bữa ăn',
            enabled: prefs.mealsEnabled,
            hour: prefs.mealsHour,
            minute: prefs.mealsMinute,
            onToggle: (v) => ctrl.setMeals(enabled: v),
            onPickTime: (t) =>
                ctrl.setMeals(enabled: true, hour: t.hour, minute: t.minute),
          ),
          const Divider(height: 20),
          _ReminderRow(
            label: 'Nhắc tập luyện',
            enabled: prefs.workoutEnabled,
            hour: prefs.workoutHour,
            minute: prefs.workoutMinute,
            onToggle: (v) => ctrl.setWorkout(enabled: v),
            onPickTime: (t) =>
                ctrl.setWorkout(enabled: true, hour: t.hour, minute: t.minute),
          ),
        ],
      ),
    );
  }
}

class _ReminderRow extends StatelessWidget {
  const _ReminderRow({
    required this.label,
    required this.enabled,
    required this.hour,
    required this.minute,
    required this.onToggle,
    required this.onPickTime,
  });

  final String label;
  final bool enabled;
  final int hour;
  final int minute;
  final ValueChanged<bool> onToggle;
  final ValueChanged<TimeOfDay> onPickTime;

  String get _timeText =>
      '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              GestureDetector(
                onTap: enabled
                    ? () async {
                        final picked = await showTimePicker(
                          context: context,
                          initialTime: TimeOfDay(hour: hour, minute: minute),
                        );
                        if (picked != null) onPickTime(picked);
                      }
                    : null,
                child: Text(
                  enabled ? 'Hằng ngày lúc $_timeText' : 'Tắt',
                  style: TextStyle(
                    fontSize: 12,
                    color: enabled ? AppColors.primary : AppColors.textMuted,
                  ),
                ),
              ),
            ],
          ),
        ),
        Switch(value: enabled, onChanged: onToggle),
      ],
    );
  }
}
