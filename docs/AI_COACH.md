# AI Coach — Architecture & Design

The **AI Coach** ("HLV FitVN") is a streaming, Vietnamese-language fitness &
nutrition chatbot. It answers using the user's *real* data — today's macros,
today's workout, and a 7-day trend — so advice is personalized, not generic.

Stack: Next.js 14 (App Router), Supabase (Postgres + Auth + RLS), Claude via
the Vercel AI SDK **v5** (`@ai-sdk/anthropic`, `ai`, `@ai-sdk/react`).

---

## 1. Data flow

```
Browser (CoachChat, useChat)
   │  POST /api/coach  { messages: UIMessage[], preset? }
   ▼
app/api/coach/route.ts
   │  1. auth.getUser()              ← RLS-scoped server Supabase client
   │  2. getCoachContext(userId, supabase)   → CoachContext
   │  3. buildSystemPrompt(context)          → string (Vietnamese)
   │  4. streamText({ model, system, messages: convertToModelMessages(...) })
   ▼
result.toUIMessageStreamResponse()  ──stream──►  useChat renders message.parts
```

Each request is **stateless on the server**: the full message history comes
from the client, and the latest personalized context is re-fetched every turn
so numbers stay current as the user logs food/workouts during the session.

---

## 2. Files

| File | Responsibility |
|------|----------------|
| `lib/coach/types.ts` | `CoachContext` and sub-types (profile, today, workout, history). |
| `lib/coach/macros.ts` | Pure macro math: scale per-100g → quantity, sum, remaining-vs-target. |
| `lib/coach/context-fetcher.ts` | `getCoachContext(userId, supabase)` — batched Supabase reads + in-memory rollups. |
| `lib/coach/system-prompt.ts` | `buildSystemPrompt(ctx)` — persona, guardrails, compact data block (Vietnamese). |
| `app/api/coach/route.ts` | POST handler: auth → context → prompt → `streamText` → UI stream. `maxDuration = 30`. |
| `components/coach/CoachChat.tsx` | `useChat` streaming UI: bubbles, auto-scroll, typing indicator, stop, error. |
| `components/coach/MessageBubble.tsx` | Renders text parts of one `UIMessage` (user vs assistant styling). |
| `components/coach/QuickActions.tsx` | Preset prompt chips → `sendMessage({ text })`. |
| `app/coach/page.tsx` | Server component composing header + `CoachChat`. |

---

## 3. Context schema (`CoachContext`)

```ts
{
  profile: {
    fullName, goal, activityLevel, heightCm, weightKg,
    targets: { calories, proteinG, carbsG, fatG }   // any may be null
  },
  today: {
    date,                       // ISO yyyy-mm-dd
    hasLog,                     // false when nothing logged today
    consumed: { calories, proteinG, carbsG, fatG },
    remaining: { ... },         // target − consumed; null when no target set
    meals: [ { foodNameVi, mealType, quantity, unit, contributed } ]
  },
  todayWorkout: null | {
    sessionId, durationMin, notes,
    exercises: [ { nameVi, muscleGroup, sets, totalReps, topWeightKg } ]
  },
  history7d: [ { date, calories, proteinG, didWorkout, weightKg } ]  // newest first
}
```

### Column mapping (real schema)

- Targets: `profiles.daily_calorie_target`, `protein_target_g`, `carbs_target_g`, `fat_target_g`.
- Today's nutrition: `nutrition_logs.logged_on` → `log_items` (`food_id`, `quantity`, `unit`, `meal_type`) → `foods` (`calories_per_100g`, `protein_g`, `carbs_g`, `fat_g`).
- Today's workout: `workout_sessions.performed_on` → `session_exercises` (`reps`, `weight_kg`, per-set rows) → `exercises` (`name_vi`, `muscle_group`).
- Weight trend: `body_measurements.measured_on`, `weight_kg`.

### Macro scaling

Foods store macros **per 100g**; `log_items.quantity` is grams (`unit` defaults
to `'g'`). Contribution = `per100g * quantity / 100` (`scaleMacros`). Non-gram
units fall back to treating `quantity` as grams — acceptable because the schema
default is grams; revisit if richer units are added.

### Graceful degradation

- **No profile / no targets** → `targets.*` are `null`; `remaining.*` are `null`
  and the prompt prints "(chưa đặt mục tiêu)" so the model never invents a goal.
- **No log today** → `hasLog: false`, `consumed` zeroed, `meals: []`.
- **No workout** → `todayWorkout: null`.
- **Sparse history** → every one of the 7 days is still emitted, zero-filled.

---

## 4. Prompt design rationale

`buildSystemPrompt` produces three blocks:

1. **Persona** — "HLV FitVN", a Vietnamese fitness & nutrition coach: friendly
   and motivational, but evidence-based; replies in Vietnamese, concise and
   actionable; metric units; suggests familiar Vietnamese foods.
2. **Guardrails** — no medical diagnosis (refer to professionals for symptoms,
   injuries, eating disorders, pregnancy, medication); no extreme dieting /
   dangerous deficits / weight-loss drugs; be explicit when data is missing; no
   unrealistic promises. Sustainable ±300–500 kcal/day framing.
3. **Data block** — a compact, delimited dump of the user's actual numbers
   (profile, today's intake + remaining, today's training, 7-day trend). The
   model is told to *use* these numbers and not echo them verbatim.

Why inject context as text (vs tools): a single per-turn snapshot is cheap,
deterministic, fully under our control, and avoids multi-round tool latency for
what is fundamentally a read-only personalization payload. Tools can be layered
in later (e.g. "log this meal") without changing this structure.

---

## 5. Model routing

| Preset | Model | Use |
|--------|-------|-----|
| default | `claude-sonnet-4-6` | Full coaching: meal planning, weekly review, nuanced advice. |
| `quick` | `claude-haiku-4-5-20251001` | Lightweight "phân tích nhanh" — simple lookups like "how much protein left?". |

The client sends `{ preset: 'quick' }` in the request body to opt into Haiku.
`ANTHROPIC_API_KEY` is read automatically by `@ai-sdk/anthropic` (env var owned
by the scaffold's `.env.example`).

---

## 6. Cost notes

- The system prompt (persona + guardrails + data block) is sent **every turn**.
  It is intentionally compact (rounded numbers, one line per history day, only
  the fields the coach needs) to keep input tokens low.
- Route simple questions to **Haiku** via `preset: 'quick'` for a large cost
  reduction vs Sonnet at near-equivalent quality on lookups.
- The persona + guardrails section is stable across requests and is a natural
  candidate for **prompt caching** if/when call volume justifies it (the AI SDK
  Anthropic provider supports cache-control on message/system content).
- Server context fetch is a handful of batched/parallel `select`s (no N+1); the
  weekly trend is two ranged reads rolled up in memory.

---

## 7. How to extend

- **Tool calling** (e.g. log a meal, create a workout): add `tools` to
  `streamText` and render tool parts in `MessageBubble` / `CoachChat`. The
  message-parts rendering already iterates `message.parts`, so new part types
  slot in.
- **More context** (e.g. active workout plan for the day, PRs): add a field to
  `CoachContext`, a fetch in `context-fetcher.ts`, and a render section in
  `system-prompt.ts`. Keep everything null-safe.
- **Persistence**: today the conversation lives only in client state. To
  persist, add a `coach_messages` table and an `onFinish` hook on the server
  stream to store the exchange (mind RLS).
- **Prompt caching**: mark the persona/guardrails block with cache control to
  cut repeated input cost on long sessions.
- **Localization of units/foods**: the Vietnamese label maps and food framing
  live in `system-prompt.ts`; adjust there.
```
