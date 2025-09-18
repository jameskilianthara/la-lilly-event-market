# Event Marketplace - Complete Smoke Test Guide

## 🎯 Overview

This guide provides step-by-step instructions for testing the complete event marketplace workflow, from database setup through pipeline execution and published event management.

## ⚙️ Setup Prerequisites

### 1. Database Setup
```bash
# Navigate to server directory
cd server/

# Connect to PostgreSQL and create database
psql -U postgres
CREATE DATABASE event_marketplace;
\q

# Load schema and seed data
psql -U postgres -d event_marketplace -f ../database/schema.sql
psql -U postgres -d event_marketplace -f ../database/seed.sql

# Verify data loaded correctly
psql -U postgres -d event_marketplace -c "
SELECT 
  (SELECT COUNT(*) FROM events) as events,
  (SELECT COUNT(*) FROM event_assets) as assets,  
  (SELECT COUNT(*) FROM event_services) as services,
  (SELECT COUNT(*) FROM vendor_bids) as bids,
  (SELECT COUNT(*) FROM event_timeline) as timeline_events;
"
```

**Expected Output:**
```
 events | assets | services | bids | timeline_events 
--------+--------+----------+------+-----------------
      1 |      3 |        2 |    1 |               5
```

### 2. Server Startup
```bash
# Install dependencies if needed
npm install

# Start the server
node server.js

# Verify server is running - you should see:
# ✅ Connected to pipeline database
# Server running on port 5000
```

### 3. Client Startup
```bash
# In a new terminal, navigate to client
cd ../client/

# Install dependencies if needed
npm install

# Start React development server
npm start

# Browser should open to http://localhost:3000
```

## 🔬 Smoke Test Workflow

### Phase 1: Pipeline Development Tool Test

#### Step 1: Access Pipeline Monitor
1. **Navigate to:** `http://localhost:3000/dev/pipeline`
2. **Verify:** Page loads without errors
3. **Check:** Event dropdown shows "Sharma Family Wedding Celebration"

#### Step 2: Run Pipeline
1. **Select Event:** Choose "Sharma Family Wedding Celebration" from dropdown
2. **Click:** "Run Pipeline" button
3. **Observe:** 
   - Button changes to "Running..." with spinner
   - Pipeline status shows "started"
   - Steps list appears on left side

#### Step 3: Monitor Pipeline Execution
**Watch the following steps execute in sequence (~10-15 seconds total):**

1. **chat** (1-2 seconds)
   - Status: pending → running → completed
   - Click on completed step
   - **Verify JSON Output:**
     ```json
     {
       "keywords": ["wedding", "traditional", "elegant", "indian", "celebration"],
       "normalized_count": 8,
       "extracted_from": ["title", "description", "event_type", "ai_summary"]
     }
     ```

2. **checklist** (1-2 seconds)
   - **Verify JSON Output:**
     ```json
     {
       "required_services": ["photography", "catering", "decoration", "music", "venue"],
       "service_priorities": {
         "photography": "high",
         "decoration": "high"
       },
       "estimated_budget_breakdown": {
         "photography": 11500,
         "catering": 15750
       }
     }
     ```

3. **image_prompt** (1 second)
   - **Verify JSON Output:**
     ```json
     {
       "primary_search_query": "wedding elegant traditional flowers decoration setup",
       "style_modifiers": ["traditional", "elegant", "romantic"],
       "color_preferences": ["gold", "red", "white"]
     }
     ```

4. **image_search** (1 second)
   - **Verify JSON Output:**
     ```json
     {
       "image_urls": [
         "https://images.unsplash.com/photo-1519167758481-83f29d8ae8e0?w=800",
         "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800",
         "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800"
       ],
       "total_images_found": 3
     }
     ```

5. **vision** (2-3 seconds)
   - **Verify JSON Output:**
     ```json
     {
       "aggregated_labels": [
         {"description": "wedding", "aggregated_score": 2.4},
         {"description": "flowers", "aggregated_score": 2.1}
       ],
       "dominant_color_palette": [
         {"color": "#D4AF37", "total_percentage": 25.5},
         {"color": "#8B0000", "total_percentage": 18.2}
       ],
       "style_characteristics": ["elegant", "traditional"]
     }
     ```

6. **leonardo_prompt** (2 seconds)
   - **Verify JSON Output:**
     ```json
     {
       "leonardo_prompt": "A elegant, well-sized wedding event setup at San Francisco, CA, beautifully arranged for 250 guests, featuring stunning floral arrangements, elegant centerpieces, wedding, ceremony, flowers, with rich color palette of #D4AF37, #8B0000, #F5F5DC, traditional style with elegant and romantic elements, creating romantic, dreamy, magical atmosphere...",
       "estimated_tokens": 127
     }
     ```

7. **render** (3-5 seconds)
   - **Verify JSON Output:**
     ```json
     {
       "rendered_image_url": "https://cdn.leonardo.ai/users/generated/renders/elegant-wedding-setup-[timestamp].jpg",
       "render_status": "completed",
       "alternative_versions": [
         {
           "version_name": "elegant",
           "image_url": "https://cdn.leonardo.ai/users/generated/renders/elegant-variant-[timestamp].jpg"
         }
       ]
     }
     ```

#### Step 4: Pipeline Completion
- **Final Status:** "completed"
- **Steps Completed:** 7/7  
- **Duration:** ~10-15 seconds
- **Download Logs:** Click "Download Logs" button, verify JSON file downloads

### Phase 2: Published Event Page Test

#### Step 5: Navigate to Published Event
1. **Go to:** `http://localhost:3000/client/events/550e8400-e29b-41d4-a716-446655440010`
2. **Verify Page Load:**
   - Event title: "Sharma Family Wedding Celebration"
   - Date: June 15, 2025
   - Location: San Francisco, CA  
   - Guests: 250
   - Status badge: "published"

#### Step 6: Verify Reference Images Carousel
- **Reference Images Section:** Should display 3 images
  - Traditional mandap setup 
  - Ceremony decorations
  - Reception setup
- **Image Interaction:** Click images to open in new tab
- **Layout:** Images arranged in responsive grid

#### Step 7: Verify Event Summary
- **Event Summary Section:** Should display comprehensive AI summary:
  > "This elegant three-day Indian wedding celebration combines traditional ceremonies with contemporary styling. The event features authentic cultural elements including a traditional mandap ceremony, vibrant marigold decorations, and classical Indian cuisine..."
- **Budget Display:** $25,000 - $45,000 range shown

#### Step 8: Verify Services Section
- **Required Services (2):**
  1. **Photography & Videography** 
     - Budget: $12,000
     - Priority: high
     - Status: open
  2. **Floral Decorations**
     - Budget: $8,000  
     - Priority: high
     - Status: open

#### Step 9: Verify Event Timeline
- **Timeline Events:** Should show 5 chronological entries:
  1. "Event created" (Jan 10, 09:15)
  2. "Uploaded 3 reference images" (Jan 10, 10:30)  
  3. "Event was published" (Jan 10, 14:45)
  4. "Mehta Wedding Photography submitted a bid" (Jan 12, 16:20)
  5. "Event services finalized" (Jan 13, 11:10)

#### Step 10: Verify Vendor Bids Section
- **Vendor Bids (1):**
  - **Vendor:** Mehta Wedding Photography
  - **Contact:** Rahul Mehta  
  - **Rating:** 4.8 stars (127 reviews)
  - **Amount:** $11,500
  - **Timeline:** 6 weeks
  - **Status:** pending (gray badge)
  - **Services:** Photography & Videography - $11,500
  - **Proposal:** Full description visible

### Phase 3: Visual Generation Test

#### Step 11: Generate Visuals from Published Event
1. **Locate:** "AI Visual Generation" panel in right sidebar
2. **Click:** "Generate Visuals" button
3. **Observe Real-time Progress:**
   - Button changes to "Generating..." with spinner
   - Progress section shows 7 steps
   - Each step updates with status icons in real-time
   - Polling occurs every 2 seconds

#### Step 12: Verify Generated Visual Display
**After pipeline completes (~10-15 seconds):**
- **Generated Visual Section:** Appears in right sidebar
- **Render Image:** Shows placeholder Leonardo AI URL
- **Fallback Handling:** If image fails to load, shows "Generated visual will appear here"
- **Button State:** Changes back to "Regenerate Visuals"

### Phase 4: Bid Management Test

#### Step 13: Change Bid to Shortlisted
1. **In Vendor Bids section:** Find "Mehta Wedding Photography" bid
2. **Current Status:** "pending" (gray badge)
3. **Available Action:** "Review" button
4. **Click:** "Review" button
5. **Verify Changes:**
   - Status badge changes to "under_review" (blue)
   - New buttons appear: "Shortlist" and "Reject"
   - Page refreshes automatically

#### Step 14: Progress to Shortlisted
1. **Click:** "Shortlist" button  
2. **Verify Changes:**
   - Status badge changes to "shortlisted" (yellow)
   - New buttons appear: "Award" and "Back to Review"

#### Step 15: Award the Bid
1. **Click:** "Award" button
2. **Verify Changes:**
   - Status badge changes to "awarded" (green)  
   - No action buttons (final state)

#### Step 16: Verify Timeline Updates
**Check Event Timeline section - should show 3 new entries:**
1. "Bid status changed to under_review" (most recent)
2. "Bid status changed to shortlisted" 
3. "Bid status changed to awarded" (newest)

**Each timeline entry should include:**
- Timestamp (current time)
- User attribution
- Status change metadata

## ✅ Success Criteria Checklist

### Pipeline Monitor (/dev/pipeline)
- [ ] Page loads without errors
- [ ] Event dropdown populates from database
- [ ] Pipeline executes all 7 steps successfully  
- [ ] Each step produces sensible JSON output
- [ ] Real-time status updates work correctly
- [ ] Download logs functionality works

### Published Event Page (/client/events/:id)
- [ ] Event data loads from new schema
- [ ] Reference images carousel displays correctly
- [ ] Event summary shows from database
- [ ] Timeline displays chronological events
- [ ] Services section shows database records
- [ ] Vendor bids display with complete information

### Visual Generation Integration
- [ ] Generate visuals button starts pipeline
- [ ] Real-time progress updates every 2 seconds
- [ ] Generated render image displays when complete
- [ ] Pipeline status persists across page refreshes

### Bid Management Workflow
- [ ] Bid status changes work: pending → under_review → shortlisted → awarded
- [ ] Status changes reflect immediately on page
- [ ] Timeline automatically logs status changes
- [ ] Database records persist changes correctly

### Error Handling
- [ ] Invalid event ID shows error page
- [ ] Database connection failures handled gracefully  
- [ ] Pipeline failures show appropriate status
- [ ] Network request errors don't break UI

## 🐛 Troubleshooting

### Common Issues

**"Event not found" error:**
```bash
# Verify seed data loaded
psql -U postgres -d event_marketplace -c "SELECT id, title FROM events;"
```

**Pipeline steps showing empty JSON:**
```bash
# Check server logs for TypeScript compilation errors
cd server && npx tsc
node server.js
```

**Images not loading:**
- Check browser console for CORS errors
- Verify Unsplash URLs are accessible
- Check network connectivity

**Bid status changes not working:**
```bash
# Verify API endpoint is accessible
curl -X PUT http://localhost:5000/api/events/550e8400-e29b-41d4-a716-446655440010/bids/550e8400-e29b-41d4-a716-446655440050/status \
  -H "Content-Type: application/json" \
  -d '{"status": "under_review"}'
```

## 🎯 Test Results Template

**Test Date:** ________________  
**Tester:** ____________________  
**Environment:** Development

| Test Phase | Status | Notes |
|------------|---------|-------|
| Database Setup | ⚪ | |
| Pipeline Monitor | ⚪ | |
| Published Event Page | ⚪ | |
| Visual Generation | ⚪ | |
| Bid Management | ⚪ | |

**Overall Result:** ⚪ Pass / Fail

**Issues Found:**
1. _________________________________
2. _________________________________  
3. _________________________________

---

This comprehensive smoke test validates the entire workflow from pipeline development through production event management, ensuring all components work together seamlessly.