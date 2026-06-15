/// Vietnamese selection labels shared by both clients (mirrors the option
/// arrays in `lib/fitness/targets.ts`). Kept beside the enums so web and native
/// present identical copy.

import 'enums.dart';

class Labeled<T> {
  const Labeled(this.value, this.label, [this.hint]);
  final T value;
  final String label;
  final String? hint;
}

const List<Labeled<GoalType>> goalOptions = [
  Labeled(GoalType.loseFat, 'Giảm mỡ', 'Ăn ít hơn mức duy trì'),
  Labeled(GoalType.maintain, 'Duy trì', 'Giữ cân nặng hiện tại'),
  Labeled(GoalType.gainMuscle, 'Tăng cơ', 'Ăn nhiều hơn để tăng cơ'),
];

const List<Labeled<SexType>> sexOptions = [
  Labeled(SexType.male, 'Nam'),
  Labeled(SexType.female, 'Nữ'),
  Labeled(SexType.other, 'Khác'),
];

const List<Labeled<ActivityLevel>> activityOptions = [
  Labeled(ActivityLevel.sedentary, 'Ít vận động'),
  Labeled(ActivityLevel.light, 'Nhẹ — 1-3 buổi/tuần'),
  Labeled(ActivityLevel.moderate, 'Vừa — 3-5 buổi/tuần'),
  Labeled(ActivityLevel.active, 'Nhiều — 6-7 buổi/tuần'),
  Labeled(ActivityLevel.veryActive, 'Rất nhiều — vận động viên'),
];
