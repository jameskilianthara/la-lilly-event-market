# Apply ForgeChat Database Migration

## ⚠️ CRITICAL: Run This Migration to Fix Event Creation

The ForgeChat event creation is currently failing because the `events` table is missing required columns. This migration fixes all "column not found" errors.

## What This Migration Does

Adds **ALL** required columns for ForgeChat to work:

### Core Event Fields
- ✅ `id` (UUID primary key)
- ✅ `owner_user_id` (UUID, foreign key to users.id)
- ✅ `title` (TEXT)
- ✅ `event_type` (TEXT)
- ✅ `date` (DATE)
- ✅ `city` (TEXT)
- ✅ `guest_count` (INTEGER)

### Venue Fields
- ✅ `venue_name` (TEXT)
- ✅ `venue_status` (TEXT)

### ForgeChat Specific Fields
- ✅ `client_brief` (JSONB) - Stores conversation data from ForgeChat
- ✅ `forge_blueprint` (JSONB) - Stores selected blueprint
- ✅ `forge_status` (TEXT with CHECK constraint) - Event workflow status

### Bidding Fields
- ✅ `bidding_closes_at` (TIMESTAMP)
- ✅ `budget_range` (TEXT)

### Metadata
- ✅ `created_at` (TIMESTAMP)
- ✅ `updated_at` (TIMESTAMP)

### Performance & Security
- ✅ Creates indexes on key columns (owner_user_id, forge_status, event_type, city, date)
- ✅ Enables Row Level Security (RLS)
- ✅ Creates RLS policies for clients and vendors

## How to Apply This Migration

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your **EventFoundry** project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy and Run the Migration
1. Open this file in your code editor:
   ```
   supabase/migrations/20250106_complete_events_table_forge_fields.sql
   ```
2. Copy the **entire contents** (all 380+ lines)
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

### Step 3: Verify Success
After running, you should see:
- Green checkmark indicating success
- NOTICE messages like "Added client_brief column to events table"
- A results table showing all 16 columns at the end

Example output:
```
NOTICE: Added owner_user_id column to events table
NOTICE: Added client_brief column to events table
NOTICE: Added forge_blueprint column to events table
...

column_name       | data_type | is_nullable | column_default
------------------+-----------+-------------+----------------
id                | uuid      | NO          | gen_random_uuid()
owner_user_id     | uuid      | YES         | NULL
title             | text      | NO          | NULL
event_type        | text      | NO          | NULL
...
```

## Migration Safety Features

This migration is **100% safe** and idempotent:
- ✅ Uses `IF NOT EXISTS` checks - won't duplicate columns
- ✅ Safe to run multiple times
- ✅ Won't break existing data
- ✅ Adds defaults where needed so existing rows stay valid
- ✅ Creates table if it doesn't exist

## After Running the Migration

Once applied, ForgeChat will work perfectly:

1. ✅ **No more "column not found" errors**
2. ✅ **Kochi city option appears first** in city dropdown
3. ✅ **Event creation succeeds** with full data
4. ✅ **Blueprint routing works** based on event type (Wedding → wedding_forge, Birthday → celebration_forge)
5. ✅ **Users redirected** to blueprint review page after event creation
6. ✅ **RLS policies active** - users can only see their own events

## Testing After Migration

1. **Hard refresh** your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`)
2. Go to `/forge` on your EventFoundry app
3. Answer the 5 ForgeChat questions:
   - Event type (e.g., "Wedding")
   - Event date
   - City (select **Kochi** - should be first option)
   - Guest count
   - Venue status
4. You should see: "Perfect! I've created your event blueprint."
5. Click "Review Event Blueprint →"
6. Should redirect to `/blueprint/{eventId}` successfully

## Troubleshooting

### If you see "relation 'events' already exists"
- ✅ This is fine - the migration handles this

### If you see "constraint already exists"
- ✅ This is fine - the migration handles this

### If ForgeChat still fails after migration
1. Check browser console for specific error
2. Run this query in Supabase SQL Editor to verify columns:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'events'
   ORDER BY column_name;
   ```
3. Ensure you have `.env.local` with correct Supabase credentials
4. Hard refresh browser to clear cached JavaScript

## Need Help?

If issues persist after running this migration, check:
1. Supabase project URL and anon key in `.env.local`
2. Browser console for detailed error messages
3. Supabase logs (Database → Logs in dashboard)

---

**Created:** 2025-01-06
**Migration File:** `20250106_complete_events_table_forge_fields.sql`
**Purpose:** Fix all ForgeChat event creation "column not found" errors
