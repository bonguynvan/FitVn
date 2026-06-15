import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/tokens.dart';
import '../../widgets/app_card.dart';
import '../../widgets/hero_header.dart';
import '../../widgets/targets_card.dart';
import '../nutrition/nutrition_controller.dart';
import '../profile/profile_controller.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileControllerProvider).valueOrNull;
    final name = (profile?.name.isNotEmpty ?? false) ? profile!.name : 'bạn';
    final targets =
        profile == null ? null : (profile.customTargets ?? computeTargets(profile));

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        HeroHeader(
          eyebrow: 'Xin chào',
          title: name,
          subtitle: 'Hôm nay là một ngày tốt để khỏe hơn 💪',
          trailing: IconButton(
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const ProfileScreen()),
            ),
            icon: const Icon(Icons.settings_outlined, color: Colors.white),
            tooltip: 'Hồ sơ',
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (targets != null) DailyTargetsCard(targets: targets),
              const SizedBox(height: 16),
              const _StepsCard(),
              const _TodayConsumed(),
            ],
          ),
        ),
      ],
    );
  }
}

/// Today's steps from Apple Health / Google Fit. Renders nothing unless Health
/// returns a value (not connected / denied / unsupported → silent).
class _StepsCard extends ConsumerWidget {
  const _StepsCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final steps = ref.watch(todayStepsProvider).valueOrNull;
    if (steps == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: AppCard(
        child: Row(
          children: [
            const Icon(Icons.directions_walk, color: AppColors.primary),
            const SizedBox(width: 12),
            const Expanded(
              child: Text('Bước chân hôm nay',
                  style: TextStyle(fontWeight: FontWeight.w600)),
            ),
            Text('$steps',
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _TodayConsumed extends ConsumerWidget {
  const _TodayConsumed();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final day = ref.watch(todayNutritionProvider).valueOrNull;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Đã nạp hôm nay',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 8),
          if (day == null)
            const Text('Đang tải…',
                style: TextStyle(color: AppColors.textMuted))
          else
            Text(
              '${day.calories} / ${day.targets.calories} kcal'
              '${day.entries.isEmpty ? ' — mở tab Dinh dưỡng để ghi món' : ' · ${day.entries.length} món'}',
              style: const TextStyle(color: AppColors.textMuted, height: 1.5),
            ),
        ],
      ),
    );
  }
}
