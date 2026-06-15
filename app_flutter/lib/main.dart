import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

import 'src/app/app.dart';
import 'src/app/providers.dart';
import 'src/core/supabase.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // No-op when Supabase isn't configured (local-only mode).
  await initSupabase();

  // Timezone DB for daily reminder scheduling (FitVN's audience is Vietnam).
  tz.initializeTimeZones();
  tz.setLocalLocation(tz.getLocation('Asia/Ho_Chi_Minh'));

  final container = ProviderContainer();
  // Seed the offline food cache from the bundle before the UI reads it.
  await container.read(foodRepositoryProvider).ensureSeeded();
  // Initialize local notifications (reminders work offline; no backend).
  await container.read(notificationServiceProvider).init();

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const FitVnApp(),
    ),
  );
}
