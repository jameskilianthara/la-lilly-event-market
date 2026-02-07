# E2E Test Data Setup Guide

This guide explains how to set up test data for running E2E tests.

## Quick Start

```bash
# 1. Make sure your environment variables are set
cp .env.example .env.local

# 2. Add your Supabase service role key to .env.local
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here

# 3. Run the seeding script
npm run seed:e2e

# 4. Run E2E tests
npm run test:e2e
```

## What Gets Created

The seeding script creates:

### 🧑‍💼 Test Vendor Accounts (5)
- `vendor1@eventfoundry.com` - Premium Events Co.
- `vendor2@eventfoundry.com` - Elite Decorators
- `vendor3@eventfoundry.com` - Perfect Photography
- `vendor4@eventfoundry.com` - Gourmet Catering
- `vendor5@eventfoundry.com` - Sound & Stage Masters

**Password for all vendors**: `VendorTest123!`

### 👤 Test Client Account
- Email: `test@eventfoundry.com`
- Password: `TestClient123!`
- Name: Test Client User

*(This should already exist from auth tests)*

### 📅 Test Events (3)
1. **Mumbai Wedding** - June 2026, 200 guests, ₹500,000 budget
2. **Corporate Conference** - Bangalore, July 2026, 150 guests, ₹300,000 budget
3. **Birthday Celebration** - Delhi, March 2026, 80 guests, ₹150,000 budget

### 💰 Test Bids
- Each event gets **5-7 bids** from different vendors
- Bid prices range from ₹100,000 to ₹200,000
- Each bid includes breakdown and proposal text

## Environment Variables Required

Add these to your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Required for seeding
```

## Running Individual Test Suites

```bash
# Authentication tests (11 tests)
npx playwright test tests/e2e/auth-flow.spec.ts

# Forge flow tests (3 tests)
npx playwright test tests/e2e/forge-flow.spec.ts

# Vendor flow tests (6 tests)
npx playwright test tests/e2e/vendor-flow.spec.ts

# Bid review flow tests (8 tests)
npx playwright test tests/e2e/bid-review-flow.spec.ts

# Run all tests
npm run test:e2e
```

## Test Coverage

| Test Suite | Tests | What It Covers |
|------------|-------|----------------|
| **Auth Flow** | 11 | Signup, login, logout, session management, form validation |
| **Forge Flow** | 3 | Event creation through chat, blueprint selection |
| **Vendor Flow** | 6 | Vendor signup, login, browse events, submit bids, view status |
| **Bid Review** | 8 | View bids, compare, shortlist, select winner, contracts |
| **Total** | **28** | Complete user journeys |

## Troubleshooting

### "Client user not found"
The test client (`test@eventfoundry.com`) must exist before seeding:

```bash
# Create test client manually in Supabase dashboard or run auth tests first
npm run test:e2e tests/e2e/auth-flow.spec.ts
```

### "Missing SUPABASE_SERVICE_ROLE_KEY"
Get your service role key from Supabase dashboard:
1. Go to Project Settings → API
2. Copy the `service_role` key (not anon key!)
3. Add to `.env.local`

### "Events already exist"
The script is idempotent for vendor accounts but creates new events each time.

To clean up old test data:
```sql
-- Run in Supabase SQL Editor
DELETE FROM bids WHERE event_id IN (
  SELECT id FROM events WHERE client_id IN (
    SELECT id FROM users WHERE email = 'test@eventfoundry.com'
  )
);

DELETE FROM events WHERE client_id IN (
  SELECT id FROM users WHERE email = 'test@eventfoundry.com'
);
```

## CI/CD Integration

For automated testing pipelines:

```yaml
# .github/workflows/e2e-tests.yml
- name: Seed Test Data
  run: npm run seed:e2e
  env:
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

- name: Run E2E Tests
  run: npm run test:e2e
```

## Manual Testing

Use the seeded accounts to manually test features:

1. **Client Flow**:
   - Login as `test@eventfoundry.com`
   - Go to dashboard
   - View events and bids
   - Shortlist and select winners

2. **Vendor Flow**:
   - Login as `vendor1@eventfoundry.com`
   - Browse available events
   - Submit bids
   - Check bid status

## Database Schema Notes

The seeding script creates data in these tables:
- `auth.users` - Authentication accounts
- `public.users` - User profiles
- `public.vendors` - Vendor profiles
- `public.events` - Event listings
- `public.bids` - Vendor bids/proposals

All foreign keys and relationships are properly maintained.

## Next Steps

After seeding:

1. ✅ Run auth tests to verify they still pass
2. ✅ Run vendor flow tests - should now find test data
3. ✅ Run bid review tests - should see events with bids
4. ⏳ Forge flow tests - may need AI chat mocking

## Support

If you encounter issues:
1. Check Supabase logs for errors
2. Verify RLS policies allow test data creation
3. Ensure service role key has correct permissions
4. Check that tables exist with correct schema
