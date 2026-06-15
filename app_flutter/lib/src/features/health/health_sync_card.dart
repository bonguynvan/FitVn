import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../theme/tokens.dart';
import '../../widgets/app_card.dart';
import '../profile/profile_controller.dart';

/// "Apple Health / Google Fit" card on Profile: request access and import the
/// latest body weight into the profile (which recomputes targets).
class HealthSyncCard extends ConsumerStatefulWidget {
  const HealthSyncCard({super.key});

  @override
  ConsumerState<HealthSyncCard> createState() => _HealthSyncCardState();
}

class _HealthSyncCardState extends ConsumerState<HealthSyncCard> {
  bool _busy = false;

  Future<void> _importWeight() async {
    setState(() => _busy = true);
    final health = ref.read(healthIntegrationProvider);
    String message;
    final granted = await health.requestAuthorization();
    if (!granted) {
      message = 'Chưa được cấp quyền truy cập dữ liệu sức khỏe.';
    } else {
      final kg = await health.latestWeightKg();
      if (kg == null) {
        message = 'Không tìm thấy dữ liệu cân nặng.';
      } else {
        final profile = ref.read(profileControllerProvider).valueOrNull;
        if (profile != null) {
          await ref
              .read(profileControllerProvider.notifier)
              .save(profile.copyWith(weightKg: kg));
        }
        ref.invalidate(todayStepsProvider);
        message = 'Đã nhập cân nặng: ${kg.toStringAsFixed(1)} kg';
      }
    }
    if (!mounted) return;
    setState(() => _busy = false);
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.12),
              borderRadius: AppRadii.btnR,
            ),
            child: const Icon(Icons.favorite_outline, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Apple Health / Google Fit',
                    style: TextStyle(fontWeight: FontWeight.w600)),
                SizedBox(height: 2),
                Text('Nhập cân nặng và bước chân',
                    style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
              ],
            ),
          ),
          _busy
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : TextButton(
                  onPressed: _importWeight,
                  child: const Text('Kết nối'),
                ),
        ],
      ),
    );
  }
}
