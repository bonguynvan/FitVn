import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/coach/coach_screen.dart';
import '../features/home/home_screen.dart';
import '../features/nutrition/nutrition_screen.dart';
import '../features/progress/progress_screen.dart';
import '../features/sync/sync_controller.dart';
import '../features/workouts/workouts_screen.dart';
import '../theme/tokens.dart';

/// Bottom-tab shell. Mirrors the web app's five destinations and order:
/// Trang chủ · Lịch tập · Dinh dưỡng · HLV AI · Tiến độ.
///
/// Uses an [IndexedStack] so each tab keeps its state across switches (the
/// coach conversation, scroll positions, etc.).
class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key});

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  int _index = 0;

  static const _tabs = [
    HomeScreen(),
    WorkoutsScreen(),
    NutritionScreen(),
    CoachScreen(),
    ProgressScreen(),
  ];

  @override
  void initState() {
    super.initState();
    // Instantiate the sync controller so its connectivity listener + startup
    // drain run for the app's lifetime.
    ref.read(syncControllerProvider);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.primary.withValues(alpha: 0.12),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home),
              label: 'Trang chủ'),
          NavigationDestination(
              icon: Icon(Icons.fitness_center_outlined),
              selectedIcon: Icon(Icons.fitness_center),
              label: 'Lịch tập'),
          NavigationDestination(
              icon: Icon(Icons.restaurant_outlined),
              selectedIcon: Icon(Icons.restaurant),
              label: 'Dinh dưỡng'),
          NavigationDestination(
              icon: Icon(Icons.smart_toy_outlined),
              selectedIcon: Icon(Icons.smart_toy),
              label: 'HLV AI'),
          NavigationDestination(
              icon: Icon(Icons.trending_up_outlined),
              selectedIcon: Icon(Icons.trending_up),
              label: 'Tiến độ'),
        ],
      ),
    );
  }
}
