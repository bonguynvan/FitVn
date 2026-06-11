# FitVN

Gym + nutrition Progressive Web App (PWA) for Vietnamese users. Plan workouts,
log món ăn and macros, track progress, and chat with an AI coach — all from an
installable, offline-capable app.

## Stack

- **Next.js 14** (App Router, TypeScript, React 18)
- **Supabase** — Postgres + Auth + Row Level Security
- **Claude API** via the **Vercel AI SDK v5** (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`)
- **PWA** via `@ducanh2912/next-pwa` (Workbox runtime caching, offline fallback)
- **Offline storage** via Dexie (IndexedDB)
- **Web Push** via `web-push` + VAPID
- **Tailwind CSS** with oklch design tokens

## Architecture map

```
FitVN/
├── app/
│   ├── layout.tsx            # Root layout: lang="vi", metadata, viewport, PWA meta
│   ├── globals.css           # Tailwind directives + oklch design tokens + safe-area utils
│   ├── page.tsx              # Home / dashboard (mobile-first, links to features)
│   ├── offline/              # Offline fallback page (PWA document fallback)
│   ├── coach/                # AI coach chat UI (uses @ai-sdk/react useChat)
│   └── api/
│       └── coach/            # Route handler: streamText with Claude (server)
├── components/
│   ├── pwa/                  # Install prompt, service-worker registration, push opt-in
│   └── ui/                   # Shared presentational components
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser client (createBrowserClient)
│   │   ├── server.ts         # Server client (createServerClient + next/headers cookies)
│   │   └── middleware.ts     # updateSession() — auth session refresh
│   └── db/                   # Dexie schema + offline repositories
├── docs/                     # PRD, architecture, system design, task list
├── supabase/                 # SQL migrations + RLS policies
├── public/                   # manifest.json, icons, generated sw.js (gitignored)
├── middleware.ts             # Wires updateSession with a static-asset-excluding matcher
├── next.config.mjs           # next-pwa wrapper + Workbox runtime caching
├── tailwind.config.ts        # Token-driven Tailwind theme
└── .env.example              # All required environment variables
```

> Note: some directories above (e.g. `app/coach`, `app/api/coach`, `components/pwa`,
> `lib/db`, `docs/`, `supabase/`) are owned by other feature workstreams. This
> scaffold provides the shared infrastructure they build on.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in real values:

```bash
cp .env.example .env.local
```

Required variables (see `.env.example` for descriptions):

| Variable | Scope | Source |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Supabase → Project Settings → API |
| `ANTHROPIC_API_KEY` | server | https://console.anthropic.com |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | client | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | server | `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | server | a `mailto:` address you control |

### 3. Generate Web Push (VAPID) keys

```bash
npx web-push generate-vapid-keys
```

Copy the **Public Key** into `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and the
**Private Key** into `VAPID_PRIVATE_KEY` in `.env.local`. Set `VAPID_SUBJECT`
to a contact URL, e.g. `mailto:you@example.com`.

### 4. Apply the Supabase database schema

With the [Supabase CLI](https://supabase.com/docs/guides/cli) linked to your
project, apply the migrations under `supabase/`:

```bash
supabase db push          # apply migrations to the linked remote project
# or, for local dev:
supabase start
supabase migration up
```

### 5. Run the app

```bash
npm run dev
```

Open http://localhost:3000.

> The PWA service worker is **disabled in development** (`disable: isDev` in
> `next.config.mjs`). To test offline behavior, build and start a production
> server:
>
> ```bash
> npm run build
> npm run start
> ```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (generates the service worker) |
| `npm run start` | Run the production server |
| `npm run lint` | Lint with `eslint-config-next` |

## Conventions

- TypeScript everywhere; many small focused files (< 300 lines).
- User-facing strings in Vietnamese; technical code/comments in English.
- Immutable data patterns, explicit error handling, validation at boundaries (zod).
- No hardcoded secrets — everything via `process.env`, documented in `.env.example`.
