/// Default daily goals and reference values. Ported from `lib/config/targets.ts`.
/// Kept in one place so screens stay consistent.

import 'targets.dart' show DailyTargets;
import 'enums.dart' show SexType;

const DailyTargets dailyTargets = DailyTargets(
  calories: 2200,
  proteinG: 150,
  carbsG: 240,
  fatG: 70,
);

const int waterGoalCups = 8;

/// Daily fiber goal (g) and sodium upper limit (mg) for the health-check lines.
const int fiberTargetG = 25;
const int sodiumLimitMg = 2000;

/// Micronutrient reference values (approx adult RDA / limits).
const int calciumTargetMg = 1000;

/// Iron RDA differs by sex (menstruation).
const Map<SexType, int> ironTargetMg = {
  SexType.male: 8,
  SexType.female: 18,
  SexType.other: 12,
};

/// Daily purine ceiling (mg) for general tracking.
const int purineLimitMg = 400;

/// Tighter daily ceiling when gout mode is on (active gout management).
const int purineLimitMgGout = 200;

/// A food (per 100 g edible) at/above this purine level counts as "high purine".
const int highPurinePer100g = 150;

/// Daily purine ceiling, tightened when the user is managing gout.
int purineLimit({bool goutMode = false}) =>
    goutMode ? purineLimitMgGout : purineLimitMg;
