import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:test/test.dart';

void main() {
  group('hasCondition', () {
    test('true when present', () {
      expect(hasCondition(const [ConditionKey.gout], ConditionKey.gout), isTrue);
    });

    test('false when absent or null', () {
      expect(
          hasCondition(const [ConditionKey.gout], ConditionKey.diabetes), isFalse);
      expect(hasCondition(null, ConditionKey.gout), isFalse);
    });
  });

  group('sodiumLimitFor', () {
    test('tightens to 1500 with hypertension', () {
      expect(sodiumLimitFor(const [ConditionKey.hypertension]), 1500);
    });

    test('defaults to 2000 otherwise', () {
      expect(sodiumLimitFor(const [ConditionKey.gout]), 2000);
      expect(sodiumLimitFor(null), 2000);
    });
  });

  group('conditionFocuses', () {
    test('maps each condition to "label: focus"', () {
      expect(
        conditionFocuses(const [ConditionKey.gout]),
        ['Gout: Hạn chế nội tạng, hải sản, thịt đỏ, bia rượu; uống nhiều nước.'],
      );
    });

    test('empty for null', () {
      expect(conditionFocuses(null), isEmpty);
    });
  });

  test('purineLimit tightens under gout mode', () {
    expect(purineLimit(), 400);
    expect(purineLimit(goutMode: true), 200);
  });

  test('condition order covers every defined condition', () {
    expect(conditionOrder.length, conditions.length);
    for (final key in conditionOrder) {
      expect(conditions.containsKey(key), isTrue);
    }
  });
}
