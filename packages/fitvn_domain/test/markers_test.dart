import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:test/test.dart';

void main() {
  MarkerEval evalOf(MarkerKey key, double v, [double? v2, SexType sex = SexType.male]) =>
      markers[key]!.evaluate(v, v2, sex);

  group('uric acid (sex-dependent limit)', () {
    test('male above 420 → high', () {
      final e = evalOf(MarkerKey.uricAcid, 450);
      expect(e.status, MarkerStatus.high);
      expect(e.label, 'Cao');
    });

    test('female above 360 → high (would be normal for male)', () {
      expect(evalOf(MarkerKey.uricAcid, 400, null, SexType.female).status,
          MarkerStatus.high);
      expect(evalOf(MarkerKey.uricAcid, 400).status, MarkerStatus.normal);
    });

    test('below 150 → low', () {
      expect(evalOf(MarkerKey.uricAcid, 100).status, MarkerStatus.low);
    });

    test('mid-range → normal', () {
      expect(evalOf(MarkerKey.uricAcid, 300).status, MarkerStatus.normal);
    });
  });

  group('fasting glucose thresholds', () {
    test('>= 7 → diabetes-risk high', () {
      final e = evalOf(MarkerKey.glucoseFasting, 7.5);
      expect(e.status, MarkerStatus.high);
      expect(e.label, 'Cao (nguy cơ tiểu đường)');
    });

    test('5.6–6.9 → pre-diabetes high', () {
      final e = evalOf(MarkerKey.glucoseFasting, 6.0);
      expect(e.status, MarkerStatus.high);
      expect(e.label, 'Tiền tiểu đường');
    });

    test('< 3.9 → low', () {
      expect(evalOf(MarkerKey.glucoseFasting, 3.0).status, MarkerStatus.low);
    });

    test('normal range', () {
      expect(evalOf(MarkerKey.glucoseFasting, 5.0).status, MarkerStatus.normal);
    });
  });

  group('blood pressure (two values)', () {
    test('systolic >= 140 or diastolic >= 90 → high', () {
      expect(evalOf(MarkerKey.bloodPressure, 145, 85).label, 'Cao');
      expect(evalOf(MarkerKey.bloodPressure, 130, 95).label, 'Cao');
    });

    test('elevated band → "Hơi cao"', () {
      expect(evalOf(MarkerKey.bloodPressure, 125, 70).label, 'Hơi cao');
    });

    test('low band', () {
      expect(evalOf(MarkerKey.bloodPressure, 85, 55).status, MarkerStatus.low);
    });

    test('normal', () {
      expect(
          evalOf(MarkerKey.bloodPressure, 110, 70).status, MarkerStatus.normal);
    });
  });

  group('HDL (higher is better, sex-dependent floor)', () {
    test('male below 1.0 → low', () {
      expect(evalOf(MarkerKey.hdl, 0.9).status, MarkerStatus.low);
    });

    test('male at/above 1.0 → normal "Tốt"', () {
      final e = evalOf(MarkerKey.hdl, 1.2);
      expect(e.status, MarkerStatus.normal);
      expect(e.label, 'Tốt');
    });

    test('female needs 1.3 floor', () {
      expect(evalOf(MarkerKey.hdl, 1.2, null, SexType.female).status,
          MarkerStatus.low);
    });
  });

  test('marker order and registry stay aligned', () {
    expect(markerOrder.length, markers.length);
    for (final key in markerOrder) {
      expect(markers.containsKey(key), isTrue);
    }
  });
}
