import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/env.dart';
import '../core/supabase.dart';
import '../data/local/database.dart';
import '../data/repositories/auth_repository.dart';
import '../data/repositories/nutrition_repository.dart';
import '../data/repositories/profile_repository.dart';
import '../data/repositories/workout_repository.dart';
import '../data/sync/sync_service.dart';
import '../features/coach/coach_client.dart';

/// Dependency wiring. Equivalent to the web app's module singletons + stores,
/// but composed through Riverpod so everything is overridable in tests.
///
/// Providers that touch Supabase ([authRepositoryProvider], etc.) assume
/// `initSupabase()` ran; only read them when `Env.isSupabaseConfigured`.

final databaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});

final authRepositoryProvider =
    Provider<AuthRepository>((ref) => AuthRepository(supabase));

final profileRepositoryProvider =
    Provider<ProfileRepository>((ref) => ProfileRepository(supabase));

final syncServiceProvider = Provider<SyncService>(
  (ref) => SyncService(ref.watch(databaseProvider), supabase),
);

final coachClientProvider = Provider<CoachClient>((ref) {
  final client = CoachClient();
  return client;
});

final nutritionRepositoryProvider = Provider<NutritionRepository>(
  (ref) => NutritionRepository(ref.watch(databaseProvider)),
);

final workoutRepositoryProvider = Provider<WorkoutRepository>(
  (ref) => WorkoutRepository(ref.watch(databaseProvider)),
);

/// The signed-in user's id, or 'local' when running without a backend (the
/// native counterpart to the web app's stub session). Pending records key off
/// this so they sync to the right account once signed in.
final currentUserIdProvider = Provider<String>((ref) {
  if (!Env.isSupabaseConfigured) return 'local';
  return supabase.auth.currentUser?.id ?? 'local';
});

/// Auth state stream — drives the router's redirect (logged-in vs login).
final authStateProvider = StreamProvider((ref) {
  return ref.watch(authRepositoryProvider).authStateChanges;
});
