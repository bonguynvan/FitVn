import "server-only";

import webpush, { type PushSubscription as WebPushSubscription } from "web-push";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

import type { Database, PushSubscription } from "@/types/database.types";

/**
 * Server-side Web Push configuration + send helpers.
 *
 * VAPID keys are read from the environment (never hardcoded):
 *   - VAPID_SUBJECT                  e.g. "mailto:push@fitvn.app" or a https URL
 *   - NEXT_PUBLIC_VAPID_PUBLIC_KEY   shared with the browser (applicationServerKey)
 *   - VAPID_PRIVATE_KEY              server secret
 *
 * Generate a pair with:  npx web-push generate-vapid-keys
 * See docs/PWA_SETUP.md.
 */

let configured = false;

/**
 * Lazily call setVapidDetails exactly once. Throws a clear error if any VAPID
 * env var is missing so misconfiguration fails fast at the boundary instead of
 * silently dropping notifications.
 */
function ensureConfigured(): void {
  if (configured) return;

  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      "Missing VAPID env vars: VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set. Run `npx web-push generate-vapid-keys`.",
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

/**
 * Notification payload sent to the service worker's `push` event.
 * Kept small and explicit; the SW reads `title`, `body`, `data.url`, etc.
 */
export interface PushPayload {
  title: string;
  body: string;
  /** Deep-link opened when the notification is clicked. */
  url?: string;
  /** Collapses/replaces an earlier notification with the same tag. */
  tag?: string;
  icon?: string;
  badge?: string;
}

export interface SendResult {
  sent: number;
  pruned: number;
  failed: number;
  total: number;
}

/**
 * Admin Supabase client (service-role) used ONLY for cross-user, scheduled
 * sends where there is no user session (e.g. a CRON job). It bypasses RLS, so
 * it must never be exposed to the browser — this module is `server-only`.
 *
 * For self-notifications prefer passing the request-scoped (anon, RLS-bound)
 * client to `sendPushToUser` via the `loadSubscriptions` override.
 */
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase admin env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for scheduled push sends.",
    );
  }

  return createSupabaseAdmin<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Minimal shape needed to query/prune the push_subscriptions table. */
type SubscriptionLoader = (userId: string) => Promise<PushSubscription[]>;
type SubscriptionPruner = (endpoint: string) => Promise<void>;

function adminLoader(): {
  load: SubscriptionLoader;
  prune: SubscriptionPruner;
} {
  const admin = createAdminClient();

  const load: SubscriptionLoader = async (userId) => {
    const { data, error } = await admin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to load push subscriptions: ${error.message}`);
    }
    return data ?? [];
  };

  const prune: SubscriptionPruner = async (endpoint) => {
    // Best-effort cleanup of a dead endpoint; swallow errors so one stale row
    // never blocks delivery to the user's other devices.
    await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
  };

  return { load, prune };
}

/** HTTP status codes the push service returns for permanently dead endpoints. */
const DEAD_ENDPOINT_STATUSES = new Set([404, 410]);

function toWebPushSubscription(row: PushSubscription): WebPushSubscription {
  return {
    endpoint: row.endpoint,
    keys: { p256dh: row.p256dh, auth: row.auth },
  };
}

export interface SendToUserOptions {
  /**
   * Override how subscriptions are loaded/pruned. Pass a request-scoped
   * (RLS-bound) implementation for self-notifications. Defaults to the
   * service-role admin client for scheduled cross-user sends.
   */
  load?: SubscriptionLoader;
  prune?: SubscriptionPruner;
}

/**
 * Send a push notification to every subscription a user has registered.
 *
 * Dead endpoints (404/410) are pruned from push_subscriptions so the table
 * does not accumulate stale rows. Individual failures never throw; the result
 * summary reports counts so callers can log/observe delivery health.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  options: SendToUserOptions = {},
): Promise<SendResult> {
  ensureConfigured();

  if (!userId) {
    throw new Error("sendPushToUser: userId is required.");
  }

  const { load, prune } = options.load
    ? { load: options.load, prune: options.prune ?? (async () => {}) }
    : adminLoader();

  const subscriptions = await load(userId);
  const json = JSON.stringify(payload);

  let sent = 0;
  let pruned = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (row) => {
      try {
        await webpush.sendNotification(toWebPushSubscription(row), json);
        sent += 1;
      } catch (err) {
        const statusCode =
          typeof err === "object" && err !== null && "statusCode" in err
            ? Number((err as { statusCode: unknown }).statusCode)
            : undefined;

        if (statusCode !== undefined && DEAD_ENDPOINT_STATUSES.has(statusCode)) {
          await prune(row.endpoint);
          pruned += 1;
        } else {
          failed += 1;
        }
      }
    }),
  );

  return { sent, pruned, failed, total: subscriptions.length };
}

/** Re-export the configured vapid public key for server-rendered hints. */
export function getVapidPublicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
}
