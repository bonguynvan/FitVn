/// Seed exercise catalog so workout logging works offline out of the box.
/// SEED ONLY — replaced by the full exercises table (Supabase) in a later phase.
class CatalogExercise {
  const CatalogExercise({
    required this.id,
    required this.nameVi,
    required this.muscleGroup,
  });

  final String id;
  final String nameVi;
  final String muscleGroup;
}

const List<CatalogExercise> seedExercises = [
  CatalogExercise(id: 'squat', nameVi: 'Squat (gánh tạ)', muscleGroup: 'legs'),
  CatalogExercise(id: 'deadlift', nameVi: 'Deadlift', muscleGroup: 'back'),
  CatalogExercise(
      id: 'bench_press',
      nameVi: 'Đẩy ngực (bench press)',
      muscleGroup: 'chest'),
  CatalogExercise(
      id: 'overhead_press', nameVi: 'Đẩy vai', muscleGroup: 'shoulders'),
  CatalogExercise(id: 'pull_up', nameVi: 'Hít xà', muscleGroup: 'back'),
  CatalogExercise(id: 'row', nameVi: 'Kéo tạ (row)', muscleGroup: 'back'),
  CatalogExercise(id: 'lunge', nameVi: 'Lunge', muscleGroup: 'legs'),
  CatalogExercise(
      id: 'biceps_curl', nameVi: 'Cuốn tạ tay trước', muscleGroup: 'biceps'),
  CatalogExercise(
      id: 'triceps_pushdown', nameVi: 'Đẩy tạ tay sau', muscleGroup: 'triceps'),
  CatalogExercise(id: 'plank', nameVi: 'Plank', muscleGroup: 'core'),
  CatalogExercise(id: 'running', nameVi: 'Chạy bộ', muscleGroup: 'cardio'),
  CatalogExercise(id: 'cycling', nameVi: 'Đạp xe', muscleGroup: 'cardio'),
];

CatalogExercise? exerciseById(String id) {
  for (final e in seedExercises) {
    if (e.id == id) return e;
  }
  return null;
}
