# EventFoundry — Technical Overview

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT, email/password) |
| AI | Anthropic Claude (forge chat + blueprint selection) |
| Storage | Supabase Storage (bid attachments, AI visuals) |
| Hosting | Vercel (frontend + API routes) |
| E2E Tests | Playwright |

---

## 2. Architecture

EventFoundry is a single Next.js monorepo where all backend logic lives in App Router API routes (`/src/app/api/`) co-located with the frontend — no separate backend process. The database layer uses two Supabase clients: an anon client (browser, respects RLS) and a service-role client (API routes only, bypasses RLS for trusted writes). All state flows through a JSONB-first pattern: rich data lives in `client_brief` / `forge_blueprint` / `forge_items` JSONB columns, with flat queryable columns promoted on every PATCH for filtering and sorting.

---

## 3. Database Tables

| Table | Description |
|---|---|
| `events` | Core forge project record; owns `client_brief` (JSONB), `forge_blueprint` (JSONB), `forge_status`, and flat columns (`guest_count`, `budget_range`, `venue_name`) |
| `bids` | Vendor proposals against an event; owns `forge_items` (JSONB array of line items with pricing and specs), `total_forge_cost`, `status` |
| `vendors` | Vendor profile linked to a `users` row; stores `craft_specialties[]`, `forge_location`, `rating` |
| `users` | Auth identity + role (`CLIENT` \| `CRAFTSMAN` \| `FORGE_ADMIN`); linked 1-to-1 with `auth.users` |
| `contracts` | Generated contract record; owns `contract_json`, `pdf_url`, `signatures_json`, `contract_status` |
| `execution_plans` | Vendor execution subtasks per event; owns `subtask_title`, `status`, `due_date`, scoped by `event_id` + `vendor_id` |
| `forge_blueprints` | Canonical checklist templates keyed by event type; `blueprint_content_json` is the frozen template |
| `foundry_ai_pipeline` | Job log for AI visual generation requests; tracks `status`, `result_urls[]`, `forge_cost` |

---

## 4. Environment Variables

```bash
# Supabase — public (safe to expose to browser)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase — server only (never expose to browser)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_APP_URL=https://eventfoundry.com
```

For the test environment, a parallel set pointing at a dedicated Supabase project is required — see `.env.test`.

---

## 5. Deployment Flow

1. **Push to `main`** → Vercel detects the push, runs `next build` (TypeScript check included), and aborts on any type error.
2. **Vercel deploys** the compiled Next.js app including all `/api/` routes as serverless functions; environment variables are injected from the Vercel project dashboard.
3. **Database migrations** are applied manually via the Supabase SQL editor or `supabase db push` — there is no automatic migration step in the Vercel build; run migrations before deploying breaking schema changes.
