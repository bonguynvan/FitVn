/// Build-time configuration, supplied via `--dart-define` so no secrets live in
/// source. Mirrors the web app's NEXT_PUBLIC_SUPABASE_* env vars.
///
/// Example:
///   flutter run \
///     --dart-define=SUPABASE_URL=https://xxxx.supabase.co \
///     --dart-define=SUPABASE_ANON_KEY=eyJ... \
///     --dart-define=COACH_ENDPOINT=https://xxxx.functions.supabase.co/coach
library;

class Env {
  const Env._();

  static const String supabaseUrl =
      String.fromEnvironment('SUPABASE_URL', defaultValue: '');

  static const String supabaseAnonKey =
      String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: '');

  /// Coach endpoint. Defaults to the Supabase Edge Function; can be pointed at
  /// the legacy Next.js `/api/coach` route during the transition.
  static const String coachEndpoint =
      String.fromEnvironment('COACH_ENDPOINT', defaultValue: '');

  /// True when Supabase credentials are present. When false the app runs in a
  /// local-only mode (mirrors the web app's stub-session fallback).
  static bool get isSupabaseConfigured =>
      supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;
}
