import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// App routes. Phase 2 ships a placeholder home so the shell runs end-to-end;
/// the real screens (onboarding, home, nutrition, workouts, progress, profile,
/// coach) land in Phase 3, each backed by the providers in `providers.dart`.
final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const _HomePlaceholder(),
    ),
  ],
);

class _HomePlaceholder extends StatelessWidget {
  const _HomePlaceholder();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('FitVN')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'FitVN native — phase 2 scaffold.\n'
            'Domain core + data layer (Drift, Supabase sync, auth) are wired.\n'
            'Screens arrive in phase 3.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
