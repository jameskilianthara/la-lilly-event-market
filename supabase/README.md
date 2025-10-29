# EventFoundry Supabase Setup

## Quick Start

### 1. Apply Database Schema

Go to your Supabase project: https://app.supabase.com/project/ikfawcbcapmfpzwbqccr

Navigate to **SQL Editor** and run the contents of `schema.sql`

This will create all tables, indexes, RLS policies, and functions.

### 2. Verify Tables Created

In **Table Editor**, you should see:
- users
- vendors
- events
- bids
- contracts
- payments
- reviews
- messages

### 3. Test Connection

The application is already configured with your Supabase credentials in `.env.local`:
- URL: https://ikfawcbcapmfpzwbqccr.supabase.co
- Anon Key: (configured)

### 4. Enable Authentication

In **Authentication > Providers**, enable:
- Email/Password (for basic auth)
- Google (optional - for social login)

## Database Schema Overview

### Core Tables

**users** - User accounts (extends Supabase auth)
- Links to auth.users
- Stores user_type (client/vendor/admin)
- Basic profile info

**vendors** - Craftsmen/service provider profiles
- Company details, specialties, certifications
- Portfolio, ratings, verification status
- Links to users table

**events** - Client event projects (Forge Projects)
- Event details, requirements, blueprints
- Status tracking (BLUEPRINT_READY → COMPLETED)
- Bidding window management

**bids** - Vendor proposals (Craft Proposals)
- Itemized pricing, attachments, notes
- Status: DRAFT → SUBMITTED → SHORTLISTED → ACCEPTED
- One bid per vendor per event

**contracts** - Signed agreements (Forge Commissions)
- Links event, bid, vendor, client
- Contract JSON, PDF, signatures
- Payment milestones

**payments** - Transaction records
- Links to contracts
- Tracks deposits, milestones, final payments
- Payment gateway integration ready

**reviews** - Client feedback on vendors
- 1-5 star ratings
- Text reviews with vendor responses
- Images support

**messages** - Client-vendor communication
- Event-specific messaging
- Attachments support
- Read receipts

### Security (RLS Policies)

All tables have Row Level Security enabled:
- Users can only view/edit their own data
- Vendors see open events they can bid on
- Clients see their events and all bids received
- Contract parties see their own contracts
- Reviews are public, messages are private

### Indexes

Optimized indexes for:
- User lookups by email and type
- Vendor searches by city and specialties
- Event queries by status and date
- Bid and contract relationships

## Next Steps

1. **Run the schema.sql** in Supabase SQL Editor
2. **Enable Email Auth** in Authentication settings
3. **Test the connection** - app should connect automatically
4. **Create test accounts** to verify signup/login flow
5. **Replace localStorage calls** with Supabase queries in the codebase

## Migration Path

Current localStorage → Supabase migration:

1. **Auth Context** - Replace mock auth with Supabase Auth
2. **Vendor Data** - Move vendor profiles to vendors table
3. **Events** - Store events in database instead of localStorage
4. **Bids** - Persist bids to bids table
5. **Contracts** - Generate and store contracts in database

All data will persist across:
- Browser sessions
- Deployments
- Multiple devices
- User authentication states
