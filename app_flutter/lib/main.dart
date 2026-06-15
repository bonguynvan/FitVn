import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/app/app.dart';
import 'src/app/providers.dart';
import 'src/core/supabase.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // No-op when Supabase isn't configured (local-only mode).
  await initSupabase();

  // Seed the offline food cache from the bundle before the UI reads it, so
  // search + macro resolution work on first launch with no backend.
  final container = ProviderContainer();
  await container.read(foodRepositoryProvider).ensureSeeded();

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const FitVnApp(),
    ),
  );
}
