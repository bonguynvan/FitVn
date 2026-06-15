import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../theme/tokens.dart';
import 'app_card.dart';

final _fmt = NumberFormat.decimalPattern('vi_VN');

/// Daily calorie + macro target card, reused on Home and Nutrition.
class DailyTargetsCard extends StatelessWidget {
  const DailyTargetsCard({super.key, required this.targets});

  final DailyTargets targets;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      raised: true,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.12),
                  borderRadius: AppRadii.btnR,
                ),
                child: const Icon(Icons.local_fire_department,
                    color: AppColors.primary),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Mục tiêu hằng ngày',
                      style:
                          TextStyle(fontSize: 13, color: AppColors.textMuted)),
                  Text('${_fmt.format(targets.calories)} kcal',
                      style: const TextStyle(
                          fontSize: 24, fontWeight: FontWeight.w600)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _Macro(label: 'Đạm', value: '${targets.proteinG}g'),
              _Macro(label: 'Tinh bột', value: '${targets.carbsG}g'),
              _Macro(label: 'Chất béo', value: '${targets.fatG}g'),
            ],
          ),
        ],
      ),
    );
  }
}

class _Macro extends StatelessWidget {
  const _Macro({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surfaceRaised,
          borderRadius: AppRadii.btnR,
        ),
        child: Column(
          children: [
            Text(value,
                style: const TextStyle(
                    fontSize: 14, fontWeight: FontWeight.w600)),
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
