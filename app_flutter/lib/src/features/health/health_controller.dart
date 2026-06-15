import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../data/local/database.dart';
import '../../data/repositories/health_repository.dart';

/// All health readings, newest first.
final healthReadingsProvider = StreamProvider<List<HealthReading>>((ref) {
  return ref.watch(healthRepositoryProvider).watch();
});

/// Latest reading per marker.
final latestByMarkerProvider = Provider<Map<MarkerKey, HealthReading>>((ref) {
  final readings = ref.watch(healthReadingsProvider).valueOrNull ?? const [];
  final out = <MarkerKey, HealthReading>{};
  for (final r in readings) {
    final key = _key(r.marker);
    if (key == null) continue;
    // readings are newest-first, so the first seen per marker is the latest.
    out.putIfAbsent(key, () => r);
  }
  return out;
});

/// Oldest → newest value series per marker, for sparklines.
final seriesByMarkerProvider = Provider<Map<MarkerKey, List<double>>>((ref) {
  final readings = ref.watch(healthReadingsProvider).valueOrNull ?? const [];
  final out = <MarkerKey, List<double>>{};
  for (final r in readings.reversed) {
    final key = _key(r.marker);
    if (key == null) continue;
    (out[key] ??= []).add(r.value);
  }
  return out;
});

MarkerKey? _key(String wire) {
  for (final k in MarkerKey.values) {
    if (k.wire == wire) return k;
  }
  return null;
}

final healthActionsProvider = Provider<HealthActions>(
  (ref) => HealthActions(
    ref.watch(healthRepositoryProvider),
    () => ref.read(currentUserIdProvider),
  ),
);

class HealthActions {
  HealthActions(this._repo, this._userId);
  final HealthRepository _repo;
  final String Function() _userId;

  Future<void> add({
    required MarkerKey marker,
    required double value,
    double? value2,
    required String measuredOn,
  }) =>
      _repo.add(
        userId: _userId(),
        marker: marker.wire,
        value: value,
        value2: value2,
        measuredOn: measuredOn,
      );

  Future<void> remove(int id) => _repo.remove(id);
}
