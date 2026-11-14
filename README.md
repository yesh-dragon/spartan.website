# Agent Guard

> **"Two lines of code to protect any agent."**

Agent Guard is an AI security perimeter that detects prompt injections, conceals sensitive data before it can leave your system, enforces human-in-the-loop approvals on outbound tool actions, and records every event in a per-user SHA-256 hash-chained audit ledger.

```ts
const verdict = await guard.checkInput(emailBody);            // before the agent reads it
const decision = await guard.checkAction(agentProposedAction); // before the agent acts
```

---

## Architecture & Workspaces

This npm workspaces monorepo contains four packages:

| Package | Path | Role |
|---|---|---|
| `@agent-guard/shared` | `packages/shared` | Strict Zod validation schemas, TypeScript domain interfaces, and shared enums |
| `@agent-guard/core` | `packages/guard-core` | Standalone, zero-UI TypeScript security SDK (`createGuard()`, Input Scanner rules, Verhoeff-checked Data Shield, Action Firewall policy, canonical SHA-256 verifier) |
| `@agent-guard/server` | `server` | Node.js + Express 5 API, Supabase JWT auth & service-role RPC caller, Gemini semantic judge & MailPilot demo assistant, 60s expiry sweep, pino redacted logging |
| `@agent-guard/client` | `client` | React + Vite + TypeScript SOC console & landing experience (`/`, `/login`, `/signup`, `/dashboard`, `/playground`, `/approvals`, `/alerts`, `/audit-log`, `/settings`, `*`) |

---

## Local Setup

### 1. Prerequisites
- **Node.js** 22+ and **npm** 10+
- A **Supabase** project (PostgreSQL + Email/Password Auth)
- A **Google Gemini API key**

### 2. Install Dependencies
```bash
npm install
```

### 3. Apply Database Schema, RLS Policies & Seed Data

Canonical migration file:
- [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) (mirrored in [`server/supabase/migrations/001_init.sql`](server/supabase/migrations/001_init.sql))

This creates:
- Tables (`profiles`, `guard_settings`, `seed_email_templates`, `emails`, `scans`, `alerts`, `pending_actions`, `audit_log`) with Row Level Security enabled on every table
- 6 seeded demo email templates (`seed_email_templates`) and `public.seed_demo_inbox(uuid, text)`
- Auth trigger `on_auth_user_created` (`public.handle_new_user()`) plus backfill seeding for existing `auth.users`
- Server-side `public.canonical_jsonb(jsonb)` and advisory-locked `public.append_audit(uuid, text, jsonb)` functions (executable only by `service_role`)

Run via Node migration script (`SUPABASE_SERVICE_ROLE_KEY` verifies all 8 tables, syncs `seed_email_templates`, and seeds existing Auth users; supply `SUPABASE_DB_URL` or `SUPABASE_ACCESS_TOKEN` or run `001_initial_schema.sql` in the Supabase SQL Editor once for initial DDL):

```bash
npm run db:migrate
```

Additional database commands:
- `npm run db:seed` — sync seed templates & backfill demo inboxes for existing Supabase Auth users using `SUPABASE_SERVICE_ROLE_KEY`
- `npm run db:verify` — verify all 8 tables exist via `SUPABASE_SERVICE_ROLE_KEY`

### 4. Configure Environment Variables

Copy the example files and fill in your credentials (never commit `.env` files):

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

`server/.env`:
```env
NODE_ENV=development
PORT=8080
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
# Optional for direct Node DDL application in db:migrate:
# SUPABASE_DB_URL=postgresql://postgres:[DB-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
# SUPABASE_ACCESS_TOKEN=
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.8-flash
DEMO_MODE=true
LOG_LEVEL=info
```

`client/.env`:
```env
VITE_API_URL=http://localhost:8080/api
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 5. Build, Verify & Run

```bash
npm run build
npm test
npm run dev
```

- Frontend runs on `http://localhost:5173`
- Backend runs on `http://localhost:8080` (`GET /api/health`)

---

## Standalone SDK Usage (`@agent-guard/core`)

`@agent-guard/core` has zero UI or web-framework dependencies and can wrap any agent in two lines:

```ts
import { createGuard } from "@agent-guard/core";

const guard = createGuard({ mode: "enforce" });

// 1. Inspect untrusted content before passing it to the agent
const verdict = await guard.checkInput(emailBody, { subject: emailSubject });
if (verdict.effectiveVerdict === "block") {
  throw new Error(verdict.explanation);
}

// 2. Intercept proposed outbound tool actions before executing them
const decision = await guard.checkAction(
  {
    action: "send_email",
    to: ["recipient@example.com"],
    subject: "Re: Quarterly Notes",
    body: draftReply,
  },
  { sourceInputVerdict: verdict.verdict },
);
```

---

## Demo Walkthrough (6 Seeded Emails)

On first authenticated session (`POST /api/bootstrap`), Agent Guard seeds your demo sandbox inbox with 6 test emails:

1. **Landing & Onboarding**: Visit `/` and click **Try the demo** to sign up on `/signup` -> redirected to `/playground` with Guard **ON**.
2. **Hero Hidden HTML Attack**: Select **Invoice follow-up – urgent**. Click **Ask assistant to summarize and reply** -> Guard detects hidden HTML (`display:none` & zero-width spaces), scores a **BLOCK** verdict, quarantines the email, generates a plain-language alert, and logs the event. Toggle **Reveal what the AI sees** in the viewer to inspect concealed spans side by side.
3. **Unprotected Agent Contrast**: Toggle **Guard OFF (Vulnerable Demo)** and re-run **Invoice follow-up – urgent** -> MailPilot simulates an outbound reply attempting to leak your Aadhaar & API key to an external address (marked `SIMULATED` only; never actually sent). Switch Guard back **ON**.
4. **Action Firewall & Data Shield**: Select **Account details for reimbursement** (flagged `warn`) and ask MailPilot to forward or summarize details -> `guard.checkAction()` detects sensitive Indian PII / API secrets, pauses execution in `/approvals` as `pending` (`critical`), and masks all stored previews.
5. **Human Redaction Approval**: Open `/approvals` and click **Approve with redaction** -> sensitive values are replaced with `[REDACTED:TYPE]` tokens and logged to `/audit-log`.
6. **Tamper-Evident Audit Chain**: Open `/audit-log` and click **Verify Integrity** -> green verification banner across all entries from the 64-zero genesis hash. Click **Simulate Tamper** (visible when `DEMO_MODE=true`), then click **Verify Integrity** again -> red alert pinpointing the exact modified sequence number.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run Express server and Vite client concurrently |
| `npm run build` | Build `shared`, `guard-core`, `server`, and `client` |
| `npm run typecheck` | Run TypeScript typechecking across all workspaces |
| `npm run lint` | Run workspace TypeScript lint/type checks |
| `npm test` | Run Vitest suites in `packages/guard-core` and `server` |

---

## Decisions & Notes

- **Gemini Model Default**: `GEMINI_MODEL` defaults to `gemini-3.8-flash` via `@google/genai` with `temperature: 0`, `responseJsonSchema`, 15-second `abortSignal` timeouts, and 1 jittered retry on HTTP 429 / 5xx responses. If Gemini fails or times out, the judge fails closed (`isInjection: true, confidence: 0.5`) and marks the scan `DEGRADED MODE`.
- **Seed #6 Fixture Formatting**: In Seed #6 (`notes@self.internal`), the fake Google API key uses `AIzaSyA-FAKE-KEY-0123456789abcdefghijkl` (35 characters after `AIza`) so it matches the exact `AIza[0-9A-Za-z_-]{35}` Data Shield pattern, and the synthetic Aadhaar `2345 6789 0124` passes Verhoeff D5 checksum validation.
- **Zero Raw Secret Storage**: Matched sensitive strings are replaced immediately with `[REDACTED:TYPE]` tokens or masked previews (`XXXX XXXX 0124`). Even in Guard OFF ("Vulnerable Demo") mode, simulated tool payloads returned to the browser are masked before leaving the server.
- **Zod v3 Pinning**: `zod` is kept on `3.25.76` to retain exact compatibility with `zod-to-json-schema@3.25.2`, paired with Express `100kb` request body caps and strict `.max()` bounds on every Zod field.
- **Live Cloud Verification**: Database migration execution (`001_init.sql`) against a hosted Supabase Postgres instance and live Gemini calls require providing valid credentials in `server/.env` and `client/.env`; automated test suites verify `guard-core` logic, API auth/validation/redaction contracts, and SHA-256 chain tampering detection against an in-memory Supabase harness.

