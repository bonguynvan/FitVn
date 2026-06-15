import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../theme/tokens.dart';
import '../../widgets/app_card.dart';
import '../../widgets/hero_header.dart';
import 'add_food_sheet.dart';
import 'nutrition_controller.dart';

final _fmt = NumberFormat.decimalPattern('vi_VN');

const _mealLabels = {
  'breakfast': 'Bữa sáng',
  'lunch': 'Bữa trưa',
  'dinner': 'Bữa tối',
  'snack': 'Ăn vặt',
};

class NutritionScreen extends ConsumerWidget {
  const NutritionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dayAsync = ref.watch(todayNutritionProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showAddFoodSheet(context),
        icon: const Icon(Icons.add),
        label: const Text('Ghi món'),
      ),
      body: dayAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Lỗi: $e')),
        data: (day) => ListView(
          padding: EdgeInsets.zero,
          children: [
            const HeroHeader(
              eyebrow: 'Dinh dưỡng',
              title: 'Nhật ký ăn uống',
              subtitle: 'Theo dõi calo và macro mỗi ngày',
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _ConsumedCard(day: day),
                  const SizedBox(height: 16),
                  if (day.entries.isEmpty)
                    const AppCard(
                      child: Text(
                        'Chưa có món nào hôm nay. Nhấn "Ghi món" để thêm.',
                        style:
                            TextStyle(color: AppColors.textMuted, height: 1.5),
                      ),
                    )
                  else
                    ...day.entries.map(
                      (e) => _EntryTile(
                        entry: e,
                        onRemove: () => ref
                            .read(nutritionActionsProvider)
                            .remove(e.localId),
                      ),
                    ),
                  const SizedBox(height: 80), // clear the FAB
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ConsumedCard extends StatelessWidget {
  const _ConsumedCard({required this.day});
  final DayNutrition day;

  @override
  Widget build(BuildContext context) {
    final remaining = day.caloriesRemaining;
    return AppCard(
      raised: true,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Đã nạp',
                      style:
                          TextStyle(fontSize: 13, color: AppColors.textMuted)),
                  Text('${_fmt.format(day.calories)} kcal',
                      style: const TextStyle(
                          fontSize: 24, fontWeight: FontWeight.w600)),
                ],
              ),
              Text(
                remaining >= 0
                    ? 'Còn ${_fmt.format(remaining)} kcal'
                    : 'Vượt ${_fmt.format(-remaining)} kcal',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: remaining >= 0 ? AppColors.primary : AppColors.danger,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: day.calorieProgress,
              minHeight: 8,
              backgroundColor: AppColors.surfaceRaised,
              valueColor: AlwaysStoppedAnimation(
                  remaining >= 0 ? AppColors.primary : AppColors.danger),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _Macro(
                  label: 'Đạm', got: day.proteinG, goal: day.targets.proteinG),
              _Macro(
                  label: 'Tinh bột', got: day.carbsG, goal: day.targets.carbsG),
              _Macro(label: 'Béo', got: day.fatG, goal: day.targets.fatG),
            ],
          ),
        ],
      ),
    );
  }
}

class _Macro extends StatelessWidget {
  const _Macro({required this.label, required this.got, required this.goal});
  final String label;
  final int got;
  final int goal;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: const BoxDecoration(
          color: AppColors.surfaceRaised,
          borderRadius: AppRadii.btnR,
        ),
        child: Column(
          children: [
            Text('$got / ${goal}g',
                style:
                    const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 2),
            Text(label,
                style:
                    const TextStyle(fontSize: 11, color: AppColors.textMuted)),
          ],
        ),
      ),
    );
  }
}

class _EntryTile extends StatelessWidget {
  const _EntryTile({required this.entry, required this.onRemove});
  final LoggedEntry entry;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: AppCard(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(entry.food.nameVi,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text(
                    '${_mealLabels[entry.mealType] ?? entry.mealType} · '
                    '${entry.quantityGrams.round()}g',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
            Text('${entry.calories} kcal',
                style: const TextStyle(fontWeight: FontWeight.w600)),
            IconButton(
              onPressed: onRemove,
              icon:
                  const Icon(Icons.close, size: 18, color: AppColors.textMuted),
              tooltip: 'Xoá',
            ),
          ],
        ),
      ),
    );
  }
}
