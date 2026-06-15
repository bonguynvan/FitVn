import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/tokens.dart';
import '../../widgets/app_card.dart';
import '../../widgets/hero_header.dart';
import '../../widgets/targets_card.dart';
import '../profile/profile_controller.dart';

class NutritionScreen extends ConsumerWidget {
  const NutritionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileControllerProvider).valueOrNull;
    final targets =
        profile == null ? null : (profile.customTargets ?? computeTargets(profile));

    return ListView(
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
              if (targets != null) DailyTargetsCard(targets: targets),
              const SizedBox(height: 16),
              const AppCard(
                child: Text(
                  'Tìm món ăn, ghi bữa và tra cứu thư viện thực phẩm Việt Nam '
                  'sẽ có ở giai đoạn tới. Bộ nhớ đệm ngoại tuyến đã sẵn sàng.',
                  style: TextStyle(color: AppColors.textMuted, height: 1.5),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
