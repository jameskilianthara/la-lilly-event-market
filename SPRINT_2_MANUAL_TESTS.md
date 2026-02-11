# Sprint 2 Manual Testing Checklist

## Test 1: Client Signup & Login Flow

### Steps:
1. Open http://localhost:3000
2. Click "Plan an Event" or "Forge My Event"
3. If not logged in, should redirect to signup
4. Create a **client** account:
   - Email: `test-client@example.com`
   - Password: `TestPass123!`
   - Account Type: **Client** (NOT Vendor)
5. Verify email confirmation (if required)
6. Login with credentials

### Success Criteria:
- ✅ Signup completes without errors
- ✅ Login successful
- ✅ Redirected back to `/forge` page
- ✅ Welcome banner shows "Welcome back, [name]!"

---

## Test 2: Complete "Forge My Event" Flow

### Steps:
1. Navigate to http://localhost:3000/forge (must be logged in)
2. Answer the 5 questions:
   - **Q1 - Event Type:** "Wedding"
   - **Q2 - Date:** "June 15, 2025"
   - **Q3 - City:** "Mumbai"
   - **Q4 - Guest Count:** "200"
   - **Q5 - Venue Status:** "Not yet booked"
3. After Q5, system should create event automatically
4. Check for completion message and "Customize Your Event Checklist →" button

### Success Criteria:
- ✅ All 5 questions appear in sequence
- ✅ Chat responses feel natural
- ✅ After Q5, event is created
- ✅ Success message with checklist link appears
- ✅ No console errors in browser DevTools

---

## Test 3: Verify Event in Database

### Steps:
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/ikfawcbcapmfpzwbqccr
2. Go to "Table Editor" → `events`
3. Look for the most recent event

### Success Criteria:
- ✅ Event row exists with correct data:
  - `title`: Should contain event type + date
  - `event_type`: "Wedding"
  - `city`: "Mumbai"
  - `guest_count`: 200
  - `client_brief`: JSON with all 5 answers
  - `forge_status`: "BLUEPRINT_READY"
  - `owner_user_id`: Your test client's user ID

### SQL Query to Check:
```sql
SELECT
  id,
  title,
  event_type,
  city,
  guest_count,
  forge_status,
  created_at
FROM events
WHERE owner_user_id = (
  SELECT id FROM users WHERE email = 'test-client@example.com'
)
ORDER BY created_at DESC
LIMIT 1;
```

---

## Test 4: Vendor Can See Events

### Steps:
1. Logout of client account
2. Login as a **vendor** account (or create one):
   - Email: `test-vendor@example.com`
   - Account Type: **Vendor**
3. Navigate to vendor dashboard: http://localhost:3000/craftsmen/dashboard
4. Check if the event you created appears in "Available Events" or similar section

### Success Criteria:
- ✅ Vendor dashboard loads
- ✅ Event created by client is visible
- ✅ Event shows key details (type, date, city, guest count)
- ✅ "Submit Bid" or "View Details" button exists

---

## Test 5: Vendor Can Submit Bid

### Steps:
1. From vendor dashboard, click on the event
2. Click "Submit Bid" or "Create Proposal"
3. Fill out bid form:
   - **Services:** "Full Event Management"
   - **Estimated Cost:** ₹350,000
   - **Notes:** "We specialize in luxury weddings..."
4. Submit the bid

### Success Criteria:
- ✅ Bid form loads correctly
- ✅ Form validation works
- ✅ Bid submits successfully
- ✅ Success message appears
- ✅ Bid appears in `bids` table in Supabase

### SQL Query to Check:
```sql
SELECT
  id,
  forge_project_id,
  craftsman_id,
  total_forge_cost,
  status,
  created_at
FROM bids
ORDER BY created_at DESC
LIMIT 5;
```

---

## Test 6: Client Can Review Bids

### Steps:
1. Logout of vendor account
2. Login back as client (`test-client@example.com`)
3. Navigate to "My Events" or similar section
4. Click on the wedding event you created
5. Look for "Bids" or "Proposals" section

### Success Criteria:
- ✅ Client can see their event
- ✅ Submitted bid appears in bid list
- ✅ Bid shows vendor name, cost, status
- ✅ Client can view bid details
- ✅ "Accept" or "Shortlist" buttons exist

---

## Known Issues to Watch For:

1. **Auth Redirect Loop:** If redirected back to login after successful login, check cookies/localStorage
2. **Event Not Appearing:** Check if RLS policies allow vendors to read events
3. **Bid Submission Fails:** Check if vendor profile is complete
4. **No Bids Showing:** Check RLS policies on bids table

---

## Quick Test Commands:

```bash
# Check if events are being created
curl -s "http://localhost:3000/api/forge/projects" | jq '.'

# Check vendor count
curl -s "http://localhost:3000/api/vendors" | jq '.count'

# View recent events in database (needs psql)
PGPASSWORD="Blackflames007" psql -h "db.ikfawcbcapmfpzwbqccr.supabase.co" -U postgres -d postgres -c "SELECT id, title, event_type, city, forge_status FROM events ORDER BY created_at DESC LIMIT 5;"
```

---

## Next Steps After All Tests Pass:

1. ✅ Screenshot the complete flow
2. ✅ Test on mobile (responsive check)
3. ✅ Add 2-3 more test bids
4. ✅ Test "Accept Bid" → Contract Generation
5. ✅ Move to Sprint 3 (Polish & Launch Prep)
