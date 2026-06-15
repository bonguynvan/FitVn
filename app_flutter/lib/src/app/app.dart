import 'package:flutter/material.dart';

import 'router.dart';

/// Root widget. Theme is a deliberate placeholder — Phase 3 ports the web app's
/// design tokens (colors, radii, spacing) into a real [ThemeData] before any
/// screens are built, so the native UI matches the web look from the start.
class FitVnApp extends StatelessWidget {
  const FitVnApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'FitVN',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF22C55E), // green seed, refined later
        useMaterial3: true,
      ),
      routerConfig: appRouter,
    );
  }
}
