import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/onboarding/onboarding_screen.dart';
import '../features/profile/profile_controller.dart';
import '../theme/tokens.dart';

/// Decides the first screen by watching the local profile:
///   loading → splash · no profile → onboarding · profile → home.
/// Completing onboarding sets the profile, so this rebuilds to home with no
/// manual navigation.
class RootGate extends ConsumerWidget {
  const RootGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileControllerProvider);
    return profile.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        body: Center(child: Text('Lỗi tải hồ sơ: $e')),
      ),
      data: (p) => p == null ? const OnboardingScreen() : const _HomePlaceholder(),
    );
  }
}

class _HomePlaceholder extends StatelessWidget {
  const _HomePlaceholder();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('FitVN')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Hồ sơ đã được thiết lập 🎉\n\n'
            'Màn hình chính (trang chủ, dinh dưỡng, tập luyện, tiến độ, HLV) '
            'sẽ được thêm ở giai đoạn 3b.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textMuted, height: 1.5),
          ),
        ),
      ),
    );
  }
}
