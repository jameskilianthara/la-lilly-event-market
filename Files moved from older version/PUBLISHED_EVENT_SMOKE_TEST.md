# Published Event Page Smoke Test Checklist

## 🔧 Setup Requirements

### Database Setup
- [ ] PostgreSQL running with schema from `/database/schema.sql`
- [ ] Seed data loaded from `/database/seed.sql`
- [ ] Verify seed event exists: `SELECT * FROM events WHERE title LIKE '%Sharma%';`

### Server Setup
- [ ] Node.js server running on :5000
- [ ] New eventsAPI route mounted at `/api/events`
- [ ] Pipeline API accessible at `/api/pipeline-runs`
- [ ] Database connection working (check server logs)

### Client Setup
- [ ] React client running on :3000
- [ ] New component `PublishedEventPageNew` imported in App.js
- [ ] Route `/client/events/:eventId` pointing to new component

## 🚀 Basic Functionality Tests

### 1. Page Load
**URL:** `http://localhost:3000/client/events/550e8400-e29b-41d4-a716-446655440010`

- [ ] Page loads without errors
- [ ] Event title displays: "Sharma Family Wedding Celebration"
- [ ] Event metadata shows: Date, Location, Guest count
- [ ] Status badge shows "published"
- [ ] No console errors in browser dev tools

### 2. Event Data Display
- [ ] **Event Summary** section shows AI summary or description
- [ ] **Budget Range** displays if available ($25,000 - $45,000)
- [ ] **Required Services** section shows services from database
- [ ] **Event Timeline** shows activity log
- [ ] **Event Stats** sidebar shows correct counts

### 3. Reference Images
- [ ] **Reference Images** section appears if images exist in `event_assets`
- [ ] Images display correctly in grid layout
- [ ] Click image opens in new tab
- [ ] Images have proper aspect ratios

### 4. Vendor Bids Management
- [ ] **Vendor Bids** section shows bids from database
- [ ] Bid displays: Business name, vendor name, rating, amount
- [ ] Proposal text shows correctly if available
- [ ] Services breakdown displays for each bid
- [ ] Status badges show current bid status

#### Bid Status Workflow
- [ ] **Pending → Under Review**: Click "Review" button
  - Status changes to "under_review"
  - New timeline entry created
- [ ] **Under Review → Shortlisted**: Click "Shortlist" button
  - Status changes to "shortlisted"  
  - Timeline updated
- [ ] **Under Review → Rejected**: Click "Reject" button
  - Status changes to "rejected"
  - Timeline updated
- [ ] **Shortlisted → Awarded**: Click "Award" button
  - Status changes to "awarded"
  - Timeline updated

### 5. AI Visual Generation
- [ ] **AI Visual Generation** panel appears in right sidebar
- [ ] Shows "Generate Visuals" button when no pipeline run exists
- [ ] Click "Generate Visuals" starts pipeline:
  - Button changes to "Generating..." with spinner
  - Status updates from server every 2 seconds
  - Progress shows all 7 steps (chat, checklist, image_prompt, etc.)
  - Step status icons update in real-time

#### Pipeline Progress
- [ ] **Step 1 (chat)**: Keywords extraction completes (~1s)
- [ ] **Step 2 (checklist)**: Services analysis completes (~1s) 
- [ ] **Step 3 (image_prompt)**: Search query building completes (~1s)
- [ ] **Step 4 (image_search)**: Mock images selected (~1s)
- [ ] **Step 5 (vision)**: Mock vision analysis completes (~2s)
- [ ] **Step 6 (leonardo_prompt)**: AI prompt composition completes (~2s)
- [ ] **Step 7 (render)**: Placeholder render URL generated (~3s)

### 6. Generated Visual Display
After pipeline completes:
- [ ] **Generated Visual** section appears in right sidebar
- [ ] Shows placeholder render image URL
- [ ] Image displays correctly (or shows fallback message)
- [ ] Button changes back to "Regenerate Visuals"

## 🔍 API Endpoint Tests

### GET /api/events/:id/full
```bash
curl http://localhost:5000/api/events/550e8400-e29b-41d4-a716-446655440010/full
```
- [ ] Returns 200 OK
- [ ] Response includes all sections: event, event_assets, event_services, vendor_bids, event_timeline, latest_pipeline_run
- [ ] Client details masked correctly (client_masked: false for now)
- [ ] JSON structure matches expected format

### PUT /api/events/:eventId/bids/:bidId/status
```bash
# Get a bid ID first from the full endpoint, then:
curl -X PUT http://localhost:5000/api/events/550e8400-e29b-41d4-a716-446655440010/bids/BID_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "under_review"}'
```
- [ ] Returns 200 OK
- [ ] Bid status updated in database
- [ ] Timeline entry created
- [ ] Response includes updated bid data

### POST /api/events/:id/run-pipeline
```bash
curl -X POST http://localhost:5000/api/events/550e8400-e29b-41d4-a716-446655440010/run-pipeline \
  -H "Content-Type: application/json" \
  -d '{}'
```
- [ ] Returns 200 OK with run_id
- [ ] Pipeline execution starts
- [ ] Database records created in ai_pipeline_runs and ai_pipeline_steps

## 🐛 Error Handling Tests

### Invalid Event ID
**URL:** `http://localhost:3000/client/events/invalid-id`
- [ ] Shows error page with "Error Loading Event"
- [ ] "Back to Events" button works
- [ ] No console errors

### Database Connection Issues
- [ ] If database is down, shows appropriate error message
- [ ] Fallback data loads where applicable
- [ ] User can still navigate away

### Pipeline Execution Errors
- [ ] If pipeline fails, status shows "failed"
- [ ] Error messages display in pipeline monitor
- [ ] User can retry pipeline execution

## 📱 Responsive Design Tests

### Desktop (1920x1080)
- [ ] Two-column layout displays correctly
- [ ] Images grid shows 3 columns
- [ ] All content fits without horizontal scroll

### Tablet (768x1024)
- [ ] Single column layout on smaller screens
- [ ] Images grid reduces to 2 columns
- [ ] Touch targets are appropriately sized

### Mobile (375x667)
- [ ] All content stacks vertically
- [ ] Images grid shows 2 columns
- [ ] Text remains readable
- [ ] Buttons are touch-friendly

## 🔒 Security & Performance Tests

### Data Security
- [ ] Client information properly masked when client_masked=true
- [ ] No sensitive vendor information exposed
- [ ] Database queries use parameterized statements

### Performance
- [ ] Page loads in under 3 seconds
- [ ] Images load progressively
- [ ] Pipeline polling stops when complete
- [ ] No memory leaks in browser

### Network Requests
- [ ] Initial page load: 1 request to `/api/events/:id/full`
- [ ] Pipeline generation: 1 request to start, then polling requests
- [ ] Bid status changes: 1 request per update
- [ ] No unnecessary duplicate requests

## ✅ Acceptance Criteria

**All tests must pass for production readiness:**

- [ ] **Basic Load**: Page loads event data from new schema
- [ ] **Reference Images**: Displays event_assets where asset_type='reference_image'
- [ ] **Event Summary**: Shows events.summary instead of demo data
- [ ] **Timeline**: Single timeline from event_timeline table
- [ ] **Bid Management**: Status changes work with mutation endpoints
- [ ] **Visual Generation**: Pipeline integration with live progress
- [ ] **Generated Renders**: Displays render step output images
- [ ] **Error Handling**: Graceful failures with user feedback
- [ ] **Real-time Updates**: Polling updates pipeline status correctly

## 🚨 Common Issues & Solutions

### "Event not found" Error
- Verify seed data loaded: `SELECT COUNT(*) FROM events;`
- Check event ID matches seed data
- Verify database connection in server logs

### Pipeline Generation Not Working
- Check TypeScript compilation: `cd server && npx tsc`
- Verify pipeline API mounted: Check server.js routes
- Database connection required for pipeline execution

### Images Not Loading
- Check event_assets table has data
- Verify image URLs are accessible
- Check CORS settings for external images

### Bid Status Not Updating
- Verify vendor_bids table has data
- Check bid ID exists for the event
- Timeline table must exist for status change logging

---

**Test Status:** ⚪ Not Started | 🟡 In Progress | ✅ Passed | ❌ Failed

**Last Updated:** _Fill in when testing completed_