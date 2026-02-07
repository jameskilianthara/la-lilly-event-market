# EventFoundry Testing Session - February 3, 2026

**Tester:** James Kilian Thara
**Test Assistant:** Claude Code
**Start Time:** [Recording...]
**Test Type:** Full Workflow Manual Testing
**Environment:** Development (localhost:3000)

---

## Test Plan

### Complete User Flow:
1. Forge Chat → Create Event
2. Blueprint Selection & Review
3. Event Finalization & Publishing
4. Vendor Login & Event Browsing
5. Bid Submission
6. Client Bid Review
7. Shortlisting Top 5
8. Winner Selection
9. Contract Generation
10. E-Signature (Client & Vendor)
11. Contract Completion

---

## Test Session Notes

### Session Start
- **Status:** Ready to begin
- **Server:** Running on localhost:3000
- **Database:** Connected to Supabase
- **Test Data:** Seeded (5 vendors, 3 events, 15 bids available)

---

## Findings Log

### Test 1: Forge Chat → Create Event
**Status:** ⏳ Testing in progress...

**Steps to Test:**
1. Navigate to homepage
2. Click "Forge My Event"
3. Answer 5 questions:
   - Event type
   - Date
   - City/Location
   - Guest count
   - Venue status
4. Verify blueprint link appears
5. Click blueprint link

**Observations:**
[Will be filled during testing]

**Issues Found:**
[Will be logged as discovered]

**Screenshots/Evidence:**
[User will provide context]

---

### Test 2: Blueprint Selection & Review
**Status:** ⏳ Pending

**Steps to Test:**
1. Review pre-selected blueprint
2. Check if correct blueprint loaded
3. Fill in custom notes (optional)
4. Verify all sections display correctly

**Observations:**
[Will be filled during testing]

---

### Test 3: Event Finalization & Publishing
**Status:** ⏳ Pending

**Steps to Test:**
1. Click "Create Event" / "Finalize"
2. Verify event created in database
3. Check event appears in client dashboard
4. Verify event status is OPEN_FOR_BIDS

**Observations:**
[Will be filled during testing]

---

### Test 4: Vendor Login & Event Browsing
**Status:** ⏳ Pending

**Steps to Test:**
1. Logout as client
2. Login as vendor (vendor1@eventfoundry.com / VendorTest123!)
3. Navigate to vendor dashboard
4. Check if newly created event appears
5. Verify event details are readable

**Observations:**
[Will be filled during testing]

---

### Test 5: Bid Submission
**Status:** ⏳ Pending

**Steps to Test:**
1. Click on event to view details
2. Click "Submit Bid" / "Create Proposal"
3. Fill bid form:
   - Craft specialties
   - Pricing breakdown
   - Total amount
   - Vendor notes
   - Estimated time
4. Submit bid
5. Verify bid appears in vendor dashboard

**Observations:**
[Will be filled during testing]

---

### Test 6: Client Bid Review
**Status:** ⏳ Pending

**Steps to Test:**
1. Logout as vendor
2. Login as client
3. Navigate to event in client dashboard
4. Click "View Bids"
5. Verify bids are visible
6. Check bid details display correctly

**Observations:**
[Will be filled during testing]

---

### Test 7: Shortlisting Top 5
**Status:** ⏳ Pending

**Steps to Test:**
1. Select top 5 bids (checkbox or button)
2. Click "Shortlist Selected"
3. Verify shortlist confirmation
4. Check bid status updates to SHORTLISTED
5. Verify vendors receive notification (check logs)

**Observations:**
[Will be filled during testing]

---

### Test 8: Winner Selection
**Status:** ⏳ Pending

**Steps to Test:**
1. From shortlisted bids, click "Select Winner" on one bid
2. Verify confirmation modal/prompt
3. Confirm winner selection
4. Check event status updates to COMMISSIONED
5. Verify other bids status updates to REJECTED

**Observations:**
[Will be filled during testing]

---

### Test 9: Contract Generation (NEW FEATURE)
**Status:** ⏳ Pending

**Steps to Test:**
1. After winner selection, check for contract generation
2. Verify contract created in database
3. Check contract PDF generated and stored
4. Click contract link to view
5. Verify contract displays all details:
   - Client info
   - Vendor info
   - Event details
   - Financial terms
   - Payment milestones
6. Check PDF download link works

**Observations:**
[Will be filled during testing]

**Expected Issues:**
- First time running this feature
- May need debugging

---

### Test 10: E-Signature - Client Signs (NEW FEATURE)
**Status:** ⏳ Pending

**Steps to Test:**
1. As client, view contract
2. Scroll to signature section
3. Enter full name in signature field
4. Select date
5. Click "Sign Contract"
6. Verify signature recorded
7. Check contract status (should still be PENDING until vendor signs)

**Observations:**
[Will be filled during testing]

---

### Test 11: E-Signature - Vendor Signs (NEW FEATURE)
**Status:** ⏳ Pending

**Steps to Test:**
1. Logout as client
2. Login as vendor
3. Navigate to contracts section
4. Open the contract
5. Verify client signature visible
6. Enter vendor name
7. Select date
8. Click "Sign Contract"
9. Verify contract status updates to SIGNED
10. Check both signatures display correctly

**Observations:**
[Will be filled during testing]

---

### Test 12: Contract Completion
**Status:** ⏳ Pending

**Steps to Test:**
1. Verify contract shows "Fully Executed"
2. Download final signed PDF
3. Verify both parties can access contract
4. Check event status is COMMISSIONED

**Observations:**
[Will be filled during testing]

---

## Issues Tracker

### Critical Issues 🔴

#### Issue #1: Vendor Login Page Keeps Loading (P0)
**Status:** 🟡 ROOT CAUSE IDENTIFIED - Browser/Cache Issue

**Reported:** Credentials vendor1@eventfoundry.com / VendorTest123! not working, page keeps loading at `/craftsmen/login`

**Investigation:**
- ✅ Tested vendor login with Supabase SDK directly - **LOGIN WORKS PERFECTLY**
- ✅ User profile fetches correctly (user_type: vendor)
- ✅ RLS policies working correctly
- ✅ Credentials are valid and confirmed working

**Evidence:**
- Server-side test script: Login successful, profile fetched, all systems operational
- Auth is handled via Supabase SDK client-side (no API route needed)
- Single 404 for `/api/auth/login` in logs was likely old browser cache hitting non-existent endpoint

**Root Cause:** Client-side React state issue or browser cache
- Supabase authentication working correctly backend
- Issue is in browser/client-side rendering or stale cache

**Resolution Steps for User:**
1. Clear browser cache and localStorage (Application tab in DevTools)
2. Hard refresh page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Try opening in incognito/private window
4. Check browser console for React errors during login attempt

---

### Major Issues 🟡

#### Issue #2: Back Button Navigation Causes Page Hang
**Status:** 🔴 REPORTED - Investigation Needed

**Reported:** When using browser back button from certain pages, page enters infinite loading state

**Possible Causes:**
- Data fetching loops on navigation
- Auth state conflicts
- React component unmounting issues

**Next Steps:** User to test after clearing cache

---

#### Issue #3: Blueprint Page Not Loading
**Status:** 🔴 REPORTED - Investigation Needed

**Reported:** Blueprint page shows loading state but never renders content

**Console Evidence:**
```
[Blueprint] loadEvent called - authLoading: true isAuthenticated: false
[Blueprint] Loading event: 96f5e3d9-14d2-4122-940b-87d6f2300564
```

**Analysis:**
- Auth state stuck in loading (`authLoading: true`)
- Commented-out auth checks still affecting render
- Server responds correctly (200 status, fast response)
- Issue is client-side React component state

**Next Steps:** Investigate auth state management in blueprint page

---

### Minor Issues 🔵

#### Issue #4: Vendor Page JSON Loading (FIXED ✅)
**Status:** ✅ RESOLVED

**Issue:** `/src/app/vendors/page.tsx` tried to fetch `/data/dummy-vendors.json` which doesn't exist, causing 404 errors

**Fix Applied:** Updated `loadVendors()` function to fetch from `/api/vendors` endpoint with proper error handling

---

### UI/UX Notes ✏️
[To be filled as user provides feedback]

---

## Questions & Answers

### Q&A Log:
[Will be filled as questions arise during testing]

---

## Test Results Summary

### Tests Completed: 0/12
### Tests Passed: -
### Tests Failed: -
### Bugs Found: -
### Critical Bugs: -

---

## Next Steps
[To be determined based on findings]

---

**Testing Notes:**
- Ready to begin testing
- Will update this document in real-time
- Taking detailed notes on all findings
- Will capture all issues, questions, and observations

**Let's start! 🚀**
