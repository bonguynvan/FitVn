import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/onboarding/onboarding_screen.dart';
import '../features/profile/profile_controller.dart';
import 'main_shell.dart';

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
      data: (p) => p == null ? const OnboardingScreen() : const MainShell(),
    );
  }
}
