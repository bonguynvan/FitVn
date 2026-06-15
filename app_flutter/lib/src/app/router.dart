import 'package:go_router/go_router.dart';

import 'root_gate.dart';

/// App routes. `/` is the [RootGate], which shows onboarding or home based on
/// the local profile. Dedicated routes for each tab arrive in Phase 3b.
final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (context, state) => const RootGate()),
  ],
);
