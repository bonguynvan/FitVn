import 'dart:io' show Platform;

import 'package:health/health.dart';

/// Apple Health (iOS) / Health Connect (Android) integration via the `health`
/// package. Read-only for now: import body weight, read today's steps.
///
/// REQUIRED NATIVE SETUP (can't ship in source — do this in `flutter create .`
/// output before it works):
///   iOS:    HealthKit capability + Info.plist NSHealthShareUsageDescription
///           (and NSHealthUpdateUsageDescription if you later write data).
///   Android: Health Connect — permissions in AndroidManifest.xml + the
///            Health Connect app installed; min SDK per the `health` package.
///
/// All methods fail soft (return null / false) so a denied or unconfigured
/// platform never crashes the app.
class HealthIntegrationService {
  final Health _health = Health();

  static const _types = [HealthDataType.WEIGHT, HealthDataType.STEPS];
  static const _perms = [HealthDataAccess.READ, HealthDataAccess.READ];

  bool get isSupported => Platform.isIOS || Platform.isAndroid;

  /// Configure + request read access. Returns true if granted.
  Future<bool> requestAuthorization() async {
    if (!isSupported) return false;
    try {
      await _health.configure();
      return await _health.requestAuthorization(_types, permissions: _perms);
    } catch (_) {
      return false;
    }
  }

  /// Most recent body weight in kg, or null if none / not authorized.
  Future<double?> latestWeightKg() async {
    if (!isSupported) return null;
    try {
      final now = DateTime.now();
      final points = await _health.getHealthDataFromTypes(
        types: const [HealthDataType.WEIGHT],
        startTime: now.subtract(const Duration(days: 365)),
        endTime: now,
      );
      if (points.isEmpty) return null;
      points.sort((a, b) => b.dateTo.compareTo(a.dateTo)); // newest first
      final value = points.first.value;
      if (value is NumericHealthValue) {
        return value.numericValue.toDouble();
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Steps since midnight today, or null if unavailable.
  Future<int?> todaySteps() async {
    if (!isSupported) return null;
    try {
      final now = DateTime.now();
      final midnight = DateTime(now.year, now.month, now.day);
      return await _health.getTotalStepsInInterval(midnight, now);
    } catch (_) {
      return null;
    }
  }
}
