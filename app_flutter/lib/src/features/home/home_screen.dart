import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/tokens.dart';
import '../../widgets/app_card.dart';
import '../../widgets/hero_header.dart';
import '../../widgets/targets_card.dart';
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
              const _ComingSoon(),
            ],
          ),
        ),
      ],
    );
  }
}

class _ComingSoon extends StatelessWidget {
  const _ComingSoon();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text('Nhật ký hôm nay',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          SizedBox(height: 8),
          Text(
            'Ghi bữa ăn, buổi tập và check-in sẽ xuất hiện ở đây. '
            'Đồng bộ ngoại tuyến đã sẵn sàng ở tầng dữ liệu.',
            style: TextStyle(color: AppColors.textMuted, height: 1.5),
          ),
        ],
      ),
    );
  }
}
