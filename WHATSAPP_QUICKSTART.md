# WhatsApp Notifications - Quick Start Guide ⚡

Get WhatsApp notifications running in 5 minutes!

---

## Step 1: Apply Database Migration

```bash
# Connect to your Supabase project
npx supabase login

# Apply the migration
npx supabase db push --file supabase/migrations/20260207_add_vendor_notification_tracking.sql

# Verify it worked
psql -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres \
  -c "SELECT column_name FROM information_schema.columns WHERE table_name='vendors' AND column_name IN ('phone', 'last_notified_at');"
```

Expected output:
```
 column_name
-------------------
 phone
 last_notified_at
```

---

## Step 2: Configure Environment Variables

### Development (Simulation Mode)

Add to `.env.local`:

```bash
# AiSensy (Disabled for testing)
AISENSY_ENABLED=false

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Production (Live WhatsApp)

Add via Vercel dashboard or CLI:

```bash
vercel env add AISENSY_ENABLED
> true

vercel env add AISENSY_API_KEY
> your_aisensy_api_key_here

vercel env add AISENSY_PARTNER_ID
> your_partner_id_here

vercel env add NEXT_PUBLIC_APP_URL
> https://eventfoundry.com
```

---

## Step 3: Add Phone Numbers to Vendors

### Option A: Via Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project → Table Editor → `vendors`
3. Add phone numbers in format: `+919876543210`

### Option B: Via SQL

```sql
-- Update single vendor
UPDATE vendors
SET phone = '+919876543210'
WHERE id = 'vendor-uuid-here';

-- Bulk update (if you have a list)
UPDATE vendors SET phone = '+919123456789' WHERE company_name = 'Vendor A';
UPDATE vendors SET phone = '+919234567890' WHERE company_name = 'Vendor B';
UPDATE vendors SET phone = '+919345678901' WHERE company_name = 'Vendor C';
```

---

## Step 4: Test the System

### Test 1: Create an Event (Triggers Notification)

```bash
# Start dev server if not already running
pnpm dev

# Visit http://localhost:3000/forge
# Create event with:
# - Type: Corporate Event
# - City: Kochi
# - Date: Any future date
# - Guests: 150
# - Venue: Not yet booked

# Click "Launch Project"
```

### Test 2: Manually Trigger Notification API

```bash
# First, get a real event ID from your database
EVENT_ID=$(psql -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres \
  -tAc "SELECT id FROM events ORDER BY created_at DESC LIMIT 1;")

# Trigger notifications
curl -X POST http://localhost:3000/api/events/notify-vendors \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": \"$EVENT_ID\",
    \"city\": \"Kochi\",
    \"eventType\": \"Corporate Event\",
    \"sendWhatsApp\": true
  }"
```

### Expected Response (Simulation Mode)

```json
{
  "success": true,
  "eventId": "event-uuid",
  "city": "Kochi",
  "notifications": {
    "sent": 3,
    "skipped": 0,
    "failed": 0,
    "total": 3
  },
  "results": [
    {
      "vendorId": "vendor-1",
      "vendorName": "Kochi Events Co",
      "status": "sent",
      "messageId": "sim_abc123"
    }
  ],
  "message": "WhatsApp notifications sent to 3 vendors"
}
```

### Check Logs

```bash
# Check database for notification records
psql -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres \
  -c "SELECT vendor_id, status, created_at FROM vendor_notifications ORDER BY created_at DESC LIMIT 5;"
```

---

## Step 5: Verify in Vendor Dashboard

```bash
# Open vendor dashboard
open http://localhost:3000/craftsmen/dashboard

# Login with vendor credentials:
# Email: vendor@eventfoundry.com
# Password: password123

# You should see:
# - Event in "Open Events" section
# - "NEW" badge (orange, pulsing)
# - Stats showing "New Events (24h): 1"
```

---

## Troubleshooting

### Issue: "Event not found"
**Solution**: Make sure event exists in database and has `forge_status = 'OPEN_FOR_BIDS'`

```sql
SELECT id, title, city, forge_status FROM events ORDER BY created_at DESC LIMIT 5;
```

### Issue: "No vendors found"
**Solution**: Add verified vendors with phone numbers in Kochi

```sql
-- Check vendors
SELECT id, company_name, city, phone, verified FROM vendors WHERE city ILIKE 'Kochi';

-- Fix if needed
UPDATE vendors SET verified = true, phone = '+919876543210' WHERE city ILIKE 'Kochi';
```

### Issue: Notifications showing "skipped"
**Solution**: Check if vendor was notified recently (1 hour cooldown)

```sql
-- Check last notification time
SELECT company_name, last_notified_at,
       EXTRACT(EPOCH FROM (NOW() - last_notified_at)) / 60 as minutes_since_last
FROM vendors
WHERE city ILIKE 'Kochi';

-- Reset if testing
UPDATE vendors SET last_notified_at = NULL WHERE city ILIKE 'Kochi';
```

---

## Production Checklist

Before going live with WhatsApp:

- [ ] Database migration applied to production
- [ ] All vendors have phone numbers (format: +91XXXXXXXXXX)
- [ ] AiSensy account created and verified
- [ ] `AISENSY_ENABLED=true` in production
- [ ] `AISENSY_API_KEY` set in Vercel
- [ ] `AISENSY_PARTNER_ID` set in Vercel
- [ ] Test event created and notification sent successfully
- [ ] Vendor received WhatsApp message
- [ ] Message format looks professional
- [ ] Bid link in message works correctly
- [ ] Rate limiting tested (prevent spam)
- [ ] Monitoring/alerts configured

---

## Quick Commands Reference

```bash
# Apply migration
npx supabase db push --file supabase/migrations/20260207_add_vendor_notification_tracking.sql

# Check vendor phones
psql -c "SELECT company_name, phone FROM vendors WHERE city ILIKE 'Kochi';"

# Trigger notification
curl -X POST http://localhost:3000/api/events/notify-vendors \
  -d '{"eventId": "EVENT_ID", "city": "Kochi"}'

# Check notification history
psql -c "SELECT * FROM vendor_notifications ORDER BY created_at DESC LIMIT 5;"

# Reset rate limiting (testing only)
psql -c "UPDATE vendors SET last_notified_at = NULL;"

# Run E2E tests
npx playwright test whatsapp-notifications.spec.ts
```

---

## Message Template Preview

```
🎉 *New Event Alert!*

Hi Kochi Events Co,

A new *Corporate Event* event has just been posted in *Kochi*!

📋 *Event Details:*
📅 Date: 20 Mar 2026
👥 Guests: 150
💰 Budget: ₹2,00,000

🔥 *Don't miss this opportunity!*
Click the link below to view details and submit your bid:

https://eventfoundry.com/craftsmen/events/event-456/bid

_Powered by EventFoundry - Your Event Marketplace_
```

---

## Success! 🎉

You now have WhatsApp notifications running!

**Next Steps**:
1. Test with real vendors
2. Monitor notification success rates
3. Adjust rate limiting if needed
4. Add more vendors with phone numbers
5. Consider email fallback (Phase 2)

**Need Help?**
- Check `WHATSAPP_NOTIFICATIONS_IMPLEMENTATION.md` for detailed docs
- Review logs: `vercel logs | grep WhatsApp`
- Contact support: forge@eventfoundry.com
