# Supabase Schema Application Guide

## Overview

This guide walks you through applying the EventFoundry database schema to your Supabase project.

## Prerequisites

- Supabase project created at https://supabase.com/dashboard
- Project URL and anon key configured in `.env.local`
- Access to Supabase SQL Editor

## Step-by-Step Instructions

### 1. Access Supabase SQL Editor

1. Log in to https://supabase.com/dashboard
2. Select your EventFoundry project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### 2. Apply the Schema

**Option A: Run Complete Schema (Recommended for New Projects)**

1. Open `supabase/schema.sql` in your code editor
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl/Cmd + Enter)
5. Verify success message

**Option B: Run in Sections (For Troubleshooting)**

Run these sections in order:

#### Section 1: Enable Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### Section 2: Create Tables
Copy and run the table creation statements (lines 8-156 in schema.sql)

#### Section 3: Create Indexes
Copy and run the index creation statements (lines 158-175)

#### Section 4: Enable RLS
Copy and run the RLS enable statements (lines 179-187)

#### Section 5: Create RLS Policies
Copy and run all policy creation statements (lines 189-310)

#### Section 6: Create Functions & Triggers
Copy and run trigger function and trigger statements (lines 312-341)

#### Section 7: Grant Permissions
Copy and run the grant statements (lines 343-347)

### 3. Verify Schema Application

Run these verification queries:

#### Check All Tables Exist
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected tables:
- bids
- contracts
- events
- messages
- payments
- reviews
- users
- vendors

#### Check RLS is Enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should have `rowsecurity = true`

#### Check Policies Exist
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Should see multiple policies per table.

#### Check Indexes Exist
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 4. Test Basic Operations

#### Insert Test User (Auth)
First, create a test user via Supabase Auth UI or signup flow.

#### Insert Test Data
```sql
-- Example: Create a test vendor profile
-- Replace 'YOUR_AUTH_USER_ID' with actual auth.users.id
INSERT INTO public.users (id, email, user_type, full_name)
VALUES ('YOUR_AUTH_USER_ID', 'test@vendor.com', 'vendor', 'Test Vendor');

INSERT INTO public.vendors (user_id, company_name, city, specialties)
VALUES ('YOUR_AUTH_USER_ID', 'Test Event Co', 'Mumbai', ARRAY['weddings', 'corporate']);
```

#### Verify RLS Works
Try to query as authenticated user:
```sql
-- This should only return the authenticated user's data
SELECT * FROM public.vendors WHERE user_id = auth.uid();
```

### 5. Common Issues & Solutions

#### Issue: "relation already exists"
**Solution:** Tables already created. Either:
- Drop existing tables: `DROP TABLE IF EXISTS public.[table_name] CASCADE;`
- Or skip table creation and only run policies

#### Issue: "permission denied for schema public"
**Solution:** Run grant statements:
```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
```

#### Issue: RLS blocking all queries
**Solution:** Verify you're authenticated when testing:
```sql
SELECT auth.uid(); -- Should return your user ID, not NULL
```

#### Issue: "function auth.uid() does not exist"
**Solution:** This should not happen in Supabase. Contact support if it does.

### 6. Verify Users Table Matches Auth

The `public.users` table extends `auth.users`. Ensure:

1. When a user signs up via Supabase Auth, create corresponding `public.users` row
2. The `id` in `public.users` must match `id` in `auth.users`
3. This is handled automatically in our `AuthContext.tsx` signup function

Check sync:
```sql
-- Users in auth but not in public.users
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

### 7. Database Migration Checklist

- [ ] UUID extension enabled
- [ ] All 8 tables created
- [ ] All indexes created
- [ ] RLS enabled on all tables
- [ ] All RLS policies created
- [ ] Triggers created for updated_at
- [ ] Permissions granted
- [ ] Test user created
- [ ] Test vendor profile created
- [ ] RLS policies verified
- [ ] Auth sync verified

## Next Steps

After schema is applied:

1. Test API utilities in `src/lib/database.ts`
2. Migrate localStorage data to Supabase (Module 3)
3. Update frontend forms to use database utilities
4. Test RLS policies with real user flows

## Schema Updates

When updating the schema:

1. Create a new migration file: `supabase/migrations/YYYYMMDD_description.sql`
2. Apply via SQL Editor
3. Update type definitions in `src/types/database.ts`
4. Update database utilities in `src/lib/database.ts`

## Backup & Rollback

### Backup Before Major Changes
```sql
-- Export schema
pg_dump -h [host] -U postgres -d postgres --schema=public --schema-only > backup_schema.sql

-- Export data
pg_dump -h [host] -U postgres -d postgres --schema=public --data-only > backup_data.sql
```

### Rollback (Nuclear Option)
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then re-apply schema from backup or `schema.sql`.

## Support

- Supabase Docs: https://supabase.com/docs
- EventFoundry Schema: `supabase/schema.sql`
- Type Definitions: `src/types/database.ts`
- Database Utilities: `src/lib/database.ts`
