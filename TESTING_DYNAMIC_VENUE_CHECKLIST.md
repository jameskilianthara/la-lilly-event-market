# 🧪 TESTING DYNAMIC VENUE CHECKLIST

**Status**: Ready for Testing
**Date**: 2026-01-02

---

## ✅ WHAT'S BEEN UPDATED

### **1. Wedding Checklist JSON** ✅
**File**: `/public/data/checklists/wedding.json`

**Changes**:
- ✅ Added "Do you have a venue?" question with `isDynamicVenueTrigger` flag
- ✅ Added conditional venue name field with autocomplete
- ✅ Added conditional venue address field
- ✅ Added conditional booking status field
- ✅ All have `dependsOn` logic for conditional rendering

### **2. Dynamic Components Created** ✅
**Files**: `/src/components/checklist/`
- ✅ `DynamicChecklistItem.tsx` - Handles conditional rendering
- ✅ `VenuePreferences.tsx` - Preference collection
- ✅ `VenueSelectionCard.tsx` - Venue display card
- ✅ `VenueBrowse.tsx` - Venue grid with search
- ✅ `VenueSelectionSection.tsx` - Full orchestrator

### **3. Venue Database** ✅
**Location**: `/venue-crawler/data/venues/`
- ✅ 9 premium Kochi venues ready
- ✅ API routes functional (`/api/venues/search`, `/api/venues/optimize-checklist`)

---

## 🧪 HOW TO TEST

### **Step 1: Clear Previous Data**

To start fresh and see the new venue questions:

**Option A - Create New Event**:
```
1. Go to http://localhost:3000/forge
2. Click "Start New Event" or clear browser cache
3. Go through ForgeChat with fresh answers
4. Proceed to checklist
```

**Option B - Clear Browser Data**:
```
1. Open DevTools (F12)
2. Go to Application tab
3. Clear Storage → Clear site data
4. Refresh page
5. Login again and create new event
```

**Option C - Use Different Browser/Incognito**:
```
1. Open Chrome Incognito or different browser
2. Go to http://localhost:3000
3. Sign up with test account or use different email
4. Create new event
```

---

### **Step 2: Test "Yes, I have a venue" Path**

1. **Navigate to Checklist**:
   - Complete ForgeChat (event type, date, city, guests, venue status)
   - Click through to Blueprint/Checklist page

2. **Answer Venue Question**:
   - Find "Venue & Location" section
   - Question: "Do you have a venue for your wedding?"
   - Select: "Yes, I have a venue"

3. **Conditional Fields Appear**:
   - ✅ "Venue name" field with autocomplete should appear
   - ✅ Type "Grand" → Should show autocomplete suggestions
   - ✅ Select "Grand Hyatt Kochi Bolgatty" from dropdown

4. **Expected Results**:
   - ✅ Venue address field appears
   - ✅ Booking status field appears
   - ✅ Checklist should auto-optimize (15+ items auto-filled)
   - ✅ Success message: "Checklist optimized for Grand Hyatt..."

---

### **Step 3: Test "No, need help finding" Path**

1. **Answer Venue Question**:
   - Question: "Do you have a venue for your wedding?"
   - Select: "No, I need help finding one"

2. **Venue Selection UI Appears**:
   - ✅ Step 1: Preferences collection UI should appear
   - ✅ See venue type options (Hotel/Resort, Banquet Hall, Garden, Heritage)
   - ✅ See indoor/outdoor radio buttons
   - ✅ See budget range dropdown
   - ✅ See special requirements checkboxes

3. **Fill Preferences**:
   ```
   Venue Type: Hotel/Resort
   Setting: Indoor + Outdoor
   Budget: Premium (₹3L-5L)
   Special: ✓ Parking, ✓ Accommodation
   ```

4. **Click "Find Matching Venues"**:
   - ✅ Progress indicator moves to Step 2
   - ✅ Loading spinner appears
   - ✅ Venue cards appear (should show 2-4 matching venues)

5. **Browse Venues**:
   - ✅ Each card shows venue name, location, capacity, price
   - ✅ See key features (AC, Parking, Rooms, Catering)
   - ✅ See star ratings and reviews
   - ✅ "Select This Venue" button on each card

6. **Select a Venue**:
   - Click "Select This Venue" on any card (e.g., Crowne Plaza)
   - ✅ Progress moves to Step 3
   - ✅ "Optimizing your checklist..." loading appears
   - ✅ Success screen shows with venue details
   - ✅ "Continue with This Venue" button

7. **Click Continue**:
   - ✅ Checklist auto-optimizes
   - ✅ 15+ items auto-filled
   - ✅ Redundant items removed
   - ✅ Conditional items added

---

## 🔍 WHAT TO LOOK FOR

### **Visual Checks**:
- [ ] Venue question appears in "Venue & Location" section
- [ ] Conditional fields show/hide based on answer
- [ ] Autocomplete dropdown works when typing venue name
- [ ] Venue cards display properly with all details
- [ ] Progress indicator shows correct step
- [ ] Loading states display during API calls
- [ ] Success confirmation screen shows

### **Functionality Checks**:
- [ ] Autocomplete fetches from `/api/venues/search`
- [ ] Venue browse filters by preferences
- [ ] Selecting venue triggers optimization API call
- [ ] Checklist updates with venue-specific data
- [ ] Can go back and change preferences
- [ ] Can choose different venue
- [ ] Skip option works

### **Data Checks** (Open DevTools → Network tab):
- [ ] POST `/api/venues/search` - Returns venue results
- [ ] POST `/api/venues/optimize-checklist` - Returns optimized checklist
- [ ] Check response contains auto-populated items
- [ ] Check response contains removed items list
- [ ] Check response contains added items list

---

## ⚠️ KNOWN ISSUES TO CHECK

### **Issue 1: Components Not Rendering**
**Symptom**: Venue question shows but conditional fields don't appear

**Fix**: The ComprehensiveBlueprint component needs to be updated to use DynamicChecklistItem

**Check**:
```bash
# See if DynamicChecklistItem is imported in blueprint component
grep -r "DynamicChecklistItem" src/components/blueprint/
```

### **Issue 2: Old Checklist Data Cached**
**Symptom**: Still seeing old checklist format

**Fix**:
```javascript
// Clear localStorage
localStorage.clear();

// Clear sessionStorage
sessionStorage.clear();

// Reload page
window.location.reload();
```

### **Issue 3: API Routes Not Found**
**Symptom**: 404 errors for `/api/venues/*`

**Check**:
```bash
# Verify API routes exist
ls src/app/api/venues/

# Should see:
# - search/route.ts
# - [id]/route.ts
# - optimize-checklist/route.ts
```

### **Issue 4: No Venues Returned**
**Symptom**: Empty state in venue browse

**Check**:
```bash
# Verify venue data files exist
ls venue-crawler/data/venues/

# Should see 9 JSON files
# Test API directly:
curl -X POST http://localhost:3000/api/venues/search \
  -H "Content-Type: application/json" \
  -d '{"query":"hotel","maxResults":5}'
```

---

## 🐛 DEBUGGING COMMANDS

### **Test API Endpoints**:

**1. Search API**:
```bash
curl -X POST http://localhost:3000/api/venues/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Grand Hyatt",
    "filters": {"min_capacity": 300},
    "maxResults": 5
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "query": "Grand Hyatt",
  "count": 1,
  "results": [
    {
      "venue_id": "kochi_grand_hyatt_bolgatty_004",
      "basic_info": {
        "official_name": "Grand Hyatt Kochi Bolgatty"
      },
      ...
    }
  ]
}
```

**2. Get Venue by ID**:
```bash
curl http://localhost:3000/api/venues/kochi_grand_hyatt_bolgatty_004
```

**3. Optimize Checklist**:
```bash
curl -X POST http://localhost:3000/api/venues/optimize-checklist \
  -H "Content-Type: application/json" \
  -d '{
    "venue_id": "kochi_grand_hyatt_bolgatty_004",
    "checklist": {
      "eventType": "Wedding",
      "sections": []
    }
  }'
```

---

## ✅ SUCCESS CRITERIA

### **Minimum Requirements**:
- [x] Venue question appears in checklist
- [ ] "Yes" path shows conditional fields
- [ ] "No" path shows venue selection UI
- [ ] Autocomplete works when typing venue name
- [ ] At least 3-5 venues show in browse step
- [ ] Selecting venue triggers optimization
- [ ] Checklist updates with venue data

### **Full Success**:
- [ ] All 9 venues searchable
- [ ] Autocomplete suggests correctly
- [ ] Preferences filter venues properly
- [ ] All venue cards display correctly
- [ ] Progress indicator works
- [ ] Can go back and change selections
- [ ] Auto-optimization fills 15+ items
- [ ] Removed items list correct
- [ ] Added conditional items correct
- [ ] No console errors
- [ ] No network errors
- [ ] Smooth UX with loading states

---

## 📝 TEST SCENARIOS

### **Scenario 1: Luxury Hotel for 500 Guests**
```
Preferences:
- Venue Type: Hotel/Resort
- Setting: Indoor + Outdoor
- Budget: Luxury (₹5L+)
- Requirements: Parking, Accommodation

Expected Results:
- Grand Hyatt Bolgatty (1,050 capacity) ✓
- Crowne Plaza (800 capacity) ✓
- Taj Malabar (600 capacity) ✓
```

### **Scenario 2: Budget Banquet for 300 Guests**
```
Preferences:
- Venue Type: Banquet Hall
- Setting: Indoor
- Budget: Budget (₹50K-1L)
- Requirements: None

Expected Results:
- Trinita Casa (1,000 capacity) ✓
- Bolgatty Palace (1,500 capacity) ✓
```

### **Scenario 3: Boutique Venue for 100 Guests**
```
Preferences:
- Venue Type: Garden/Outdoor
- Setting: Outdoor
- Budget: Mid (₹1L-3L)
- Requirements: None

Expected Results:
- The Croft (150 capacity) ✓
- Possibly others
```

---

## 🚀 NEXT STEPS AFTER TESTING

### **If Tests Pass**:
1. Deploy to staging
2. User acceptance testing
3. Production deployment
4. Monitor analytics

### **If Tests Fail**:
1. Note specific failure points
2. Check console errors
3. Check network errors
4. Report issues for fixing

---

## 📞 SUPPORT

**Documentation**:
- [DYNAMIC_VENUE_CHECKLIST_COMPLETE.md](DYNAMIC_VENUE_CHECKLIST_COMPLETE.md)
- [PREMIUM_VENUES_COMPLETE.md](PREMIUM_VENUES_COMPLETE.md)
- [VENUE_SYSTEM_READY.md](VENUE_SYSTEM_READY.md)

**Quick Debug**:
```bash
# Check dev server is running
curl http://localhost:3000

# Check venue data exists
ls -l venue-crawler/data/venues/

# Check API routes exist
ls -l src/app/api/venues/

# View server logs
# (Check terminal where pnpm dev is running)
```

---

**🔥 Ready to test the dynamic venue checklist! Follow the steps above and report any issues.**
