import 'package:flutter/material.dart';

/// Design tokens ported 1:1 from the web app (`app/globals.css`,
/// `tailwind.config.ts`) — the "fresh & healthy" direction: airy light
/// surfaces, emerald brand, deep green-charcoal text. Single source of truth
/// for the native theme so both clients look the same.
class AppColors {
  const AppColors._();

  static const bg = Color(0xFFF4F7F4);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceRaised = Color(0xFFEEF3EF);
  static const border = Color(0xFFE7EEE9);

  static const text = Color(0xFF14231C);
  static const textMuted = Color(0xFF6B7B74);

  static const primary = Color(0xFF0E9F6E);
  static const primaryFg = Color(0xFFFFFFFF);
  static const accent = Color(0xFF0E9F6E);

  static const success = Color(0xFF0E9F6E);
  static const warning = Color(0xFFD9892B);
  static const danger = Color(0xFFE5365B);
}

class AppRadii {
  const AppRadii._();

  static const double card = 18;
  static const double btn = 14;
  static const double pill = 999;

  static const cardR = BorderRadius.all(Radius.circular(card));
  static const btnR = BorderRadius.all(Radius.circular(btn));
}

class AppShadows {
  const AppShadows._();

  /// `--shadow-card`: soft, diffuse elevation (light from above).
  static const card = [
    BoxShadow(color: Color(0x0A10241C), blurRadius: 2, offset: Offset(0, 1)),
    BoxShadow(color: Color(0x2910241C), blurRadius: 26, offset: Offset(0, 10)),
  ];

  /// `--shadow-glow`: emerald lift used by the primary CTA.
  static const glow = [
    BoxShadow(color: Color(0x6B0E9F6E), blurRadius: 26, offset: Offset(0, 10)),
  ];
}

/// Emerald hero band (`--gradient-hero`).
const heroGradient = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [Color(0xFF1EC18A), Color(0xFF0E9F6E), Color(0xFF0A7350)],
  stops: [0.0, 0.52, 1.0],
);

/// Mobile-first single-column max width (`--app-max-width`, 30rem).
const double kAppMaxWidth = 480;
