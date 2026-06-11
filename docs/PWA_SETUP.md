# FitVN — PWA Setup & Operations Guide

FitVN is a Progressive Web App: installable, offline-capable, and able to send
push notifications. This document covers how the pieces fit together, how to
configure secrets, and how to test everything on a real (or emulated) phone.

---

## 1. Architecture overview

| Concern                | Where it lives                                         |
| ---------------------- | ------------------------------------------------------ |
| Service worker wiring  | `next.config.mjs` (via `@ducanh2912/next-pwa`)         |
| Web App Manifest       | `public/manifest.json`                                 |
| App icons              | `public/icons/` (source `icon.svg` + exported PNGs)    |
| Offline fallback page  | `app/offline/page.tsx`                                 |
| Install prompt UI      | `components/pwa/InstallPrompt.tsx`                      |
| Push opt-in UI         | `components/pwa/PushManager.tsx`                        |
| Push client helpers    | `lib/push/client.ts`                                   |
| Push server + send     | `lib/push/web-push.ts`                                  |
| Push API routes        | `app/api/push/{subscribe,unsubscribe,send}/route.ts`   |
| Offline DB (IndexedDB) | `lib/db/dexie.ts`                                       |
| Offline → cloud sync   | `lib/db/sync.ts`                                        |
| Online/sync hooks      | `hooks/useOnlineStatus.ts`, `hooks/useOfflineSync.ts`  |

---

## 2. How `@ducanh2912/next-pwa` is configured

See `next.config.mjs`. Key choices:

- **`dest: "public"`** — the generated `sw.js` + Workbox runtime are emitted to
  `public/` and served from the site root.
- **`disable: isDev`** — the service worker is **off in `next dev`** so it never
  fights Hot Module Reload. You only see PWA behavior in a production build
  (`next build && next start`) or on a deployed preview.
- **`register: true`** — next-pwa injects the registration script; the app code
  never calls `navigator.serviceWorker.register` itself. Push helpers therefore
  await `navigator.serviceWorker.ready` instead of re-registering.
- **`reloadOnOnline: true`** — when connectivity returns, the page reloads to
  pick up fresh content.
- **`cacheOnFrontEndNav` + `aggressiveFrontEndNavCaching: true`** — client-side
  navigations are cached so previously visited screens open instantly offline.
- **`fallbacks.document: "/offline"`** — any navigation that misses both network
  and cache renders `app/offline/page.tsx`.

### Caching strategy (runtimeCaching)

| Request type                  | Strategy             | Why                                            |
| ----------------------------- | -------------------- | ---------------------------------------------- |
| Google Fonts / local fonts    | `CacheFirst`         | Rarely change; expensive to refetch.           |
| Images (png/jpg/svg/webp/…)   | `CacheFirst`         | Static assets; instant repeat paints.          |
| `GET /api/*`                  | `NetworkFirst` (5s)  | Prefer fresh data, fall back to cache offline. |
| JS / CSS                      | `StaleWhileRevalidate` | Fast paint now, refresh in the background.    |
| `/_next/data/*.json`          | `StaleWhileRevalidate` | App Router data, same tradeoff.              |

> **Note:** Only `GET` API requests are cached. Mutations (`POST`/`PUT`/`DELETE`)
> are never cached — offline writes go through the **Dexie sync queue** instead
> (see §6), not the HTTP cache.

---

## 3. Generating VAPID keys (push)

Web Push requires a VAPID key pair. Generate one **once** and reuse it across
environments (rotating it invalidates every existing subscription):

```bash
npx web-push generate-vapid-keys
```

Output:

```
=======================================
Public Key:
Bw...long-base64url...Ac
Private Key:
3x...base64url...9k
=======================================
```

### Where the secrets go

Set these environment variables (locally in `.env.local`, and in your hosting
provider's project settings — e.g. Vercel → Settings → Environment Variables).
The variable **names** are documented in `.env.example` (owned by the scaffold):

| Variable                        | Visibility | Used by                                  |
| ------------------------------- | ---------- | ---------------------------------------- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`  | Public     | Browser `applicationServerKey`; server.  |
| `VAPID_PRIVATE_KEY`             | **Secret** | `lib/push/web-push.ts` signing.          |
| `VAPID_SUBJECT`                 | Public-ish | `mailto:` or `https://` contact URL.     |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Secret** | Cross-user scheduled sends (admin read). |
| `CRON_SECRET`                   | **Secret** | Bearer auth for scheduled `/send`.       |

> `VAPID_SUBJECT` must be a `mailto:` address or an `https://` URL, e.g.
> `mailto:push@fitvn.app`.

Never commit real values. `lib/push/web-push.ts` throws a clear error at the
boundary if any VAPID var is missing, so misconfiguration fails fast.

---

## 4. Push send API — authorization model

`POST /api/push/send` accepts **two** authorization modes:

1. **Self-notify** — a logged-in user triggers a notification to *their own*
   devices (e.g. a "Send me a test" button). No special header; `userId` in the
   body is ignored. Subscriptions are read via the RLS-bound client.

2. **Scheduled / server-to-server** — a CRON job sends to *any* user by passing
   `Authorization: Bearer <CRON_SECRET>` and a `userId`. Subscriptions are read
   with the service-role client (bypasses RLS).

Requests with neither a session nor a valid CRON secret receive `401`.

### Example payloads

Self-notify a workout reminder (browser fetch with the session cookie):

```http
POST /api/push/send
Content-Type: application/json

{ "type": "workout_reminder" }
```

Scheduled "nhắc lịch tập" for one user:

```http
POST /api/push/send
Authorization: Bearer ${CRON_SECRET}
Content-Type: application/json

{ "type": "workout_reminder", "userId": "11111111-1111-4111-8111-111111111111" }
```

Scheduled "nhắc uống nước":

```http
POST /api/push/send
Authorization: Bearer ${CRON_SECRET}
Content-Type: application/json

{ "type": "water_reminder", "userId": "11111111-1111-4111-8111-111111111111" }
```

Custom message:

```json
{
  "type": "custom",
  "title": "Tuyệt vời! 🎉",
  "body": "Bạn đã đạt mục tiêu protein hôm nay.",
  "url": "/nutrition"
}
```

Dead subscriptions (HTTP `404`/`410` from the push service) are pruned from
`push_subscriptions` automatically on send.

### Wiring a Vercel Cron (optional)

```jsonc
// vercel.json
{
  "crons": [
    { "path": "/api/push/cron/workout-reminders", "schedule": "0 17 * * *" }
  ]
}
```

The cron handler (not included here) would enumerate target users and call
`sendPushToUser` for each, or POST to `/api/push/send` with the `CRON_SECRET`.

---

## 5. Install flow per platform

| Platform                | Flow                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| **Android / Chrome**    | `beforeinstallprompt` fires → `InstallPrompt` shows **Cài đặt** → `prompt()`.         |
| **Desktop Chrome/Edge** | Same `beforeinstallprompt`; also an install icon in the address bar.                   |
| **iOS Safari 16.4+**    | No `beforeinstallprompt`. `InstallPrompt` shows manual steps: **Chia sẻ → Thêm vào MH chính**. |
| **In-app webviews**     | Often unsupported; the prompt stays hidden. Open in the real browser to install.      |

Dismissal is remembered in `localStorage` (`fitvn:install-dismissed`). The
prompt never shows when already running standalone.

> **iOS push caveat:** Web Push on iOS only works **after the PWA is installed**
> to the Home Screen and **requires iOS 16.4+**. `PushManager` detects iOS-in-
> Safari and instructs the user to install first.

---

## 6. Offline data model

- `lib/db/dexie.ts` defines the IndexedDB database `fitvn` with tables:
  `pendingWorkoutSessions`, `pendingLogItems`, `cachedFoods`, `syncQueue`.
- Offline writes append a `syncQueue` entry referencing a `pending*` record.
- `lib/db/sync.ts → pushPendingToSupabase()` drains the queue FIFO when online.
  It is **idempotent** (records with a `remoteId` are skipped) and **resilient**
  (per-entry failures are recorded with an attempt count, not thrown).
- `cacheFoods()` mirrors a slice of `public.foods` for offline search via
  `searchCachedFoods()`.
- `hooks/useOfflineSync.ts` triggers a sync on the offline→online edge and on
  mount, and exposes `pendingCount` / `syncNow()` for the UI.

---

## 7. Testing on Chrome mobile / DevTools — step by step

> PWA features are **disabled in `next dev`**. First build & serve production:
>
> ```bash
> npm run build && npm run start   # serves on http://localhost:3000
> ```

### 7.1 Manifest

1. Open Chrome → `http://localhost:3000`.
2. **DevTools (F12) → Application tab → Manifest** (left sidebar).
3. Verify: name/short_name, theme/background color, `start_url`, `display:
   standalone`, all icons resolve (no red errors), maskable preview looks right,
   and the three **Shortcuts** (Log tập / Log ăn / AI Coach) are listed.

### 7.2 Service worker

1. **Application → Service Workers.**
2. Confirm `sw.js` is **activated and running**.
3. Tick **Update on reload** while developing.
4. Use **Push** (with a test payload) and **Unregister** as needed.

### 7.3 Storage / caches

1. **Application → Storage** — see Cache Storage buckets (`apis`,
   `static-images`, `static-resources`, …) and **IndexedDB → fitvn** with the
   four Dexie tables.
2. **Clear site data** here to reset between test runs.

### 7.4 Lighthouse PWA audit

1. **DevTools → Lighthouse tab.**
2. Categories: tick **Progressive Web App** (and Performance/Best Practices).
3. Device: **Mobile**. Click **Analyze page load**.
4. Aim for green on *Installable* and *PWA optimized*. Fix any flagged item
   (missing icon size, no maskable icon, no offline fallback, etc.).

### 7.5 Test "Add to Home Screen" (install)

- **Emulated:** Address-bar install icon, or **⋮ menu → Install FitVN**, or the
  in-app **Cài đặt FitVN** button. After install, launch from the OS icon and
  confirm it opens standalone (no browser chrome).
- The `appinstalled` event hides the prompt automatically.

### 7.6 Test Offline

1. **Application → Service Workers → Offline** checkbox (or **Network tab →
   throttling dropdown → Offline**).
2. Reload a page you have **not** visited → the **`/offline`** fallback renders.
3. Navigate to a **previously visited** screen → it loads from cache.
4. Create a workout/meal log while offline → confirm a row appears in
   **IndexedDB → fitvn → syncQueue**.
5. Toggle **Offline off** → `useOfflineSync` fires; watch the queue drain and
   the rows appear in Supabase.

### 7.7 Test Push (desktop quick path)

1. In **PushManager**, click **Bật thông báo** → grant permission → a row lands
   in `push_subscriptions`.
2. Trigger a self-notify: `POST /api/push/send` `{ "type": "workout_reminder" }`
   (with the session cookie) → the OS notification appears.
3. Click it → confirm it deep-links to the `url` in the payload.

### 7.8 Remote-debug a real Android device

1. On the phone: **Settings → Developer options → USB debugging** (on).
2. Connect via USB and accept the trust prompt.
3. On desktop Chrome: visit **`chrome://inspect/#devices`**.
4. Under **Port forwarding**, map `localhost:3000` → `localhost:3000` so the
   phone can reach your dev server (or just use the deployed preview URL).
5. Open the site on the phone, then click **inspect** in `chrome://inspect` to
   open full DevTools for the device.
6. Repeat the Manifest / Service Worker / Offline / Install / Push checks above
   on the **real device** — iOS push in particular must be tested on a physical
   iPhone with the app installed to the Home Screen (iOS 16.4+).

---

## 8. Common gotchas

- **Nothing caches in `next dev`** — that's intentional (`disable: isDev`).
  Always test PWA behavior against a production build or deployment.
- **HTTPS required** for service workers + push, **except** `http://localhost`,
  which browsers treat as secure for testing.
- **Rotating VAPID keys invalidates all subscriptions** — users must re-opt-in.
- **iOS push** needs an installed PWA + iOS 16.4+; it will not work in Safari
  tabs.
- **Service-worker updates** can be sticky — use *Update on reload* or
  *Unregister* + hard reload while iterating.
