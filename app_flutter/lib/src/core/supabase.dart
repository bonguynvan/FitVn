import 'package:supabase_flutter/supabase_flutter.dart';

import 'env.dart';

/// Supabase bootstrap. Call [initSupabase] once before `runApp`.
///
/// Safe to skip when [Env.isSupabaseConfigured] is false — the app then runs
/// local-only (Drift cache + the coach's deterministic fallback), matching the
/// web app's "runs without a backend" behavior.
Future<void> initSupabase() async {
  if (!Env.isSupabaseConfigured) return;
  await Supabase.initialize(
    url: Env.supabaseUrl,
    anonKey: Env.supabaseAnonKey,
  );
}

/// The shared client. Throws if accessed before [initSupabase] succeeds; guard
/// with [Env.isSupabaseConfigured] at call sites that may run local-only.
SupabaseClient get supabase => Supabase.instance.client;
