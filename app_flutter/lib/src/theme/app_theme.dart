import 'package:flutter/material.dart';

import 'tokens.dart';

/// Builds the app [ThemeData] from the ported design tokens. Headings use a
/// soft weight (~w500/w600), matching the web app's deliberate "never 700"
/// remap for the warm, friendly feel.
ThemeData buildAppTheme() {
  final scheme = const ColorScheme.light(
    primary: AppColors.primary,
    onPrimary: AppColors.primaryFg,
    secondary: AppColors.accent,
    surface: AppColors.surface,
    onSurface: AppColors.text,
    error: AppColors.danger,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: AppColors.bg,
    splashFactory: InkRipple.splashFactory,
    textTheme: _textTheme(),
    inputDecorationTheme: _inputTheme(),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.primaryFg,
        minimumSize: const Size.fromHeight(52),
        shape: const RoundedRectangleBorder(borderRadius: AppRadii.btnR),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
      ),
    ),
  );
}

TextTheme _textTheme() {
  const headingColor = AppColors.text;
  return const TextTheme(
    headlineLarge: TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.w600,
      letterSpacing: -0.5,
      color: headingColor,
    ),
    titleLarge: TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.w600,
      letterSpacing: -0.2,
      color: headingColor,
    ),
    titleMedium: TextStyle(
      fontSize: 15,
      fontWeight: FontWeight.w600,
      color: headingColor,
    ),
    bodyMedium: TextStyle(fontSize: 14, color: AppColors.text, height: 1.5),
    bodySmall: TextStyle(fontSize: 12, color: AppColors.textMuted, height: 1.4),
  );
}

InputDecorationTheme _inputTheme() {
  OutlineInputBorder border(Color c) => OutlineInputBorder(
        borderRadius: AppRadii.btnR,
        borderSide: BorderSide(color: c),
      );
  return InputDecorationTheme(
    filled: true,
    fillColor: AppColors.surface,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    enabledBorder: border(AppColors.border),
    focusedBorder: border(AppColors.primary),
    hintStyle: const TextStyle(color: AppColors.textMuted),
  );
}
