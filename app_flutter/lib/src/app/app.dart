import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'router.dart';

/// Root widget. Uses the ported design tokens so the native UI matches the web
/// look from the start.
class FitVnApp extends StatelessWidget {
  const FitVnApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'FitVN',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      routerConfig: appRouter,
    );
  }
}
