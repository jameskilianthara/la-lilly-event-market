# EventFoundry WhatsApp Integration - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Apply Database Migrations (2 minutes)

Go to [Supabase SQL Editor](https://app.supabase.com/project/ikfawcbcapmfpzwbqccr/editor) and run:

```sql
-- Migration 1: Notification Tracking
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

CREATE TABLE IF NOT EXISTS vendor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  notification_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  message_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration 2: Draft Events
ALTER TABLE events ADD COLUMN IF NOT EXISTS short_code VARCHAR(10) UNIQUE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS draft_source VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS draft_expires_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS draft_event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code VARCHAR(10) NOT NULL UNIQUE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 2: Update Environment (1 minute)

Add to `.env.local`:

```bash
AISENSY_ENABLED=false  # Keep false for testing
AISENSY_API_KEY=your_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Test APIs (2 minutes)

```bash
# Test WhatsApp notification (simulation mode)
curl -X POST http://localhost:3000/api/events/notify-vendors \
  -H "Content-Type: application/json" \
  -d '{"eventId": "YOUR_EVENT_ID"}'

# Test external import
curl -X POST http://localhost:3000/api/forge/external-import \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "Wedding",
    "city": "Mumbai",
    "source": "api"
  }'
```

Expected response:
```json
{
  "success": true,
  "short_code": "FORGE2X9",
  "resume_url": "http://localhost:3000/forge/resume/FORGE2X9"
}
```

---

## 🎯 Common Use Cases

### Use Case 1: Notify Vendors of New Event

```typescript
// After event creation
const response = await fetch('/api/events/notify-vendors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: newEvent.id,
    sendWhatsApp: true  // Set false for testing
  })
});

const data = await response.json();
console.log(`Notified ${data.notifications.sent} vendors`);
```

### Use Case 2: WhatsApp Bot Creates Draft

```typescript
// In your WhatsApp bot
const response = await fetch('https://eventfoundry.com/api/forge/external-import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_type: userEventType,
    city: userCity,
    date: userDate,
    guest_count: userGuestCount,
    source: 'whatsapp_bot',
    external_reference_id: conversationId,
    client_name: userName,
    client_phone: userPhone
  })
});

const { short_code, resume_url } = await response.json();

// Send to user
sendWhatsAppMessage(userPhone,
  `Your event draft is ready! Complete it here: ${resume_url}`
);
```

---

## 🧪 Testing Checklist

- [ ] Migrations applied successfully
- [ ] Environment variables set
- [ ] Notification API returns success
- [ ] External import creates draft
- [ ] Resume URL loads draft data
- [ ] Blueprint page displays draft
- [ ] E2E tests pass: `npx playwright test`

---

## 📊 Verify Setup

Run this in Supabase SQL Editor:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('vendor_notifications', 'draft_event_sessions');

-- Check columns added
SELECT column_name FROM information_schema.columns
WHERE table_name = 'vendors' AND column_name IN ('phone', 'last_notified_at');

SELECT column_name FROM information_schema.columns
WHERE table_name = 'events' AND column_name IN ('short_code', 'draft_source');
```

Expected: All 6 items should be found.

---

## 🚨 Troubleshooting

### Issue: "short_code not found"
**Fix**: Migration 2 not applied. Re-run migration SQL.

### Issue: "vendor_notifications does not exist"
**Fix**: Migration 1 not applied. Re-run migration SQL.

### Issue: "AISENSY_API_KEY is not defined"
**Fix**: Set `AISENSY_ENABLED=false` in `.env.local` for testing.

### Issue: E2E tests fail
**Fix**: Ensure dev server is running: `pnpm dev`

---

## 📚 Full Documentation

- **Complete Guide**: See `IMPLEMENTATION_COMPLETE.md`
- **Migration Steps**: See `MIGRATION_INSTRUCTIONS.md`
- **WhatsApp Details**: See `WHATSAPP_NOTIFICATIONS_IMPLEMENTATION.md`
- **External Import**: See `EXTERNAL_IMPORT_IMPLEMENTATION.md`

---

## ✅ You're Done!

Your EventFoundry instance now has:
- ✅ WhatsApp vendor notifications
- ✅ External draft import system
- ✅ Short code generation
- ✅ Rate limiting
- ✅ Complete audit trails

**Next**: Apply migrations, test APIs, deploy to production!
