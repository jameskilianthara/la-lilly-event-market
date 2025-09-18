# Event Marketplace MVP

A comprehensive event planning platform that connects event organizers with vendors through an intelligent bidding system, built with Next.js App Router and Supabase Postgres.

## Environment Setup (2 minutes)
1) Copy the example file and edit locally:
   ```bash
   cp .env.local.example .env.local
   ```
2) In Supabase Dashboard → Settings → API:
   - Copy **Project URL** into `NEXT_PUBLIC_SUPABASE_URL` (no trailing slash)
   - Copy **service_role** key into `SUPABASE_SERVICE_ROLE_KEY` (server-only; do NOT prefix with NEXT_PUBLIC_)
3) Save `.env.local`, then restart:
   ```bash
   npm run dev
   ```
4) Verify:
   - `curl http://localhost:3000/api/health` → ok:true
   - `curl http://localhost:3000/api/events/33333333-3333-3333-3333-333333333333` → no "Invalid API key"

**Security note**:
- `.env.local` is git-ignored.
- Never log or expose the service role key.
- Import `supabaseAdmin` only in server routes under `app/api/**`.

## What's Included So Far

- **Database Schema**: Complete PostgreSQL migration with 5 core tables (vendors, events, event_services, bids, event_timeline)
- **Seed Data**: Production-ready sample data with fixed UUIDs for testing
- **TypeScript Types**: Full type definitions aligned with Supabase return formats
- **Zod Validation**: Input validation schemas with coercion for forms and APIs
- **Next.js API Routes**: RESTful endpoints using App Router API routes

## Technology Stack

- **Next.js 14+**: React framework with App Router
- **Supabase**: PostgreSQL database with real-time features
- **TypeScript**: Type-safe development
- **Zod**: Schema validation and type inference
- **Tailwind CSS**: Utility-first styling

## Environment Setup

### Required Environment Variables

Create `.env.local` in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key-here
```

**⚠️ SECURITY WARNINGS**:
- Never prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_` - it has admin privileges and should only be used server-side
- Never log or expose the service role key in client-side code or browser console
- Never commit `.env.local` to version control - add it to `.gitignore`

### Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization, enter project name
   - Wait for setup to complete (usually 1-2 minutes)

2. **Get Your Credentials**
   - Go to Settings → API
   - Copy "Project URL" → use as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy "service_role" key (not anon key!) → use as `SUPABASE_SERVICE_ROLE_KEY`

3. **Run Database Migration**
   - Go to SQL Editor in Supabase dashboard
   - Create new query
   - Copy entire contents of `database/migrations/0001_init.sql`
   - Click "Run" (bottom right)
   - Verify no errors in results panel

4. **Run Seed Data**
   - Create another new query in SQL Editor
   - Copy entire contents of `database/seeds/seed_mvp.sql`
   - Click "Run"
   - Go to Table Editor to verify data was inserted

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at: **http://localhost:3000**

## Using the Event Page

The event page at `/events/[id]` provides a complete interface for managing bids and event workflow.

### Bid Management

1. **View Event Details**
   - Navigate to: `http://localhost:3000/events/33333333-3333-3333-3333-333333333333`
   - See event information, services, bids, and timeline
   - Toggle "Comparison mode" to view lowest bids across services

2. **Shortlist Bids**
   - Click "Shortlist" on submitted bids
   - Status changes to 'shortlisted'
   - Timeline entry added: "Bid shortlisted"
   - Optimistic UI updates with server sync

3. **Award Bids**
   - Click "Award" on submitted or shortlisted bids
   - Chosen bid status → 'awarded'
   - All other bids for same service → 'declined'
   - Timeline entry added: "Bid awarded"

4. **Mark RFQ Sent**
   - Use "Mark RFQ Sent" button with optional custom label
   - Example: "RFQ sent to 5 vendors"
   - Adds timeline entry with 'rfq_sent' kind
   - Tracks communication history

### Accessibility Features

- **Screen Reader Support**: Buttons include vendor name and amount in aria-labels
- **Loading States**: "Working..." text and aria-busy during API calls
- **Error Handling**: Friendly error messages with auto-dismiss
- **Focus Management**: Returns focus to buttons after actions complete
- **Live Updates**: Status changes announced via aria-live regions

## Vendor Onboarding

The vendor registration page at `/vendor` allows service providers to join the platform.

### Access the Form

Visit: **http://localhost:3000/vendor**

### Required Fields

- **Business Name** (`name`) - Your company/organization name
- **Email Address** (`email`) - Primary contact email (must be unique)

### Optional Fields

- **Contact Person** (`contact_person`) - Primary contact name
- **Phone Number** (`phone`) - Business contact with country code
- **City** (`city`) - Primary operating location
- **Service Categories** (`categories`) - Comma-separated list (e.g., "catering, decoration, photography")
- **Price Range** (`min_price`, `max_price`) - Service pricing in ₹
- **Business Description** (`description`) - About your services and expertise

### File Uploads (Optional)

If `NEXT_PUBLIC_SUPABASE_ANON_KEY` is configured, vendors can upload sketches/attachments:

#### Setup Storage Bucket

1. **Create Storage Bucket**
   ```sql
   -- Run in Supabase SQL Editor
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('vendor_uploads', 'vendor_uploads', false);
   ```

2. **Set Storage Policies**
   ```sql
   -- Allow authenticated uploads to vendor_uploads bucket
   CREATE POLICY "Allow vendor uploads" ON storage.objects
     FOR INSERT WITH CHECK (
       bucket_id = 'vendor_uploads' AND
       auth.role() = 'authenticated'
     );
   
   -- Allow vendors to read their own uploads
   CREATE POLICY "Allow vendor downloads" ON storage.objects
     FOR SELECT USING (
       bucket_id = 'vendor_uploads' AND
       (storage.foldername(name))[1] = auth.uid()::text
     );
   ```

3. **Add Anon Key to Environment**
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

#### File Upload Features

- **File Types**: Images (JPG, PNG, GIF, WebP) and PDF
- **Size Limit**: 5MB maximum
- **Storage Path**: `vendor_uploads/{vendorId}/{timestamp-filename}`
- **Progress Tracking**: Real-time upload progress bar
- **Validation**: Client-side type and size checking
- **Success Feedback**: Confirmation with uploaded filename

### Form Validation

- **Client-side**: Real-time validation with Zod schemas
- **Server-side**: API validation with structured error responses
- **Accessibility**: Error summary with links to invalid fields
- **Focus Management**: First invalid field receives focus
- **Visual Indicators**: Red borders and error messages for invalid fields

### Success Flow

1. **Form Submission**: Creates vendor record via POST `/api/vendors`
2. **Success Panel**: Shows generated vendor ID
3. **File Upload**: Optional sketch/attachment upload (if configured)
4. **Create Another**: Button to reset form for additional vendors

## API Testing with Curl

Use these commands to test your database setup. All examples use the seeded UUIDs from `seed_mvp.sql`:

### 1. Create a New Vendor

```bash
curl -X POST http://localhost:3000/api/vendors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Catering Co",
    "email": "test@catering.com",
    "contact_person": "John Doe",
    "phone": "+91-99999-88888",
    "city": "Bangalore",
    "categories": ["catering", "food"],
    "description": "Professional catering services",
    "min_price": 30000,
    "max_price": 300000
  }'
```

### 2. Create a New Event

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Corporate Annual Meeting 2025",
    "description": "Company annual meeting with 100 attendees",
    "event_date": "2025-12-15T10:00:00Z",
    "city": "Mumbai",
    "status": "published"
  }'
```

### 3. Add Service to Existing Event

**Note**: The `event_id` in the request body must match the EVENT_ID in the URL path.

```bash
curl -X POST http://localhost:3000/api/events/33333333-3333-3333-3333-333333333333/services \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "33333333-3333-3333-3333-333333333333",
    "main_category": "decoration",
    "subcategory": "flowers",
    "details": "Fresh flower arrangements for stage and tables"
  }'
```

### 4. Submit a Bid

```bash
curl -X POST http://localhost:3000/api/bids \
  -H "Content-Type: application/json" \
  -d '{
    "event_service_id": "44444444-4444-4444-4444-444444444444",
    "vendor_id": "11111111-1111-1111-1111-111111111111",
    "amount": 75000,
    "currency": "INR",
    "notes": "Premium lunch package with dedicated service staff",
    "status": "submitted"
  }'
```

### 5. Shortlist a Bid

```bash
curl -X POST http://localhost:3000/api/bids/{BID_ID}/shortlist
```

### 6. Award a Bid

```bash
curl -X POST http://localhost:3000/api/bids/{BID_ID}/award
```

### 7. Mark RFQ Sent

```bash
curl -X POST http://localhost:3000/api/events/{EVENT_ID}/rfq \
  -H "Content-Type: application/json" \
  -d '{"label":"RFQ sent to 5 vendors"}'
```

## Manual Test Checklist

### Database Functionality Test

1. **Verify Seeded Data**
   - Go to Supabase → Table Editor
   - Check each table has data: `vendors`, `events`, `event_services`, `bids`, `event_timeline`
   - Confirm vendor emails are unique
   - Verify foreign key relationships work

2. **Test CRUD Operations**
   - [ ] Create new vendor using API curl command above
   - [ ] Create new event with future date using API curl command
   - [ ] Add service to event using API curl command
   - [ ] Submit bid for service using API curl command
   - [ ] Verify `updated_at` triggers work (edit any vendor/event record in Table Editor)

3. **Test Database Constraints**
   - [ ] Try duplicate vendor email → should fail with unique constraint error
   - [ ] Try negative bid amount → should fail with check constraint error
   - [ ] Try invalid event status → should fail with enum constraint error
   - [ ] Try min_price > max_price → should fail with check constraint error

### Frontend UI Testing

1. **Event Page Testing**
   - [ ] Visit event page: http://localhost:3000/events/33333333-3333-3333-3333-333333333333
   - [ ] Verify event details display correctly
   - [ ] Check service list shows seeded services
   - [ ] Confirm bid table displays existing bids
   - [ ] Test "Shortlist" button → status changes, timeline updates
   - [ ] Test "Award" button → chosen bid awarded, others declined
   - [ ] Test "Mark RFQ Sent" → custom label appears in timeline
   - [ ] Toggle "Comparison mode" → lowest bids highlighted

2. **Vendor Registration Testing**
   - [ ] Visit vendor page: http://localhost:3000/vendor
   - [ ] Submit empty form → should show Zod validation errors with error summary
   - [ ] Submit invalid email → should show email format error
   - [ ] Submit duplicate email → should show EMAIL_EXISTS error
   - [ ] Submit valid form → should succeed and show success panel with vendor ID
   - [ ] Test "Create Another" button → should reset form
   - [ ] If file upload enabled: test file validation (size, type limits)
   - [ ] If file upload enabled: test successful upload with progress bar

3. **Accessibility Testing**
   - [ ] Navigate with keyboard only → all interactive elements accessible
   - [ ] Test screen reader announcements → status changes announced
   - [ ] Verify error focus management → first invalid field receives focus
   - [ ] Check aria-labels on buttons → include vendor name and amounts

## Troubleshooting

### Common Issues

**"relation already exists" Error**
- **Cause**: You've run the migration twice
- **Solution**: Drop tables manually in Supabase SQL Editor or create fresh project

**"extension uuid-ossp does not exist"**  
- **Cause**: Supabase uses `pgcrypto` instead of `uuid-ossp`
- **Solution**: Replace `uuid_generate_v4()` with `gen_random_uuid()` in migration if needed

**Seed Data Duplicates**
- **Status**: Seeds are idempotent and truncate tables first
- **Solution**: Safe to run multiple times; if errors persist, check foreign key constraints

**"permission denied for table" Error**
- **Cause**: Using wrong API key or RLS policies blocking access
- **Solution**: Ensure using `service_role` key, not `anon` key; verify environment variables

**Service Role Key Leak Warning**
- **Prevention**: Never commit `.env.local` to git; add to `.gitignore`
- **If Exposed**: Regenerate key in Supabase Settings → API immediately
- **Detection**: Never log service key; avoid client-side code access

**Port 3000 Already in Use**
- **Solution**: Kill existing Next.js process: `lsof -ti:3000 | xargs kill -9`
- **Alternative**: Use different port: `PORT=3001 npm run dev`

**API Route Not Found (404)**
- **Cause**: API route file not in correct `app/api/` directory structure
- **Solution**: Ensure routes follow Next.js App Router conventions

**Build Errors with TypeScript**
- **Cause**: Type mismatches or missing dependencies
- **Solution**: Run `npm run type-check` to identify issues; install missing `@types/` packages

### Database Verification Queries

Run these in Supabase SQL Editor to verify everything works:

```sql
-- Check all tables have data
SELECT 'vendors' as table_name, count(*) as records FROM vendors
UNION ALL
SELECT 'events', count(*) FROM events
UNION ALL
SELECT 'event_services', count(*) FROM event_services
UNION ALL
SELECT 'bids', count(*) FROM bids
UNION ALL
SELECT 'event_timeline', count(*) FROM event_timeline;

-- Test updated_at trigger
UPDATE vendors SET name = name || ' (Updated)' WHERE id = '11111111-1111-1111-1111-111111111111';
SELECT name, updated_at FROM vendors WHERE id = '11111111-1111-1111-1111-111111111111';

-- Verify foreign key relationships
SELECT 
    e.title,
    es.main_category,
    b.amount,
    v.name as vendor_name
FROM events e
JOIN event_services es ON e.id = es.event_id
JOIN bids b ON es.id = b.event_service_id
JOIN vendors v ON b.vendor_id = v.id;
```

## Project Structure

```
event-marketplace/
├── app/
│   ├── api/
│   │   ├── vendors/route.ts          # POST /api/vendors
│   │   ├── events/route.ts           # POST /api/events  
│   │   ├── events/[id]/
│   │   │   ├── route.ts              # GET /api/events/[id]
│   │   │   ├── services/route.ts     # POST /api/events/[id]/services
│   │   │   └── rfq/route.ts          # POST /api/events/[id]/rfq
│   │   ├── bids/
│   │   │   ├── route.ts              # POST /api/bids
│   │   │   └── [id]/
│   │   │       ├── shortlist/route.ts # POST /api/bids/[id]/shortlist
│   │   │       └── award/route.ts     # POST /api/bids/[id]/award
│   │   └── health/route.ts           # GET /api/health
│   ├── events/[id]/page.tsx          # Event management interface
│   ├── vendor/page.tsx               # Vendor registration form
│   ├── page.tsx                      # Homepage
│   └── layout.tsx                    # Root layout
├── database/
│   ├── migrations/
│   │   └── 0001_init.sql         # Database schema
│   └── seeds/
│       └── seed_mvp.sql          # Sample data
├── src/
│   ├── types/db.ts               # Database type definitions
│   ├── lib/
│   │   ├── validation.ts         # Zod schemas for forms and APIs
│   │   ├── ui.ts                 # UI utilities (formatINR, StatusBadge)
│   │   ├── fetcher.ts            # API request helpers (apiPost)
│   │   └── supabaseBrowser.ts    # Client-side Supabase instance
└── .env.local                    # Environment variables (gitignored)
```

## Next Steps

1. **Authentication**: Implement Supabase Auth with Row Level Security (RLS) policies
2. **Vendor Dashboard**: Build dashboard for vendors to view events and submit bids
3. **Event Listing**: Create public event browsing interface
4. **Real-time Updates**: Implement Supabase subscriptions for live bidding updates
5. **Email Notifications**: Send updates for RFQs, bid status changes
6. **Advanced Search**: Filter events by category, location, date range
7. **Payment Integration**: Add payment processing for awarded bids
8. **Deployment**: Deploy to Vercel with environment variable configuration

## Support

- Check `docs/QA-RFQ-Bidding.md` for detailed testing procedures
- Review error logs in browser console and terminal
- Verify environment variables are correctly set in `.env.local`
- Confirm Supabase project is active and accessible
- Ensure database migration and seeds ran successfully