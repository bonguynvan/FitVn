import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../data/local/database.dart';
import '../profile/profile_controller.dart';

/// All body measurements, oldest → newest (chart-ready).
final measurementsProvider = StreamProvider<List<BodyMeasurement>>((ref) {
  return ref.watch(measurementRepositoryProvider).watch();
});

final measurementActionsProvider = Provider<MeasurementActions>((ref) {
  return MeasurementActions(ref);
});

class MeasurementActions {
  MeasurementActions(this._ref);
  final Ref _ref;

  /// Log a measurement. The new weight also becomes the profile's current
  /// weight so targets recompute against the latest body weight.
  Future<void> add({
    required String measuredOn,
    required double weightKg,
    double? bodyFatPct,
    double? waistCm,
  }) async {
    await _ref.read(measurementRepositoryProvider).add(
          measuredOn: measuredOn,
          weightKg: weightKg,
          bodyFatPct: bodyFatPct,
          waistCm: waistCm,
        );
    final profile = _ref.read(profileControllerProvider).valueOrNull;
    if (profile != null && profile.weightKg != weightKg) {
      await _ref
          .read(profileControllerProvider.notifier)
          .save(profile.copyWith(weightKg: weightKg));
    }
  }

  Future<void> remove(int id) =>
      _ref.read(measurementRepositoryProvider).remove(id);
}
