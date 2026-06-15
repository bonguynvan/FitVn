import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/tokens.dart';
import '../../widgets/app_card.dart';
import '../../data/repositories/workout_repository.dart';
import 'exercise_catalog.dart';
import 'workout_controller.dart';

/// Build and save a workout session: add sets (exercise + reps + weight), then
/// save → one pending session enqueued for sync.
class WorkoutLoggerScreen extends ConsumerStatefulWidget {
  const WorkoutLoggerScreen({super.key});

  @override
  ConsumerState<WorkoutLoggerScreen> createState() =>
      _WorkoutLoggerScreenState();
}

class _WorkoutLoggerScreenState extends ConsumerState<WorkoutLoggerScreen> {
  final List<SetEntry> _sets = [];
  String _exerciseId = seedExercises.first.id;
  final _reps = TextEditingController(text: '10');
  final _weight = TextEditingController(text: '20');

  @override
  void dispose() {
    _reps.dispose();
    _weight.dispose();
    super.dispose();
  }

  void _addSet() {
    final reps = int.tryParse(_reps.text);
    final weight = double.tryParse(_weight.text.replaceAll(',', '.'));
    final setNumber =
        _sets.where((s) => s.exerciseId == _exerciseId).length + 1;
    setState(() {
      _sets.add(SetEntry(
        exerciseId: _exerciseId,
        setNumber: setNumber,
        reps: reps,
        weightKg: weight,
      ));
    });
  }

  Future<void> _save() async {
    if (_sets.isEmpty) return;
    await ref.read(workoutActionsProvider).logSession(_sets);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ghi buổi tập')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Thêm set',
                    style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _exerciseId,
                  decoration: const InputDecoration(labelText: 'Bài tập'),
                  items: [
                    for (final e in seedExercises)
                      DropdownMenuItem(value: e.id, child: Text(e.nameVi)),
                  ],
                  onChanged: (v) =>
                      setState(() => _exerciseId = v ?? _exerciseId),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _reps,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Số rep'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _weight,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        decoration: const InputDecoration(labelText: 'Tạ (kg)'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _addSet,
                  icon: const Icon(Icons.add),
                  label: const Text('Thêm set'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (_sets.isEmpty)
            const Text('Chưa có set nào.',
                style: TextStyle(color: AppColors.textMuted))
          else
            ..._sets.asMap().entries.map((e) {
              final s = e.value;
              final name = exerciseById(s.exerciseId)?.nameVi ?? s.exerciseId;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: AppCard(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          '$name · set ${s.setNumber}: '
                          '${s.reps ?? '—'} rep × ${s.weightKg ?? '—'} kg',
                        ),
                      ),
                      IconButton(
                        onPressed: () => setState(() => _sets.removeAt(e.key)),
                        icon: const Icon(Icons.close, size: 18),
                      ),
                    ],
                  ),
                ),
              );
            }),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _sets.isEmpty ? null : _save,
            child: const Text('Lưu buổi tập'),
          ),
        ],
      ),
    );
  }
}
