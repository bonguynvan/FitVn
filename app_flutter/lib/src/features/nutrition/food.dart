/// Unified food model used across the library, search, and logging. Pure (no
/// Drift import); the repository maps to/from the Drift cache + Supabase rows.
class Food {
  const Food({
    required this.id,
    required this.nameVi,
    required this.caloriesPer100g,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    this.nameEn,
    this.brand,
    this.servingDesc,
    this.fiberG,
    this.isVietnamese = true,
  });

  final String id;
  final String nameVi;
  final String? nameEn;
  final String? brand;
  final String? servingDesc;

  /// Per 100 g edible portion.
  final double caloriesPer100g;
  final double proteinG;
  final double carbsG;
  final double fatG;
  final double? fiberG;
  final bool isVietnamese;

  /// Map a Supabase `foods` row (see types/database.types.ts).
  factory Food.fromSupabase(Map<String, dynamic> r) {
    double d(Object? v) => (v as num?)?.toDouble() ?? 0;
    return Food(
      id: (r['slug'] ?? r['id']) as String,
      nameVi: r['name_vi'] as String,
      nameEn: r['name_en'] as String?,
      brand: r['brand'] as String?,
      servingDesc: r['serving_desc'] as String?,
      caloriesPer100g: d(r['calories_per_100g']),
      proteinG: d(r['protein_g']),
      carbsG: d(r['carbs_g']),
      fatG: d(r['fat_g']),
      fiberG: (r['fiber_g'] as num?)?.toDouble(),
      isVietnamese: (r['is_vietnamese'] as bool?) ?? true,
    );
  }
}
