import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../core/env.dart';
import '../../data/sync/sync_models.dart';

class SyncState {
  const SyncState({this.running = false, this.last, this.error});
  final bool running;
  final SyncSummary? last;
  final String? error;

  SyncState copyWith({bool? running, SyncSummary? last, String? error}) =>
      SyncState(
        running: running ?? this.running,
        last: last ?? this.last,
        error: error,
      );
}

/// Drives the offline → Supabase push: once on startup and whenever
/// connectivity returns. No-op when Supabase isn't configured (local-only).
/// Keep alive by reading it from a long-lived widget (the shell).
final syncControllerProvider =
    NotifierProvider<SyncController, SyncState>(SyncController.new);

class SyncController extends Notifier<SyncState> {
  StreamSubscription<List<ConnectivityResult>>? _sub;

  @override
  SyncState build() {
    if (Env.isSupabaseConfigured) {
      _sub = Connectivity().onConnectivityChanged.listen((results) {
        final online = results.any((r) => r != ConnectivityResult.none);
        if (online) syncNow();
      });
      ref.onDispose(() => _sub?.cancel());
      // Initial drain (microtask so it runs after build returns).
      Future.microtask(syncNow);
    }
    return const SyncState();
  }

  Future<void> syncNow() async {
    if (!Env.isSupabaseConfigured || state.running) return;
    state = state.copyWith(running: true, error: null);
    try {
      final summary = await ref.read(syncServiceProvider).pushPending();
      // Then pull others' rows (multi-device). Skipped in local-only mode.
      final uid = ref.read(currentUserIdProvider);
      if (uid != 'local') {
        await ref.read(pullServiceProvider).pull(uid);
      }
      state = SyncState(running: false, last: summary);
    } catch (e) {
      state = SyncState(running: false, error: e.toString());
    }
  }
}

/// Live count of records pending sync (badge / status row).
final pendingSyncCountProvider = StreamProvider<int>((ref) {
  return ref.watch(databaseProvider).watchPendingCount();
});
