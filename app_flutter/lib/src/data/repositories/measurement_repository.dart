import 'package:drift/drift.dart';

import '../local/database.dart';

/// Local storage for body measurements (weight + optional body-fat % / waist).
class MeasurementRepository {
  MeasurementRepository(this._db);

  final AppDatabase _db;

  Future<void> add({
    required String measuredOn, // yyyy-mm-dd
    required double weightKg,
    double? bodyFatPct,
    double? waistCm,
  }) {
    return _db.addMeasurement(BodyMeasurementsCompanion.insert(
      measuredOn: measuredOn,
      weightKg: weightKg,
      bodyFatPct: Value(bodyFatPct),
      waistCm: Value(waistCm),
      createdAt: DateTime.now().millisecondsSinceEpoch,
    ));
  }

  Stream<List<BodyMeasurement>> watch() => _db.watchMeasurements();

  Future<void> remove(int id) => _db.deleteMeasurement(id);
}
