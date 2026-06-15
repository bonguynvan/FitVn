import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/tokens.dart';
import '../../widgets/app_card.dart';
import '../../widgets/hero_header.dart';
import '../health/health_markers_section.dart';
import '../profile/profile_controller.dart';

class ProgressScreen extends ConsumerWidget {
  const ProgressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileControllerProvider).valueOrNull;

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        const HeroHeader(
          eyebrow: 'Tiến độ',
          title: 'Hành trình của bạn',
          subtitle: 'Cân nặng, số đo và chỉ số sức khỏe',
        ),
        Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (profile != null)
                AppCard(
                  raised: true,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _Stat(label: 'Hiện tại', value: '${profile.weightKg.round()} kg'),
                      _Stat(
                        label: 'Mục tiêu',
                        value: profile.targetWeightKg == null
                            ? '—'
                            : '${profile.targetWeightKg!.round()} kg',
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 24),
              const HealthMarkersSection(),
            ],
          ),
        ),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
        const SizedBox(height: 2),
        Text(label,
            style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
      ],
    );
  }
}
