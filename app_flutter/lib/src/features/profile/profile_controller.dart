import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/local/profile_store.dart';

final profileStoreProvider = Provider<ProfileStore>((ref) => ProfileStore());

/// Loads/saves the user profile. `null` data means "not set up yet" → onboarding.
final profileControllerProvider =
    AsyncNotifierProvider<ProfileController, UserProfile?>(
  ProfileController.new,
);

class ProfileController extends AsyncNotifier<UserProfile?> {
  ProfileStore get _store => ref.read(profileStoreProvider);

  @override
  Future<UserProfile?> build() => _store.load();

  /// Persist a completed/edited profile. Body metrics are clamped to valid
  /// ranges here (on confirm), never while the user types.
  Future<void> save(UserProfile profile) async {
    final clamped = clampProfileMetrics(profile).copyWith(
      name: profile.name.trim(),
    );
    state = AsyncData(clamped);
    await _store.save(clamped);
  }

  Future<void> reset() async {
    await _store.clear();
    state = const AsyncData(null);
  }
}
