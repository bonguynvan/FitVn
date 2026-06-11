/**
 * FitVN — custom service worker additions.
 *
 * `@ducanh2912/next-pwa` compiles this file (customWorkerDir: "worker") and
 * merges it into the generated Workbox service worker via importScripts. Workbox
 * handles precaching + runtime caching, but it does NOT add Web Push handlers —
 * so the `push` (display a notification) and `notificationclick` (open the deep
 * link) listeners live here. Without this file, subscriptions succeed and the
 * server sends payloads, but nothing is ever shown on the device.
 *
 * Payload shape is produced by lib/push/web-push.ts (PushPayload), sent as the
 * JSON body of the push: { title, body, url?, tag?, icon?, badge? }.
 */

self.addEventListener("push", (event) => {
  /** @type {{ title?: string, body?: string, url?: string, tag?: string, icon?: string, badge?: string }} */
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_err) {
    // Non-JSON payloads (rare) — fall back to plain text.
    payload = { title: "FitVN", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "FitVN";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/icon-192.png",
    tag: payload.tag,
    // Replace an earlier notification with the same tag instead of stacking.
    renotify: Boolean(payload.tag),
    vibrate: [80, 40, 80],
    data: { url: payload.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus an already-open FitVN window if one matches the target.
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      }),
  );
});
