import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/tokens.dart';
import '../../widgets/app_card.dart';
import '../../widgets/hero_header.dart';
import 'workout_controller.dart';
import 'workout_logger_screen.dart';

class WorkoutsScreen extends ConsumerWidget {
  const WorkoutsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessions = ref.watch(todayWorkoutsProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const WorkoutLoggerScreen()),
        ),
        icon: const Icon(Icons.add),
        label: const Text('Ghi buổi tập'),
      ),
      body: sessions.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Lỗi: $e')),
        data: (list) => ListView(
          padding: EdgeInsets.zero,
          children: [
            const HeroHeader(
              eyebrow: 'Lịch tập',
              title: 'Buổi tập hôm nay',
              subtitle: 'Ghi lại bài tập, set và tiến bộ theo thời gian',
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (list.isEmpty)
                    const AppCard(
                      child: Text(
                        'Chưa ghi buổi tập nào hôm nay. Nhấn "Ghi buổi tập" để bắt đầu.',
                        style: TextStyle(color: AppColors.textMuted, height: 1.5),
                      ),
                    )
                  else
                    ...list.map(
                      (s) => _SessionTile(
                        session: s,
                        onRemove: () =>
                            ref.read(workoutActionsProvider).remove(s.localId),
                      ),
                    ),
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SessionTile extends StatelessWidget {
  const _SessionTile({required this.session, required this.onRemove});
  final LoggedSession session;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final names = session.exerciseNames.join(', ');
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: AppCard(
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${session.setCount} set',
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(names.isEmpty ? '—' : names,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textMuted)),
                ],
              ),
            ),
            IconButton(
              onPressed: onRemove,
              icon: const Icon(Icons.close, size: 18, color: AppColors.textMuted),
              tooltip: 'Xoá',
            ),
          ],
        ),
      ),
    );
  }
}
