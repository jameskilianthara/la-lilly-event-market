# Row Level Security (RLS) Testing Guide

## Overview

This guide provides comprehensive tests for EventFoundry's Row Level Security policies to ensure proper data isolation and access control.

## Prerequisites

- Schema applied to Supabase
- At least 2 test users created:
  - Test Client (user_type: 'client')
  - Test Vendor (user_type: 'vendor')

## Test Setup

### Create Test Users

Use Supabase Dashboard or Auth API:

1. **Test Client**
   - Email: `client@test.eventfoundry.com`
   - Password: `TestClient123!`
   - User Type: `client`

2. **Test Vendor**
   - Email: `vendor@test.eventfoundry.com`
   - Password: `TestVendor123!`
   - User Type: `vendor`

### Create Test Data

Run as authenticated test vendor:

```sql
-- Insert vendor profile
INSERT INTO public.vendors (user_id, company_name, city, specialties, verified)
VALUES (
  'VENDOR_USER_ID',
  'Test Event Company',
  'Mumbai',
  ARRAY['weddings', 'corporate'],
  true
);
```

Run as authenticated test client:

```sql
-- Insert test event
INSERT INTO public.events (
  owner_user_id,
  title,
  event_type,
  city,
  guest_count,
  client_brief,
  forge_blueprint,
  forge_status
)
VALUES (
  'CLIENT_USER_ID',
  'Test Wedding Event',
  'wedding',
  'Mumbai',
  200,
  '{"theme": "traditional", "budget": "500000"}'::jsonb,
  '{"sections": []}'::jsonb,
  'OPEN_FOR_BIDS'
);
```

## Test Cases

### 1. Users Table - Profile Privacy

#### Test 1.1: Users can view own profile
```typescript
// As authenticated user
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', currentUserId);

// Expected: Success, returns own user data
```

#### Test 1.2: Users cannot view other profiles
```typescript
// As authenticated user
const { data, error } = await supabase
  .from('users')
  .select('*')
  .neq('id', currentUserId);

// Expected: Empty array (RLS blocks other users)
```

#### Test 1.3: Users can update own profile
```typescript
const { data, error } = await supabase
  .from('users')
  .update({ full_name: 'Updated Name' })
  .eq('id', currentUserId);

// Expected: Success
```

#### Test 1.4: Users cannot update other profiles
```typescript
const { data, error } = await supabase
  .from('users')
  .update({ full_name: 'Hacked Name' })
  .eq('id', otherUserId);

// Expected: Error or no rows affected
```

**✅ PASS CRITERIA:**
- Own profile visible and editable
- Other profiles completely hidden

---

### 2. Vendors Table - Public & Private Access

#### Test 2.1: Anyone can view verified vendors
```typescript
// As any user (even unauthenticated)
const { data, error } = await supabase
  .from('vendors')
  .select('*')
  .eq('verified', true);

// Expected: Success, returns all verified vendors
```

#### Test 2.2: Vendor can view own profile (even unverified)
```typescript
// As authenticated vendor
const { data, error } = await supabase
  .from('vendors')
  .select('*')
  .eq('user_id', currentVendorUserId);

// Expected: Success, returns own vendor profile
```

#### Test 2.3: Vendor can update own profile
```typescript
// As authenticated vendor
const { data, error } = await supabase
  .from('vendors')
  .update({ description: 'Updated description' })
  .eq('user_id', currentVendorUserId);

// Expected: Success
```

#### Test 2.4: Vendor cannot view unverified competitors
```typescript
// As authenticated vendor A
const { data, error } = await supabase
  .from('vendors')
  .select('*')
  .eq('verified', false)
  .neq('user_id', currentVendorUserId);

// Expected: Empty array
```

**✅ PASS CRITERIA:**
- Verified vendors visible to everyone
- Unverified vendors only visible to themselves
- Vendors can edit own profiles only

---

### 3. Events Table - Client Privacy & Vendor Discovery

#### Test 3.1: Client can view own events
```typescript
// As authenticated client
const { data, error } = await supabase
  .from('events')
  .select('*')
  .eq('owner_user_id', currentClientUserId);

// Expected: Success, returns all own events
```

#### Test 3.2: Client cannot view other clients' events
```typescript
// As authenticated client A
const { data, error } = await supabase
  .from('events')
  .select('*')
  .neq('owner_user_id', currentClientUserId);

// Expected: Empty array or only open events
```

#### Test 3.3: Vendors can view open events
```typescript
// As authenticated vendor
const { data, error } = await supabase
  .from('events')
  .select('*')
  .in('forge_status', ['OPEN_FOR_BIDS', 'CRAFTSMEN_BIDDING']);

// Expected: Success, returns all open events
```

#### Test 3.4: Vendors cannot view closed/private events
```typescript
// As authenticated vendor
const { data, error } = await supabase
  .from('events')
  .select('*')
  .eq('forge_status', 'BLUEPRINT_READY');

// Expected: Empty array
```

#### Test 3.5: Client can update own events
```typescript
// As authenticated client
const { data, error } = await supabase
  .from('events')
  .update({ forge_status: 'OPEN_FOR_BIDS' })
  .eq('id', ownEventId);

// Expected: Success
```

**✅ PASS CRITERIA:**
- Clients see only their own events
- Vendors see only open events
- No cross-client data leakage

---

### 4. Bids Table - Isolated Proposals

#### Test 4.1: Vendor can view own bids
```typescript
// As authenticated vendor
const { data, error } = await supabase
  .from('bids')
  .select('*')
  .eq('vendor_id', currentVendorId);

// Expected: Success, returns all own bids
```

#### Test 4.2: Vendor cannot view competitor bids
```typescript
// As authenticated vendor A
const { data, error } = await supabase
  .from('bids')
  .select('*')
  .neq('vendor_id', currentVendorId);

// Expected: Empty array (closed bidding)
```

#### Test 4.3: Client can view bids on own events
```typescript
// As authenticated client
const { data, error } = await supabase
  .from('bids')
  .select('*')
  .eq('event_id', ownEventId);

// Expected: Success, returns all bids for own event
```

#### Test 4.4: Client cannot view bids on other events
```typescript
// As authenticated client A
const { data, error } = await supabase
  .from('bids')
  .select('*')
  .eq('event_id', otherClientEventId);

// Expected: Empty array
```

#### Test 4.5: Vendor can create bid
```typescript
// As authenticated vendor
const { data, error } = await supabase
  .from('bids')
  .insert({
    event_id: openEventId,
    vendor_id: currentVendorId,
    forge_items: {},
    subtotal: 100000,
    total_forge_cost: 118000,
    status: 'SUBMITTED'
  });

// Expected: Success
```

#### Test 4.6: Vendor can update own bid
```typescript
// As authenticated vendor
const { data, error } = await supabase
  .from('bids')
  .update({ subtotal: 110000, total_forge_cost: 129800 })
  .eq('id', ownBidId);

// Expected: Success
```

**✅ PASS CRITERIA:**
- Complete bid isolation (closed bidding)
- Vendors see only own bids
- Clients see all bids on their events

---

### 5. Contracts Table - Two-Party Access

#### Test 5.1: Client can view own contracts
```typescript
// As authenticated client
const { data, error } = await supabase
  .from('contracts')
  .select('*')
  .eq('client_id', currentClientUserId);

// Expected: Success, returns all own contracts
```

#### Test 5.2: Vendor can view own contracts
```typescript
// As authenticated vendor
const { data, error } = await supabase
  .from('contracts')
  .select('*')
  .eq('vendor_id', currentVendorId);

// Expected: Success, returns all own contracts
```

#### Test 5.3: Third parties cannot view contracts
```typescript
// As authenticated vendor B (not party to contract)
const { data, error } = await supabase
  .from('contracts')
  .select('*')
  .eq('id', contractBetweenVendorAAndClient);

// Expected: Empty array
```

**✅ PASS CRITERIA:**
- Only contract parties can view contracts
- Complete privacy from third parties

---

### 6. Payments Table - Contract-Based Access

#### Test 6.1: Client can view payments on own contracts
```typescript
// As authenticated client
const { data, error } = await supabase
  .from('payments')
  .select('*')
  .eq('contract_id', ownContractId);

// Expected: Success
```

#### Test 6.2: Vendor can view payments on own contracts
```typescript
// As authenticated vendor
const { data, error } = await supabase
  .from('payments')
  .select('*')
  .eq('contract_id', ownContractId);

// Expected: Success
```

#### Test 6.3: Third parties cannot view payments
```typescript
// As authenticated user (not party to contract)
const { data, error } = await supabase
  .from('payments')
  .select('*')
  .eq('contract_id', otherContractId);

// Expected: Empty array
```

**✅ PASS CRITERIA:**
- Payment visibility matches contract access
- No payment data leakage

---

### 7. Reviews Table - Public Access

#### Test 7.1: Anyone can view reviews (public)
```typescript
// As unauthenticated user
const { data, error } = await supabase
  .from('reviews')
  .select('*')
  .eq('vendor_id', anyVendorId);

// Expected: Success, returns all reviews
```

#### Test 7.2: Client can create review
```typescript
// As authenticated client
const { data, error } = await supabase
  .from('reviews')
  .insert({
    contract_id: completedContractId,
    vendor_id: vendorId,
    client_id: currentClientUserId,
    rating: 5,
    review_text: 'Excellent service!'
  });

// Expected: Success
```

#### Test 7.3: Vendor can respond to own reviews
```typescript
// As authenticated vendor
const { data, error } = await supabase
  .from('reviews')
  .update({ response_text: 'Thank you for the feedback!' })
  .eq('id', reviewId)
  .eq('vendor_id', currentVendorId);

// Expected: Success
```

**✅ PASS CRITERIA:**
- Reviews publicly visible
- Only clients create reviews
- Only vendors respond to own reviews

---

### 8. Messages Table - Private Communication

#### Test 8.1: User can view own sent messages
```typescript
// As authenticated user
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .eq('sender_id', currentUserId);

// Expected: Success
```

#### Test 8.2: User can view own received messages
```typescript
// As authenticated user
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .eq('receiver_id', currentUserId);

// Expected: Success
```

#### Test 8.3: User cannot view other users' messages
```typescript
// As authenticated user C
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .eq('sender_id', userA)
  .eq('receiver_id', userB);

// Expected: Empty array
```

#### Test 8.4: User can send message
```typescript
// As authenticated user
const { data, error } = await supabase
  .from('messages')
  .insert({
    event_id: eventId,
    sender_id: currentUserId,
    receiver_id: recipientUserId,
    message_text: 'Hello!'
  });

// Expected: Success
```

**✅ PASS CRITERIA:**
- Users see only own messages (sent/received)
- No third-party access to conversations

---

## Automated Test Script

Save as `tests/rls-policies.test.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

describe('RLS Policies', () => {
  let clientUser: any;
  let vendorUser: any;

  beforeAll(async () => {
    // Create test users and data
  });

  describe('Vendors Table', () => {
    it('should allow viewing verified vendors', async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('verified', true);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    // Add more tests...
  });

  afterAll(async () => {
    // Cleanup test data
  });
});
```

## Common RLS Issues

### Issue: Policy too restrictive
**Symptom:** Legitimate queries return empty
**Solution:** Check policy logic in `schema.sql`, especially EXISTS clauses

### Issue: Policy too permissive
**Symptom:** Users see data they shouldn't
**Solution:** Add stricter conditions (AND clauses)

### Issue: Performance degradation
**Symptom:** Slow queries with RLS
**Solution:** Ensure proper indexes on filtered columns

## RLS Policy Summary

| Table | Client Access | Vendor Access | Public Access |
|-------|---------------|---------------|---------------|
| users | Own profile | Own profile | None |
| vendors | View verified | Own + verified | Verified only |
| events | Own events | Open events | None |
| bids | Bids on own events | Own bids | None |
| contracts | Own contracts | Own contracts | None |
| payments | Via own contracts | Via own contracts | None |
| reviews | Own reviews | Own reviews | All reviews |
| messages | Sent/received | Sent/received | None |

## Security Checklist

- [ ] All tables have RLS enabled
- [ ] No data visible without authentication (except public data)
- [ ] Vendors cannot see competitor bids
- [ ] Clients cannot see other clients' events
- [ ] Contracts only visible to parties
- [ ] Messages completely private
- [ ] Reviews publicly accessible
- [ ] Verified vendors publicly visible
- [ ] Update policies restrict to owners
- [ ] Insert policies enforce ownership

## Support

For RLS policy issues:
1. Review `supabase/schema.sql` policies
2. Test with SQL queries in Supabase SQL Editor
3. Check Supabase logs for policy violations
4. Verify `auth.uid()` returns expected user ID
