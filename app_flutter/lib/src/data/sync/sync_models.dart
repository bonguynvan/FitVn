/// Sync value types, mirroring `lib/db/sync.ts`.

const int kMaxSyncAttempts = 5;

/// Outcome counts for a single sync pass.
class SyncSummary {
  int processed = 0;
  int succeeded = 0;
  int failed = 0;
  int skipped = 0;

  @override
  String toString() =>
      'SyncSummary(processed: $processed, succeeded: $succeeded, '
      'failed: $failed, skipped: $skipped)';
}

enum SyncOutcome { synced, skipped }
