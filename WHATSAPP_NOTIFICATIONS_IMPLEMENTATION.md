# WhatsApp Vendor Notifications - Implementation Guide 📱

**Status**: ✅ COMPLETE
**Date**: February 7, 2026
**Integration**: AiSensy WhatsApp Business API
**Purpose**: Real-time vendor notifications for new events via WhatsApp

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [WhatsApp Service](#whatsapp-service)
5. [API Endpoint](#api-endpoint)
6. [Environment Configuration](#environment-configuration)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Problem Solved
Previously, vendors only saw events in their dashboard (passive discovery). Now vendors receive instant WhatsApp notifications when relevant events are posted in their city.

### Solution
- **Marketplace Bridge**: Event creation → Vendor notification via WhatsApp
- **Provider**: AiSensy (popular WhatsApp Business API for India)
- **Rate Limiting**: 1 hour cooldown to prevent spam
- **Audit Trail**: All notifications logged in database
- **Message Template**: Professional format with event details and bid link

### Key Features
✅ Instant WhatsApp notifications to matched vendors
✅ City and specialty-based matching
✅ 1 hour rate limiting (prevents duplicate messages)
✅ Complete audit trail in database
✅ Simulation mode for testing
✅ Graceful fallback if vendor has no phone number
✅ Professional message template in English

---

## Architecture

### Data Flow

```
┌─────────────────────┐
│  Client Creates     │
│  Event in Kochi     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  POST /api/forge/projects           │
│  - Create event (OPEN_FOR_BIDS)     │
│  - Store city, type, date, guests   │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  POST /api/events/notify-vendors    │
│  - Find vendors in Kochi            │
│  - Check rate limiting              │
│  - Generate WhatsApp messages       │
└──────────┬──────────────────────────┘
           │
           ├──────────────────────────┐
           │                          │
           ▼                          ▼
┌──────────────────────┐    ┌──────────────────────┐
│  AiSensy API         │    │  vendor_notifications│
│  - Send to WhatsApp  │    │  - Log in database   │
│  - Return message ID │    │  - Track status      │
└──────────┬───────────┘    └──────────┬───────────┘
           │                           │
           ▼                           ▼
┌──────────────────────┐    ┌──────────────────────┐
│  Vendor Receives     │    │  vendors table       │
│  WhatsApp Message    │    │  - Update            │
│                      │    │    last_notified_at  │
└──────────────────────┘    └──────────────────────┘
```

### Component Overview

| Component | File | Purpose |
|-----------|------|---------|
| **WhatsApp Service** | `/src/lib/whatsapp.ts` | Core WhatsApp integration logic |
| **Notification API** | `/src/app/api/events/notify-vendors/route.ts` | HTTP endpoint for notifications |
| **Database Migration** | `/supabase/migrations/20260207_add_vendor_notification_tracking.sql` | Schema updates |
| **Type Definitions** | `/src/types/database.ts` | TypeScript types |
| **E2E Tests** | `/tests/e2e/whatsapp-notifications.spec.ts` | Test suite |

---

## Database Schema

### New Tables

#### 1. `vendor_notifications` (Audit Log)

```sql
CREATE TABLE vendor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  event_id UUID NOT NULL REFERENCES events(id),
  notification_type VARCHAR(20) NOT NULL, -- 'whatsapp', 'email', 'sms'
  phone_number VARCHAR(20),
  message_content TEXT,
  status VARCHAR(20) NOT NULL, -- 'pending', 'sent', 'delivered', 'failed'
  provider_response JSONB,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose**: Complete audit trail of all notification attempts

**Indexes**:
- `idx_notifications_vendor` on `vendor_id`
- `idx_notifications_event` on `event_id`
- `idx_notifications_status` on `status`
- `idx_notifications_created` on `created_at`

### Updated Tables

#### 2. `vendors` table - New Columns

```sql
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMP WITH TIME ZONE;
```

**Purpose**:
- `phone`: WhatsApp contact number (format: +91XXXXXXXXXX)
- `last_notified_at`: Rate limiting timestamp

### Sample Queries

```sql
-- Get vendor notification history
SELECT * FROM vendor_notifications
WHERE vendor_id = 'vendor-uuid'
ORDER BY created_at DESC
LIMIT 10;

-- Check if vendor can be notified (1 hour cooldown)
SELECT
  id,
  company_name,
  last_notified_at,
  EXTRACT(EPOCH FROM (NOW() - last_notified_at)) / 60 AS minutes_since_last
FROM vendors
WHERE id = 'vendor-uuid';

-- Notification success rate by vendor
SELECT
  v.company_name,
  COUNT(*) as total_notifications,
  SUM(CASE WHEN n.status = 'sent' THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN n.status = 'sent' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM vendors v
JOIN vendor_notifications n ON v.id = n.vendor_id
WHERE n.created_at > NOW() - INTERVAL '30 days'
GROUP BY v.id, v.company_name
ORDER BY total_notifications DESC;
```

---

## WhatsApp Service

### File: `/src/lib/whatsapp.ts`

### Key Functions

#### 1. `sendWhatsAppMessage()`

```typescript
interface WhatsAppMessageParams {
  vendorId: string;
  vendorName: string;
  eventId: string;
  eventType: string;
  city: string;
  budget?: string;
  guestCount?: number;
  eventDate?: string;
  phoneNumber: string;
  bidLink: string;
}

const result = await sendWhatsAppMessage({
  vendorId: 'vendor-123',
  vendorName: 'Kochi Events Co',
  eventId: 'event-456',
  eventType: 'Corporate Event',
  city: 'Kochi',
  budget: '₹2,00,000',
  guestCount: 150,
  eventDate: '20 Mar 2026',
  phoneNumber: '+919876543210',
  bidLink: 'https://eventfoundry.com/craftsmen/events/event-456/bid'
});
```

**Returns**:
```typescript
{
  success: boolean;
  message?: string;
  messageId?: string;
  error?: string;
}
```

#### 2. `generateWhatsAppMessage()`

Creates professional message from template:

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

#### 3. `canNotifyVendor()`

Checks rate limiting:

```typescript
const canNotify = await canNotifyVendor('vendor-123', 60); // 60 minutes cooldown
```

**Returns**: `true` if vendor can be notified, `false` if too recent

#### 4. `formatPhoneNumber()`

Normalizes phone numbers for Indian market:

```typescript
formatPhoneNumber('+91 98765 43210') // → '919876543210'
formatPhoneNumber('9876543210')      // → '919876543210'
formatPhoneNumber('919876543210')    // → '919876543210'
```

#### 5. `getVendorNotificationStats()`

Retrieve analytics:

```typescript
const stats = await getVendorNotificationStats('vendor-123');
// Returns: { total: 15, sent: 12, delivered: 10, failed: 3, lastNotification: {...} }
```

---

## API Endpoint

### POST `/api/events/notify-vendors`

Send WhatsApp notifications to matched vendors for a specific event.

#### Request

```typescript
POST /api/events/notify-vendors
Content-Type: application/json

{
  "eventId": "event-uuid-here",
  "city": "Kochi",              // Optional (uses event.city if not provided)
  "eventType": "Corporate Event", // Optional (uses event.event_type if not provided)
  "sendWhatsApp": true            // Optional (default: true)
}
```

#### Response - Success

```json
{
  "success": true,
  "eventId": "event-uuid",
  "city": "Kochi",
  "eventType": "Corporate Event",
  "eventDate": "20 Mar 2026",
  "guestCount": 150,
  "budget": "₹2,00,000",
  "matchedVendorsCount": 8,
  "eligibleVendorsCount": 5,
  "notifications": {
    "sent": 3,
    "skipped": 1,
    "failed": 1,
    "total": 5
  },
  "results": [
    {
      "vendorId": "vendor-1",
      "vendorName": "Kochi Events Co",
      "status": "sent",
      "messageId": "msg_abc123"
    },
    {
      "vendorId": "vendor-2",
      "vendorName": "Kerala Caterers",
      "status": "skipped",
      "reason": "Notified recently (within 1 hour)"
    },
    {
      "vendorId": "vendor-3",
      "vendorName": "Corporate Setup Pro",
      "status": "failed",
      "reason": "Invalid phone number format"
    }
  ],
  "message": "WhatsApp notifications sent to 3 vendors",
  "bidLink": "https://eventfoundry.com/craftsmen/events/event-uuid/bid"
}
```

#### Response - Error

```json
{
  "success": false,
  "error": "Event not found"
}
```

#### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success - notifications processed |
| 400 | Bad request - missing eventId |
| 404 | Event not found |
| 500 | Server error - check logs |

---

## Environment Configuration

### Required Variables

Add to `.env.local`:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application URL (Required)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AiSensy WhatsApp API (Required for production)
AISENSY_ENABLED=true                                      # Set to 'true' in production
AISENSY_API_KEY=your_aisensy_api_key_here
AISENSY_API_URL=https://backend.aisensy.com/campaign/t1/api/v2
AISENSY_PARTNER_ID=your_partner_id_here
```

### Environment Modes

#### Development Mode (Simulation)
```bash
AISENSY_ENABLED=false
```
- Messages logged to console only
- No actual WhatsApp API calls
- Notifications marked as "sent" with simulation flag
- Perfect for local testing

#### Production Mode (Live WhatsApp)
```bash
AISENSY_ENABLED=true
AISENSY_API_KEY=live_key_here
```
- Real WhatsApp messages sent
- Requires valid AiSensy account
- API costs apply per message

### Getting AiSensy Credentials

1. Visit https://backend.aisensy.com/
2. Sign up for WhatsApp Business API account
3. Complete KYC verification (required in India)
4. Get your API key from dashboard
5. Note your Partner ID
6. Configure WhatsApp Business number

**Pricing** (approximate):
- ₹0.25 per message (conversation-based pricing)
- Free first 1,000 messages (promotional offer)

---

## Testing

### Manual Testing

#### 1. Test WhatsApp Message Format

```bash
# Run from project root
node -e "
const { generateWhatsAppMessage } = require('./src/lib/whatsapp.ts');
console.log(generateWhatsAppMessage({
  vendorName: 'Test Vendor',
  eventType: 'Corporate Event',
  city: 'Kochi',
  budget: '₹2,00,000',
  guestCount: 150,
  eventDate: '20 Mar 2026',
  bidLink: 'http://localhost:3000/test'
}));
"
```

#### 2. Test Notification API (Simulation Mode)

```bash
curl -X POST http://localhost:3000/api/events/notify-vendors \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "test-event-id",
    "city": "Kochi",
    "eventType": "Corporate Event",
    "sendWhatsApp": true
  }'
```

**Expected Response** (in simulation mode):
```json
{
  "success": true,
  "notifications": {
    "sent": 3,
    "skipped": 0,
    "failed": 0
  },
  "message": "WhatsApp notifications sent to 3 vendors"
}
```

#### 3. Test Rate Limiting

```bash
# Send notification
curl -X POST http://localhost:3000/api/events/notify-vendors \
  -d '{"eventId": "event-123", "city": "Kochi"}'

# Immediately send again - should be rate limited
curl -X POST http://localhost:3000/api/events/notify-vendors \
  -d '{"eventId": "event-456", "city": "Kochi"}'

# Check vendor notifications
psql -d eventfoundry -c "
  SELECT vendor_id, created_at, status
  FROM vendor_notifications
  WHERE vendor_id = 'vendor-uuid'
  ORDER BY created_at DESC
  LIMIT 5;
"
```

### Automated Testing

#### Run E2E Tests

```bash
# All WhatsApp notification tests
npx playwright test whatsapp-notifications.spec.ts

# Specific test
npx playwright test whatsapp-notifications.spec.ts -g "message format"

# With UI
npx playwright test whatsapp-notifications.spec.ts --ui

# Debug mode
npx playwright test whatsapp-notifications.spec.ts --debug
```

#### Test Coverage

| Test | Status | File |
|------|--------|------|
| ✅ API endpoint | Pass | `whatsapp-notifications.spec.ts:16` |
| ✅ Rate limiting | Pass | `whatsapp-notifications.spec.ts:37` |
| ✅ Message format | Pass | `whatsapp-notifications.spec.ts:51` |
| ✅ Phone formatting | Pass | `whatsapp-notifications.spec.ts:82` |
| ✅ Database logging | Pass | `whatsapp-notifications.spec.ts:114` |
| ✅ Simulation mode | Pass | `whatsapp-notifications.spec.ts:127` |

---

## Deployment

### Database Migration

#### Apply Migration to Production

```bash
# Connect to Supabase
npx supabase login

# Apply migration
npx supabase db push --file supabase/migrations/20260207_add_vendor_notification_tracking.sql

# Verify
psql -h db.your-project.supabase.co -U postgres -d postgres -c "
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'vendors' AND column_name IN ('phone', 'last_notified_at');
"
```

#### Verify Migration

```sql
-- Check new columns exist
\d vendors

-- Check notification table exists
\d vendor_notifications

-- Check indexes
\di vendor_notifications_*
```

### Update Vendor Data

#### Add Phone Numbers (One-time task)

```sql
-- Example: Update phone numbers from existing data
UPDATE vendors
SET phone = '+919876543210'
WHERE id = 'vendor-uuid-1';

-- Bulk update from CSV
COPY vendors (id, phone)
FROM '/path/to/vendor_phones.csv'
WITH (FORMAT csv, HEADER true);
```

**CSV Format**:
```csv
id,phone
vendor-uuid-1,+919876543210
vendor-uuid-2,+919123456789
```

### Environment Variables (Production)

#### Vercel Deployment

```bash
# Add via Vercel dashboard or CLI
vercel env add AISENSY_ENABLED
> true

vercel env add AISENSY_API_KEY
> your_production_api_key

vercel env add AISENSY_PARTNER_ID
> your_partner_id

vercel env add NEXT_PUBLIC_APP_URL
> https://eventfoundry.com
```

#### Verify Configuration

```bash
curl https://eventfoundry.com/api/events/notify-vendors \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"eventId": "test", "city": "Kochi"}' \
  | jq .
```

---

## Monitoring

### Key Metrics to Track

#### 1. Notification Success Rate

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_sent,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate_pct
FROM vendor_notifications
WHERE created_at > NOW() - INTERVAL '7 days'
  AND notification_type = 'whatsapp'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### 2. Vendor Engagement After Notification

```sql
-- How many vendors bid after receiving notification?
SELECT
  COUNT(DISTINCT n.vendor_id) as vendors_notified,
  COUNT(DISTINCT b.vendor_id) as vendors_who_bid,
  ROUND(100.0 * COUNT(DISTINCT b.vendor_id) / COUNT(DISTINCT n.vendor_id), 2) as conversion_rate
FROM vendor_notifications n
LEFT JOIN bids b ON n.vendor_id = b.vendor_id
  AND n.event_id = b.event_id
  AND b.created_at > n.sent_at
  AND b.created_at < n.sent_at + INTERVAL '24 hours'
WHERE n.sent_at > NOW() - INTERVAL '30 days';
```

#### 3. Rate Limiting Effectiveness

```sql
-- How many notifications were skipped due to rate limiting?
SELECT
  COUNT(*) FILTER (WHERE status = 'skipped') as rate_limited,
  COUNT(*) as total_attempts,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'skipped') / COUNT(*), 2) as rate_limit_pct
FROM vendor_notifications
WHERE created_at > NOW() - INTERVAL '7 days';
```

### Logging & Debugging

#### Enable Debug Logging

```typescript
// In whatsapp.ts, increase verbosity
console.log('[WhatsApp] Sending to', formattedPhone, 'via AiSensy...');
console.log('[WhatsApp] Payload:', JSON.stringify(aiSensyPayload, null, 2));
```

#### Check Logs in Production

```bash
# Vercel logs
vercel logs --follow

# Filter for WhatsApp
vercel logs | grep "WhatsApp"

# Filter for failures
vercel logs | grep "Failed to send"
```

### Alerts & Notifications

#### Sentry Integration (Recommended)

```typescript
// In whatsapp.ts, add Sentry for failures
import * as Sentry from '@sentry/nextjs';

if (result.error) {
  Sentry.captureMessage('WhatsApp notification failed', {
    level: 'warning',
    extra: {
      vendorId,
      eventId,
      error: result.error
    }
  });
}
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Notifications not sending

**Symptoms**: API returns success but no WhatsApp messages received

**Diagnosis**:
```bash
# Check if AISENSY_ENABLED is true
echo $AISENSY_ENABLED

# Check if API key is set
echo $AISENSY_API_KEY | head -c 10

# Check database logs
SELECT * FROM vendor_notifications
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

**Solutions**:
1. Verify `AISENSY_ENABLED=true` in production
2. Check AiSensy API key is valid
3. Confirm vendor phone numbers are in correct format (+91XXXXXXXXXX)
4. Check AiSensy account balance/quota
5. Review `provider_response` in database for error details

#### Issue 2: "Invalid phone number format" errors

**Symptoms**: Notifications fail with phone validation errors

**Diagnosis**:
```sql
SELECT id, company_name, phone
FROM vendors
WHERE phone IS NOT NULL
  AND (
    phone !~ '^\+?91[0-9]{10}$'
    OR LENGTH(phone) < 10
  );
```

**Solutions**:
```sql
-- Fix phone number formatting
UPDATE vendors
SET phone = CONCAT('+91', REGEXP_REPLACE(phone, '[^0-9]', '', 'g'))
WHERE phone IS NOT NULL
  AND phone !~ '^\+91';

-- Validate all phone numbers
UPDATE vendors
SET phone = NULL
WHERE phone IS NOT NULL
  AND LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) != 10;
```

#### Issue 3: Rate limiting too aggressive

**Symptoms**: Vendors not receiving notifications for multiple events

**Diagnosis**:
```sql
SELECT
  v.company_name,
  v.last_notified_at,
  EXTRACT(EPOCH FROM (NOW() - v.last_notified_at)) / 60 as minutes_since_last,
  COUNT(n.id) as notifications_attempted,
  COUNT(CASE WHEN n.status = 'skipped' THEN 1 END) as skipped_count
FROM vendors v
LEFT JOIN vendor_notifications n ON v.id = n.vendor_id
WHERE v.last_notified_at > NOW() - INTERVAL '2 hours'
GROUP BY v.id, v.company_name, v.last_notified_at
ORDER BY minutes_since_last;
```

**Solutions**:
```typescript
// Adjust cooldown in notify-vendors/route.ts
const canNotify = await canNotifyVendor(vendor.id, 30); // Reduce to 30 minutes

// Or per-vendor settings
const cooldownMinutes = vendor.notification_preferences?.cooldown || 60;
```

#### Issue 4: AiSensy API errors

**Symptoms**: `provider_response` shows error from AiSensy

**Common AiSensy Errors**:

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid API key` | Wrong or expired key | Regenerate in AiSensy dashboard |
| `Insufficient balance` | Account quota exhausted | Add credits to AiSensy account |
| `Invalid phone number` | Number not registered | Verify WhatsApp Business number |
| `Rate limit exceeded` | Too many messages/sec | Add delay between sends (already implemented) |
| `Template not approved` | Using unapproved template | Use simple text messages or get template approved |

**Debug AiSensy Response**:
```sql
SELECT
  vendor_id,
  status,
  provider_response,
  created_at
FROM vendor_notifications
WHERE provider_response IS NOT NULL
  AND status = 'failed'
ORDER BY created_at DESC
LIMIT 5;
```

#### Issue 5: Messages sent but vendors not seeing them

**Symptoms**: Database shows "sent" but vendors claim no messages received

**Diagnosis**:
1. Check if vendors have WhatsApp installed on phone number
2. Verify phone number belongs to vendor
3. Check WhatsApp Business API number is verified
4. Confirm messages not going to spam

**Solutions**:
```typescript
// Add delivery confirmation webhook (if supported by AiSensy)
// Update status when WhatsApp confirms delivery

// Meanwhile, track manually:
SELECT
  v.company_name,
  v.phone,
  n.sent_at,
  n.status,
  n.message_content
FROM vendor_notifications n
JOIN vendors v ON n.vendor_id = v.id
WHERE n.status = 'sent'
  AND n.sent_at > NOW() - INTERVAL '1 hour'
ORDER BY n.sent_at DESC;
```

### Debug Mode

Enable comprehensive logging:

```bash
# .env.local
DEBUG=whatsapp:*
AISENSY_DEBUG=true
```

```typescript
// In whatsapp.ts
if (process.env.AISENSY_DEBUG === 'true') {
  console.log('[WhatsApp Debug] Full request:', {
    vendor: vendorId,
    phone: formattedPhone,
    payload: aiSensyPayload,
    timestamp: new Date().toISOString()
  });
}
```

---

## Success Metrics

### Expected Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Notification delivery rate | >95% | TBD |
| Average delivery time | <5 seconds | TBD |
| Vendor response rate (24h) | >40% | TBD |
| Bid conversion from notification | >25% | TBD |
| Rate limit false positives | <5% | TBD |

### Business Impact

**Before WhatsApp Notifications**:
- Vendors discover events: Passive (dashboard only)
- Time to first bid: 2-4 hours
- Vendor engagement: ~30%

**After WhatsApp Notifications** (Expected):
- Vendors discover events: Active (instant push)
- Time to first bid: <30 minutes
- Vendor engagement: >60%

---

## Next Steps

### Phase 2 Enhancements

1. **Delivery Confirmation**: Track when messages are delivered and read
2. **Rich Media**: Add images/PDFs to WhatsApp messages
3. **Two-way Chat**: Allow vendors to reply via WhatsApp
4. **Email Fallback**: Send email if WhatsApp fails
5. **SMS Fallback**: Send SMS for vendors without WhatsApp
6. **Notification Preferences**: Let vendors customize notification frequency

### Phase 3 Advanced Features

1. **AI-powered Matching**: Machine learning for vendor-event matching
2. **Predictive Notifications**: Notify vendors before they even search
3. **Multi-language**: Support regional Indian languages
4. **Voice Messages**: Audio notifications for high-value events
5. **WhatsApp Business Catalog**: Vendor portfolios in WhatsApp

---

## Support

### Resources

- **AiSensy Docs**: https://docs.aisensy.com/
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp
- **EventFoundry Support**: forge@eventfoundry.com

### Getting Help

1. Check this documentation first
2. Review database logs (`vendor_notifications` table)
3. Check application logs (Vercel/server logs)
4. Test with `AISENSY_ENABLED=false` (simulation mode)
5. Contact AiSensy support if API issues persist

---

## Changelog

### Version 1.0.0 (February 7, 2026)
- ✅ Initial implementation
- ✅ AiSensy integration
- ✅ Rate limiting (1 hour cooldown)
- ✅ Database audit trail
- ✅ Simulation mode for testing
- ✅ Comprehensive E2E tests
- ✅ Professional message template
- ✅ Phone number formatting
- ✅ Vendor notification stats

### Future Versions
- [ ] Version 1.1: Delivery confirmation webhooks
- [ ] Version 1.2: Email/SMS fallbacks
- [ ] Version 2.0: Two-way chat via WhatsApp

---

**Implementation Status**: ✅ Production Ready

**Last Updated**: February 7, 2026

**Maintainer**: EventFoundry Dev Team
