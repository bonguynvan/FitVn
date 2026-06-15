import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/app/app.dart';
import 'src/core/supabase.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // No-op when Supabase isn't configured (local-only mode).
  await initSupabase();
  runApp(const ProviderScope(child: FitVnApp()));
}
