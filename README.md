# EventFoundry - Forge Extraordinary Events

**India's Premier Event Marketplace**

*Specialized in Kerala Destination Weddings | Open to All Event Types*

**Connect clients with verified event professionals through competitive, transparent bidding.**

## 🎯 Our Mission

EventFoundry democratizes event planning by connecting clients with professional event management companies through intelligent bidding and transparent pricing.

## 🌟 Kerala Destination Wedding Expertise

While we serve all types of events across India, we've built deep expertise in Kerala destination weddings, offering:
- Curated network of Kerala-based event specialists
- Deep knowledge of Kerala venues, traditions, and logistics
- Cultural authenticity with modern convenience
- Premium destination wedding experiences

## 🚀 Platform Features

- **Full-Service Focus**: Connect with complete event management companies
- **Intelligent Bidding**: Multi-stage competitive bidding with market intelligence
- **Verified Vendors**: Quality-assured event professionals
- **Transparent Pricing**: No hidden costs, competitive marketplace
- **Location Expertise**: Special focus on Kerala destination weddings

## 🧪 Running Tests

Tests use Playwright. Before running, you need a **separate Supabase project** dedicated to testing — never run tests against production.

### Test Supabase Project Setup

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Apply all schema migrations to the test project:
   ```bash
   # Option A — Supabase CLI
   npx supabase db push --db-url "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"

   # Option B — paste each file in supabase/migrations/ into the SQL editor in order
   ```
3. Seed test users:
   ```bash
   npx tsx scripts/seed-test-users.ts
   ```
4. Copy `.env.test` and fill in your test project credentials:
   ```bash
   cp .env.test .env.test.local   # gitignored — safe to add real keys
   ```
   Set `TEST_SUPABASE_URL` and `TEST_SUPABASE_SERVICE_KEY` to the test project values.

5. Point the dev server at the test project for the test run. Create `.env.local.test` or set env vars before starting the server:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<test>.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=<test-service-role-key> \
   pnpm dev
   ```

### Running the test suite

```bash
# Smoke tests only (fast, runs on every PR)
npx playwright test --grep "@smoke"

# Full regression suite (slow, run nightly)
npx playwright test

# With mock mode enabled (no DB needed — good for CI without a test project)
PLAYWRIGHT_MOCK_AI=true npx playwright test --grep "@smoke"
```

### Mock mode

Setting `PLAYWRIGHT_MOCK_AI=true` in `.env.test` (the default) intercepts `POST /api/forge/projects` at the Playwright network level and returns a synthetic event. This makes the forge chat smoke test run without any database connection and without timing out on simulated AI delays.
