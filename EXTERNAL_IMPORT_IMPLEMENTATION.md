# External Event Import & Draft Resume - Implementation Guide 🔗

**Status**: ✅ COMPLETE
**Date**: February 7, 2026
**Purpose**: Allow WhatsApp bots and external systems to create draft events that users can complete on website

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Endpoint](#api-endpoint)
4. [Short Code System](#short-code-system)
5. [User Flow](#user-flow)
6. [Database Schema](#database-schema)
7. [WhatsApp Bot Integration](#whatsapp-bot-integration)
8. [Testing](#testing)
9. [Security](#security)
10. [Monitoring](#monitoring)

---

## Overview

### Problem Solved

Previously, users had to manually enter all event details through the website chat. Now, external systems (WhatsApp bots, Facebook Messenger, APIs) can collect event data and create "drafts" that users can resume on the website, skipping the repetitive questions.

### Solution

```
WhatsApp Bot → Collects Data → Calls API → Gets Short Code → Sends Link
                                                                    ↓
User Clicks Link → Resume Page → Blueprint Selection → Event Complete
```

### Key Features

✅ **No Auth Required**: Draft creation doesn't need user account
✅ **Short Codes**: 8-character memorable codes (e.g., "FORGE2X9")
✅ **7-Day Expiration**: Auto-cleanup of abandoned drafts
✅ **Skip Questions**: User goes directly to blueprint selection
✅ **Source Tracking**: Know which channel drove the conversion
✅ **Audit Trail**: Complete tracking of draft access and completion

---

## Architecture

### System Components

```
┌──────────────────┐
│ WhatsApp Bot API │
│  (External)      │
└─────────┬────────┘
          │
          ├─ Collects: event_type, city, date, guests
          │
          ▼
┌────────────────────────────────────┐
│ POST /api/forge/external-import    │
│                                    │
│ - Validate input                   │
│ - Generate unique short code       │
│ - Create draft event (status=DRAFT)│
│ - Create draft session             │
│ - Return: short_code, resume_url   │
└─────────┬──────────────────────────┘
          │
          │ Returns: {
          │   short_code: "FORGE2X9",
          │   resume_url: "/forge/resume/FORGE2X9",
          │   expires_at: "2026-02-14T..."
          │ }
          │
          ▼
┌────────────────────────────────────┐
│ WhatsApp Bot sends message:        │
│                                    │
│ "Click to complete your event:     │
│  eventfoundry.com/forge/resume/    │
│  FORGE2X9"                          │
└─────────┬──────────────────────────┘
          │
          │ User clicks link
          │
          ▼
┌────────────────────────────────────┐
│ /forge/resume/[shortCode]          │
│                                    │
│ - Load draft from API              │
│ - Show event preview               │
│ - Store in sessionStorage          │
│ - Redirect to blueprint selection  │
└─────────┬──────────────────────────┘
          │
          ▼
┌────────────────────────────────────┐
│ /blueprint/[shortCode]/review      │
│                                    │
│ - Load draft data from storage     │
│ - Skip chat questions              │
│ - Show checklist selection         │
│ - User completes blueprint         │
│ - Event finalized                  │
└────────────────────────────────────┘
```

---

## API Endpoint

### POST `/api/forge/external-import`

Create draft event from external source.

#### Request

```typescript
POST /api/forge/external-import
Content-Type: application/json

{
  // Required fields
  "event_type": "Corporate Event",
  "city": "Kochi",
  "source": "whatsapp_bot",

  // Optional fields
  "date": "2026-04-15",               // ISO date or natural language
  "guest_count": 150,                 // Number or string
  "venue_status": "not_booked",
  "budget_range": "₹2,00,000 - ₹3,00,000",

  // Source tracking
  "external_reference_id": "whatsapp_conv_12345",

  // Client information
  "client_name": "Priya Sharma",
  "client_phone": "+919876543210",
  "client_email": "priya@example.com",
  "additional_notes": "Needs vegetarian catering",

  // API authentication (optional)
  "api_key": "your_api_key_here"
}
```

#### Response - Success

```json
{
  "success": true,
  "short_code": "FORGE2X9",
  "resume_url": "https://eventfoundry.com/forge/resume/FORGE2X9",
  "event_id": "event-uuid-here",
  "expires_at": "2026-02-14T10:30:00Z",
  "message": "Draft event created successfully. Valid for 7 days."
}
```

#### Response - Error

```json
{
  "success": false,
  "error": "Missing required fields: event_type and city are required"
}
```

#### Status Codes

| Code | Meaning |
|------|---------|
| 201 | Created - draft event created successfully |
| 400 | Bad Request - missing required fields |
| 401 | Unauthorized - invalid API key (if configured) |
| 500 | Server Error - failed to create draft |

---

### GET `/api/forge/external-import?short_code=FORGE2X9`

Retrieve draft event by short code (for bot to check status).

#### Request

```
GET /api/forge/external-import?short_code=FORGE2X9
```

#### Response

```json
{
  "success": true,
  "short_code": "FORGE2X9",
  "event_id": "event-uuid",
  "expires_at": "2026-02-14T10:30:00Z",
  "is_expired": false,
  "is_completed": false,
  "access_count": 3,
  "source": "whatsapp_bot",
  "event": {
    "id": "event-uuid",
    "event_type": "Corporate Event",
    "city": "Kochi",
    "date": "2026-04-15",
    "guest_count": 150,
    ...
  }
}
```

---

## Short Code System

### Format

- **Length**: 8 characters
- **Characters**: Uppercase letters and numbers (excludes ambiguous: 0, O, I, 1, L)
- **Examples**: `FORGE2X9`, `KOCHI7P4`, `DRAFT3M8`
- **Collision Rate**: ~1 in 2.8 trillion (36^8)

### Generation

```typescript
// File: /src/lib/shortcode.ts

// Generate random code
const code = generateShortCode();
// => "FORGE2X9"

// Generate unique code (checks database for collisions)
const code = await generateUniqueShortCode();
// => "KOCHI7P4"

// Validate format
isValidShortCode("FORGE2X9")  // => true
isValidShortCode("FORGE")     // => false (too short)
isValidShortCode("FORGE0O1")  // => false (ambiguous chars)

// Format for display
formatShortCode("FORGE2X9", "-")  // => "FORGE-2X9"
formatShortCode("FORGE2X9", " ")  // => "FORGE 2X9"

// Generate URL
shortCodeToUrl("FORGE2X9")  // => "/forge/resume/FORGE2X9"
```

### Expiration

- **Default**: 7 days from creation
- **Cleanup**: Automated daily cron job
- **After Completion**: Never expires (kept for analytics)

---

## User Flow

### Step-by-Step Journey

#### 1. WhatsApp Conversation

```
Bot: What type of event are you planning?
User: Corporate event

Bot: Which city?
User: Kochi

Bot: How many guests?
User: 150

Bot: 🎉 Perfect! I've prepared your event details:

     Event: Corporate Event
     City: Kochi
     Guests: 150

     Click here to complete your event planning:
     https://eventfoundry.com/forge/resume/FORGE2X9

     This link is valid for 7 days.
```

#### 2. User Clicks Link

**URL**: `https://eventfoundry.com/forge/resume/FORGE2X9`

**What happens**:
- Page loads draft data from API
- Shows event preview:
  ```
  ┌─────────────────────────────────┐
  │ ✅ Draft Loaded Successfully!   │
  │                                 │
  │ Event Type: Corporate Event     │
  │ City: Kochi                     │
  │ Guests: 150                     │
  │                                 │
  │ ⏳ Redirecting to blueprint...  │
  └─────────────────────────────────┘
  ```
- Stores data in sessionStorage
- Redirects to blueprint selection

#### 3. Blueprint Selection

**URL**: `/blueprint/FORGE2X9/review`

**What user sees**:
- NO chat questions (skipped!)
- Direct access to event checklist
- Event type pre-selected
- City, date, guests pre-filled

#### 4. Event Completion

User:
- Reviews checklist items
- Adds notes/preferences
- Clicks "Launch Project"

Result:
- Draft converted to full event
- Status changed: `DRAFT` → `OPEN_FOR_BIDS`
- Short code marked as completed
- User can log in or continue as guest

---

## Database Schema

### New Tables

#### 1. `draft_event_sessions`

```sql
CREATE TABLE draft_event_sessions (
  id UUID PRIMARY KEY,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  event_id UUID REFERENCES events(id),
  source VARCHAR(50) NOT NULL,           -- 'whatsapp_bot', 'api', etc.
  external_reference_id VARCHAR(100),     -- WhatsApp conv ID, etc.
  client_data JSONB,                      -- Metadata from source
  ip_address VARCHAR(45),                 -- For analytics
  user_agent TEXT,
  access_count INTEGER DEFAULT 0,         -- Times accessed
  last_accessed_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,                 -- When finalized
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Purpose**: Track draft lifecycle and conversions

### Updated Tables

#### 2. `events` - New Columns

```sql
ALTER TABLE events ADD COLUMN short_code VARCHAR(10) UNIQUE;
ALTER TABLE events ADD COLUMN draft_source VARCHAR(50);
ALTER TABLE events ADD COLUMN draft_expires_at TIMESTAMP;
ALTER TABLE events ADD COLUMN external_reference_id VARCHAR(100);
```

**Purpose**:
- `short_code`: Unique access code
- `draft_source`: Where it came from (analytics)
- `draft_expires_at`: Auto-cleanup timestamp
- `external_reference_id`: Link back to source system

### New Enum Value

```sql
-- events.forge_status now includes:
'DRAFT' | 'BLUEPRINT_READY' | 'OPEN_FOR_BIDS' | ...
```

**Purpose**: Distinguish imported drafts from finalized events

---

## WhatsApp Bot Integration

### AiSensy Bot Example

```javascript
// WhatsApp bot conversation handler
async function handleEventPlanning(message, session) {
  // Collect data through conversation
  const eventData = {
    event_type: session.event_type,
    city: session.city,
    date: session.date,
    guest_count: session.guest_count,
    client_name: session.user_name,
    client_phone: session.user_phone
  };

  // Call EventFoundry API
  const response = await fetch('https://eventfoundry.com/api/forge/external-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...eventData,
      source: 'whatsapp_bot',
      external_reference_id: session.conversation_id,
      api_key: process.env.EVENTFOUNDRY_API_KEY
    })
  });

  const result = await response.json();

  if (result.success) {
    // Send resume link to user
    await sendWhatsAppMessage(session.user_phone, `
🎉 *Great news!* Your event draft is ready.

*Event Details:*
📋 Type: ${eventData.event_type}
📍 City: ${eventData.city}
👥 Guests: ${eventData.guest_count}

👉 *Complete your event planning here:*
${result.resume_url}

💡 *Tip:* This link is valid for 7 days. You can customize your event checklist and get vendor bids!

_Powered by EventFoundry 🏗️_
    `);
  }
}
```

### Facebook Messenger Integration

```javascript
// Similar flow for Facebook Messenger
async function handleMessengerEvent(message, sender_id) {
  // Collect event data...

  const response = await fetch('https://eventfoundry.com/api/forge/external-import', {
    method: 'POST',
    body: JSON.stringify({
      event_type: eventData.type,
      city: eventData.city,
      source: 'facebook_messenger',
      external_reference_id: sender_id,
      client_name: userProfile.name
    })
  });

  const result = await response.json();

  // Send Messenger button with resume link
  await sendMessengerButton(sender_id, {
    text: 'Your event draft is ready! 🎉',
    buttons: [{
      type: 'web_url',
      url: result.resume_url,
      title: 'Complete Event Planning'
    }]
  });
}
```

---

## Testing

### Manual Testing

#### 1. Create Draft via cURL

```bash
curl -X POST http://localhost:3000/api/forge/external-import \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "Corporate Event",
    "city": "Kochi",
    "date": "2026-04-15",
    "guest_count": 150,
    "source": "api",
    "client_name": "Test User"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "short_code": "FORGE2X9",
  "resume_url": "http://localhost:3000/forge/resume/FORGE2X9",
  "event_id": "...",
  "expires_at": "2026-02-14T..."
}
```

#### 2. Access Resume Page

```bash
# Copy the resume_url from above and open in browser
open http://localhost:3000/forge/resume/FORGE2X9
```

**Expected**:
- Loading screen appears
- Event details shown
- Redirects to blueprint page
- Chat questions skipped

#### 3. Verify Draft in Database

```sql
-- Check draft event
SELECT id, title, event_type, city, short_code, forge_status, draft_source
FROM events
WHERE short_code = 'FORGE2X9';

-- Check draft session
SELECT short_code, source, access_count, completed_at, expires_at
FROM draft_event_sessions
WHERE short_code = 'FORGE2X9';
```

### Automated Testing

```bash
# Run E2E tests
npx playwright test external-import-flow.spec.ts

# Specific tests
npx playwright test -g "API creates draft"
npx playwright test -g "Invalid short code"
npx playwright test -g "Short code uniqueness"

# With UI
npx playwright test external-import-flow.spec.ts --ui
```

---

## Security

### API Key Protection (Optional)

```bash
# .env.local
FORGE_API_KEY=your_secret_key_here
```

```javascript
// In API request
{
  "event_type": "Corporate Event",
  "city": "Kochi",
  "source": "whatsapp_bot",
  "api_key": "your_secret_key_here"
}
```

**When to use**:
- Production environment
- External integrations
- Rate limiting required

**When NOT to use**:
- Internal testing
- Trusted bots
- MVP phase

### Rate Limiting

Recommended limits:
- **Per IP**: 10 drafts per hour
- **Per Source**: 100 drafts per day
- **Global**: 1000 drafts per hour

### Data Validation

All inputs sanitized:
```typescript
// Validate event_type
if (!/^[a-zA-Z\s]+$/.test(event_type)) {
  return error('Invalid event type');
}

// Validate city
if (!/^[a-zA-Z\s]+$/.test(city)) {
  return error('Invalid city');
}

// Validate guest_count
const guests = parseInt(guest_count);
if (isNaN(guests) || guests < 1 || guests > 10000) {
  return error('Invalid guest count');
}
```

### Short Code Security

- ✅ Random generation (not sequential)
- ✅ No user data in code
- ✅ Expires after 7 days
- ✅ One-time use (marked complete)
- ✅ No sensitive information stored

---

## Monitoring

### Key Metrics

#### 1. Draft Conversion Rate

```sql
SELECT
  source,
  COUNT(*) as total_drafts,
  COUNT(completed_at) as completed,
  ROUND(100.0 * COUNT(completed_at) / COUNT(*), 2) as conversion_rate_pct
FROM draft_event_sessions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY source
ORDER BY total_drafts DESC;
```

**Expected Output**:
```
source          | total_drafts | completed | conversion_rate_pct
----------------|--------------|-----------|--------------------
whatsapp_bot    | 150          | 105       | 70.00
api             | 50           | 35        | 70.00
facebook        | 30           | 18        | 60.00
```

#### 2. Time to Completion

```sql
SELECT
  source,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600) as avg_hours_to_complete
FROM draft_event_sessions
WHERE completed_at IS NOT NULL
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY source;
```

#### 3. Expiration Rate

```sql
SELECT
  COUNT(*) FILTER (WHERE expires_at < NOW() AND completed_at IS NULL) as expired,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE expires_at < NOW() AND completed_at IS NULL) / COUNT(*), 2) as expiration_rate_pct
FROM draft_event_sessions
WHERE created_at > NOW() - INTERVAL '30 days';
```

#### 4. Access Patterns

```sql
SELECT
  access_count,
  COUNT(*) as draft_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM draft_event_sessions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY access_count
ORDER BY access_count;
```

**Example Output**:
```
access_count | draft_count | percentage
-------------|-------------|------------
1            | 50          | 20.00     (clicked once, never returned)
2            | 80          | 32.00     (clicked twice)
3            | 70          | 28.00     (clicked 3 times)
4+           | 50          | 20.00     (highly engaged)
```

### Alerts

**Set up alerts for**:
- Conversion rate drops below 50%
- Expiration rate above 40%
- API errors above 5%
- Average time to complete above 48 hours

---

## Cleanup & Maintenance

### Daily Cron Job

```sql
-- Run daily at 3 AM
-- Delete expired drafts that were never completed
SELECT cleanup_expired_drafts();

-- Expected output: number of deleted drafts
-- Example: 15 expired drafts deleted
```

### Manual Cleanup

```sql
-- View expired drafts
SELECT short_code, created_at, expires_at, source
FROM draft_event_sessions
WHERE expires_at < NOW()
  AND completed_at IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- Delete specific draft
DELETE FROM events WHERE short_code = 'FORGE2X9';
```

---

## Success Metrics

### Expected Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Draft Creation Success Rate | >99% | TBD |
| Conversion Rate (Draft → Complete) | >60% | TBD |
| Time to Completion | <24 hours | TBD |
| Expiration Rate | <30% | TBD |
| Average Access Count | 2-3 | TBD |

### Business Impact

**Before External Import**:
- User drops off during chat: ~40%
- Time to event creation: 5-10 minutes
- Mobile friction: High

**After External Import** (Expected):
- User drops off: <20%
- Time to event creation: 2-3 minutes
- Mobile friction: Low (handled in WhatsApp)

---

## Future Enhancements

### Phase 2

1. **Multi-source Support**:
   - Instagram DMs
   - LinkedIn messages
   - SMS integration
   - Voice calls (Twilio)

2. **Smarter Matching**:
   - Auto-select blueprint based on event type
   - Pre-fill more checklist items
   - AI-powered suggestions

3. **Collaboration**:
   - Share draft with multiple people
   - Co-editing support
   - Team access

4. **Analytics**:
   - Source attribution dashboard
   - Conversion funnel visualization
   - A/B testing for bot messages

---

## Files Created/Modified

### New Files
1. ✅ `/supabase/migrations/20260207_add_draft_events_and_short_codes.sql`
2. ✅ `/src/lib/shortcode.ts`
3. ✅ `/src/app/api/forge/external-import/route.ts`
4. ✅ `/src/app/forge/resume/[shortCode]/page.tsx`
5. ✅ `/tests/e2e/external-import-flow.spec.ts`
6. ✅ `/EXTERNAL_IMPORT_IMPLEMENTATION.md`

### Modified Files
1. ✅ `/src/types/database.ts` - Added draft types
2. ✅ `/src/app/blueprint/[blueprintId]/page.tsx` - Added draft handling

---

## Quick Start Commands

```bash
# Apply migration
npx supabase db push --file supabase/migrations/20260207_add_draft_events_and_short_codes.sql

# Create test draft
curl -X POST http://localhost:3000/api/forge/external-import \
  -d '{"event_type":"Corporate Event","city":"Kochi","source":"api"}'

# Run tests
npx playwright test external-import-flow.spec.ts

# Check draft stats
psql -c "SELECT * FROM draft_event_sessions ORDER BY created_at DESC LIMIT 5;"
```

---

## Support

**Documentation**: [EXTERNAL_IMPORT_IMPLEMENTATION.md](./EXTERNAL_IMPORT_IMPLEMENTATION.md)
**API Reference**: [POST /api/forge/external-import](#api-endpoint)
**Tests**: `/tests/e2e/external-import-flow.spec.ts`
**Contact**: forge@eventfoundry.com

---

**Implementation Status**: ✅ Production Ready
**Last Updated**: February 7, 2026
**Maintainer**: EventFoundry Dev Team
