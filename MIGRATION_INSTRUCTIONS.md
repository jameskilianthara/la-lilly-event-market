# Database Migration Instructions

## Overview
This document provides instructions for applying the WhatsApp Notifications and External Import migrations to your Supabase database.

## Migrations to Apply

1. **WhatsApp Vendor Notifications** - `20260207_add_vendor_notification_tracking.sql`
2. **External Import & Draft Events** - `20260207_add_draft_events_and_short_codes.sql`

---

## Option 1: Apply via Supabase Dashboard (Recommended)

### Step 1: Access SQL Editor
1. Go to your Supabase Dashboard: https://app.supabase.com/project/ikfawcbcapmfpzwbqccr/editor
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Apply Migration 1 - Vendor Notifications

Copy and paste this SQL:

```sql
-- Migration 1: Vendor Notification Tracking
-- File: 20260207_add_vendor_notification_tracking.sql

-- Add notification tracking to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_vendors_last_notified ON vendors(last_notified_at);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Create notifications log table
CREATE TABLE IF NOT EXISTS vendor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  notification_type VARCHAR(20) NOT NULL,
  phone_number VARCHAR(20),
  message_content TEXT,
  status VARCHAR(20) NOT NULL,
  provider_response JSONB,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_notifications_vendor ON vendor_notifications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_event ON vendor_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON vendor_notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON vendor_notifications(created_at);

-- Enable RLS
ALTER TABLE vendor_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS vendor_notifications_select_own ON vendor_notifications;
CREATE POLICY vendor_notifications_select_own ON vendor_notifications
  FOR SELECT
  USING (vendor_id IN (
    SELECT id FROM vendors WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS vendor_notifications_service_all ON vendor_notifications;
CREATE POLICY vendor_notifications_service_all ON vendor_notifications
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Comments
COMMENT ON TABLE vendor_notifications IS 'Audit log for all vendor notifications sent via WhatsApp, Email, SMS';
COMMENT ON COLUMN vendors.last_notified_at IS 'Timestamp of last notification sent to prevent spam (rate limiting)';
COMMENT ON COLUMN vendors.phone IS 'Phone number for WhatsApp notifications (format: +91XXXXXXXXXX)';
```

Click **Run** and verify you see "Success. No rows returned"

### Step 3: Apply Migration 2 - Draft Events & Short Codes

Copy and paste this SQL:

```sql
-- Migration 2: Draft Events and Short Codes for External Import
-- File: 20260207_add_draft_events_and_short_codes.sql

-- Add short_code and draft fields to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS short_code VARCHAR(10) UNIQUE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS draft_source VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS draft_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_reference_id VARCHAR(100);

-- Create index for short_code lookups
CREATE INDEX IF NOT EXISTS idx_events_short_code ON events(short_code) WHERE short_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_draft_expires ON events(draft_expires_at) WHERE draft_expires_at IS NOT NULL;

-- Update forge_status constraint to include DRAFT
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_forge_status_check;
ALTER TABLE events ADD CONSTRAINT events_forge_status_check
CHECK (forge_status IN (
  'DRAFT',
  'BLUEPRINT_READY',
  'OPEN_FOR_BIDS',
  'CRAFTSMEN_BIDDING',
  'SHORTLIST_REVIEW',
  'COMMISSIONED',
  'IN_FORGE',
  'COMPLETED',
  'ARCHIVED'
));

-- Create draft_event_sessions table
CREATE TABLE IF NOT EXISTS draft_event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code VARCHAR(10) NOT NULL UNIQUE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL,
  external_reference_id VARCHAR(100),
  client_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_draft_sessions_short_code ON draft_event_sessions(short_code);
CREATE INDEX IF NOT EXISTS idx_draft_sessions_event ON draft_event_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_draft_sessions_source ON draft_event_sessions(source);
CREATE INDEX IF NOT EXISTS idx_draft_sessions_expires ON draft_event_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_draft_sessions_created ON draft_event_sessions(created_at);

-- Enable RLS
ALTER TABLE draft_event_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS draft_sessions_public_read ON draft_event_sessions;
CREATE POLICY draft_sessions_public_read ON draft_event_sessions
  FOR SELECT
  USING (expires_at > NOW() AND completed_at IS NULL);

DROP POLICY IF EXISTS draft_sessions_service_all ON draft_event_sessions;
CREATE POLICY draft_sessions_service_all ON draft_event_sessions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to generate short codes
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS VARCHAR(10) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(10) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired drafts
CREATE OR REPLACE FUNCTION cleanup_expired_drafts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM events
  WHERE forge_status = 'DRAFT'
    AND draft_expires_at < NOW()
    AND owner_user_id IS NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE draft_event_sessions IS 'Tracks draft events created from external sources (WhatsApp bots, APIs) with short code access';
COMMENT ON COLUMN events.short_code IS 'Unique 8-character code for external access (e.g., FORGE2X9)';
COMMENT ON COLUMN events.draft_source IS 'Source of draft: whatsapp_bot, api, facebook, instagram, manual';
COMMENT ON COLUMN events.draft_expires_at IS 'When draft expires (typically 7 days from creation)';
COMMENT ON COLUMN events.external_reference_id IS 'Reference ID from external system (e.g., WhatsApp conversation ID)';
COMMENT ON FUNCTION generate_short_code IS 'Generates random 8-character short code avoiding ambiguous characters';
COMMENT ON FUNCTION cleanup_expired_drafts IS 'Deletes expired draft events with no owner';
```

Click **Run** and verify success.

### Step 4: Verify Migration Success

Run this verification query:

```sql
-- Verify migrations applied successfully
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('vendors', 'vendor_notifications', 'draft_event_sessions', 'events')
  AND column_name IN ('last_notified_at', 'phone', 'short_code', 'draft_source', 'draft_expires_at')
ORDER BY table_name, column_name;
```

Expected output should show:
- `vendors.last_notified_at`
- `vendors.phone`
- `events.short_code`
- `events.draft_source`
- `events.draft_expires_at`
- `vendor_notifications` table exists
- `draft_event_sessions` table exists

---

## Option 2: Apply via Command Line (Advanced)

If you have direct database access with correct credentials:

```bash
# Apply migration 1
psql "postgresql://postgres:YOUR_PASSWORD@db.ikfawcbcapmfpzwbqccr.supabase.co:5432/postgres" \
  -f supabase/migrations/20260207_add_vendor_notification_tracking.sql

# Apply migration 2
psql "postgresql://postgres:YOUR_PASSWORD@db.ikfawcbcapmfpzwbqccr.supabase.co:5432/postgres" \
  -f supabase/migrations/20260207_add_draft_events_and_short_codes.sql
```

---

## Post-Migration Steps

### 1. Update Environment Variables

Add these to your `.env.local`:

```bash
# WhatsApp Notifications (AiSensy)
AISENSY_ENABLED=false  # Set to true when ready to send real messages
AISENSY_API_KEY=your_aisensy_api_key_here
AISENSY_API_URL=https://backend.aisensy.com/campaign/t1/api/v2
AISENSY_PARTNER_ID=your_partner_id_here

# External Import API
FORGE_API_KEY=your_secret_key_here  # Optional API key for external sources
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Update for production
```

### 2. Add Phone Numbers to Vendors

Update existing vendors with phone numbers:

```sql
-- Example: Add phone to a vendor
UPDATE vendors
SET phone = '+919876543210'
WHERE company_name = 'Your Vendor Name';
```

### 3. Test the APIs

#### Test WhatsApp Notifications:
```bash
curl -X POST http://localhost:3000/api/events/notify-vendors \
  -H "Content-Type: application/json" \
  -d '{"eventId": "YOUR_EVENT_ID", "sendWhatsApp": false}'
```

#### Test External Import:
```bash
curl -X POST http://localhost:3000/api/forge/external-import \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "Corporate Event",
    "city": "Mumbai",
    "date": "2026-03-15",
    "guest_count": 200,
    "source": "api",
    "client_name": "Test Client"
  }'
```

### 4. Run E2E Tests

```bash
# Run WhatsApp notification tests
npx playwright test whatsapp-notifications.spec.ts

# Run external import tests
npx playwright test external-import-flow.spec.ts

# Run all tests
npx playwright test
```

---

## Troubleshooting

### Issue: Column already exists errors
**Solution**: The `IF NOT EXISTS` clauses handle this. Ignore these warnings.

### Issue: RLS policy errors
**Solution**: The `DROP POLICY IF EXISTS` statements handle this. Re-run the policy creation.

### Issue: Constraint violations
**Solution**: Ensure no existing data conflicts with new constraints. Check for invalid `forge_status` values:

```sql
SELECT id, title, forge_status
FROM events
WHERE forge_status NOT IN (
  'DRAFT', 'BLUEPRINT_READY', 'OPEN_FOR_BIDS', 'CRAFTSMEN_BIDDING',
  'SHORTLIST_REVIEW', 'COMMISSIONED', 'IN_FORGE', 'COMPLETED', 'ARCHIVED'
);
```

---

## Rollback (If Needed)

If you need to rollback these migrations:

```sql
-- Rollback Migration 2
DROP TABLE IF EXISTS draft_event_sessions CASCADE;
DROP FUNCTION IF EXISTS generate_short_code CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_drafts CASCADE;
ALTER TABLE events DROP COLUMN IF EXISTS short_code;
ALTER TABLE events DROP COLUMN IF EXISTS draft_source;
ALTER TABLE events DROP COLUMN IF EXISTS draft_expires_at;
ALTER TABLE events DROP COLUMN IF EXISTS external_reference_id;

-- Rollback Migration 1
DROP TABLE IF EXISTS vendor_notifications CASCADE;
ALTER TABLE vendors DROP COLUMN IF EXISTS last_notified_at;
ALTER TABLE vendors DROP COLUMN IF EXISTS phone;
```

---

## Migration Status Tracking

To track which migrations have been applied, run:

```sql
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 10;
```

If this table doesn't exist, create it:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mark migrations as applied
INSERT INTO schema_migrations (version) VALUES
  ('20260207_add_vendor_notification_tracking'),
  ('20260207_add_draft_events_and_short_codes')
ON CONFLICT (version) DO NOTHING;
```

---

## Support

If you encounter issues:

1. Check Supabase logs: https://app.supabase.com/project/ikfawcbcapmfpzwbqccr/logs
2. Verify RLS policies are not blocking queries
3. Ensure service role key has proper permissions
4. Contact support with specific error messages

---

**Last Updated**: February 8, 2026
**Status**: Ready for application
