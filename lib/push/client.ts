/**
 * Browser-side Web Push helpers (no React, no DOM rendering).
 *
 * These run only in the browser. Each function guards against missing APIs so
 * unsupported browsers (older Safari, in-app webviews) degrade gracefully
 * instead of throwing.
 */

/**
 * Convert a base64url-encoded VAPID public key into the Uint8Array that
 * `pushManager.subscribe({ applicationServerKey })` expects.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = atob(base64);
  // Back the array with a concrete ArrayBuffer so the result is a valid
  // BufferSource for pushManager.subscribe({ applicationServerKey }) under the
  // generic Uint8Array<ArrayBufferLike> typings (TS 5.7+ lib.dom).
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** True when this browser can register a service worker and receive push. */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Resolve to the active ServiceWorkerRegistration once it is ready.
 * next-pwa registers the worker (`register: true`), so we await `.ready`
 * rather than registering a second time.
 */
export async function registerServiceWorkerReady(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Trình duyệt không hỗ trợ Service Worker.");
  }
  return navigator.serviceWorker.ready;
}

/** Return the existing push subscription for this device, or null. */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await registerServiceWorkerReady();
  return registration.pushManager.getSubscription();
}

export interface SubscribeOptions {
  /** base64url VAPID public key (NEXT_PUBLIC_VAPID_PUBLIC_KEY). */
  vapidPublicKey: string;
}

/**
 * Request notification permission and create a push subscription.
 *
 * Throws a Vietnamese, user-facing Error when permission is denied or push is
 * unsupported so the calling component can surface a clear message.
 */
export async function subscribeUser({
  vapidPublicKey,
}: SubscribeOptions): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error("Thiết bị này không hỗ trợ thông báo đẩy.");
  }
  if (!vapidPublicKey) {
    throw new Error("Thiếu cấu hình VAPID public key.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Bạn đã chặn thông báo. Hãy bật lại trong cài đặt trình duyệt."
        : "Bạn chưa cho phép nhận thông báo.",
    );
  }

  const registration = await registerServiceWorkerReady();

  // Reuse an existing subscription if present (idempotent).
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
}

/**
 * Unsubscribe this device from push. Returns true if there was a subscription
 * to remove. The caller is responsible for telling the server to delete the
 * row (the endpoint is available before unsubscribing).
 */
export async function unsubscribeUser(): Promise<{
  endpoint: string | null;
  removed: boolean;
}> {
  if (!isPushSupported()) return { endpoint: null, removed: false };

  const registration = await registerServiceWorkerReady();
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return { endpoint: null, removed: false };

  const endpoint = subscription.endpoint;
  const removed = await subscription.unsubscribe();
  return { endpoint, removed };
}

/**
 * Serialize a PushSubscription into the JSON shape our API expects
 * (endpoint + p256dh + auth), independent of browser quirks.
 */
export function serializeSubscription(subscription: PushSubscription): {
  endpoint: string;
  p256dh: string;
  auth: string;
} {
  const json = subscription.toJSON();
  const keys = json.keys ?? {};
  if (!json.endpoint || !keys.p256dh || !keys.auth) {
    throw new Error("Subscription thiếu thông tin (endpoint/keys).");
  }
  return { endpoint: json.endpoint, p256dh: keys.p256dh, auth: keys.auth };
}

/** Current Notification permission, safe on unsupported browsers. */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}
