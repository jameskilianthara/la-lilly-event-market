# EventFoundry - Existing Event Checklists Inventory

## 📋 Overview

EventFoundry has **4 comprehensive, dedicated event-specific checklists** already created and ready to use. These checklists are stored in JSON format and are now integrated into the new ForgeChat workflow.

## 📁 Location

**Primary Location**: `/public/data/checklists/` (used by frontend)
**Backup Location**: `/src/data/checklists/` (duplicate copy)

## ✅ Available Checklists

### 1. Wedding Event Checklist
**File**: `wedding.json`
**Event Type**: `wedding`
**Display Name**: "Wedding Event Checklist"
**Complexity**: ⭐⭐⭐⭐⭐ Master (Most Comprehensive)
**Categories**: 6

#### Categories:
1. **🏛️ Venue & Logistics**
   - Indoor/outdoor preference
   - Type of wedding ceremony (Hindu, Christian, Muslim, Sikh, Inter-faith, Civil, Destination)
   - Venue booking requirements (ceremony venue, reception, backup, bridal suite, groom's room)
   - Accommodation needs (family, out-of-town guests, bridal party, vendors)

2. **🎨 Design & Decoration**
   - Invitation requirements (save the date, invitations, RSVP, digital, menu cards, thank you cards)
   - Theme preference for decoration
   - Floral arrangements and styling
   - Lighting and ambiance setup

3. **🎭 Entertainment & Activities**
   - Music entertainment options (DJ, live band, orchestra, traditional musicians)
   - Special performances (dance, cultural performances, surprise acts)
   - Guest engagement activities
   - Special ceremonies and rituals

4. **🍽️ Food & Beverage**
   - Meal service style (buffet, plated, food stations)
   - Cuisine preferences (Indian, Continental, Chinese, fusion)
   - Bar service (open bar, limited bar, signature cocktails, mocktails)
   - Special dietary requirements

5. **📸 Photography & Documentation**
   - Photography coverage (candid, traditional, cinematic)
   - Videography services (highlight reel, full coverage, drone shots)
   - Photo booth and instant prints
   - Album and editing requirements

6. **🚗 Transportation & Logistics**
   - Guest transportation
   - Wedding party transport
   - Valet parking services
   - Coordination and timing

---

### 2. Party Event Checklist
**File**: `party.json`
**Event Type**: `party`
**Display Name**: "Party Event Checklist"
**Complexity**: ⭐⭐⭐ Craftsman
**Categories**: 5
**Best For**: Birthdays, Anniversaries, Celebrations, Milestones

#### Categories:
1. **🎉 Party Specifications**
   - Party type (birthday, anniversary, graduation, holiday, corporate, cocktail, theme)
   - Party theme preference (Bollywood, retro, garden, beach, masquerade, black tie)
   - Desired atmosphere (formal/elegant, casual/fun, energetic, intimate)
   - Primary age group (children, teenagers, young adults, adults, seniors, mixed)

2. **🏠 Venue & Decoration**
   - Venue preference (indoor, outdoor, home/private, flexible)
   - Decoration elements (balloons, florals, lighting, backdrop, centerpieces, entrance)
   - Seating arrangement (formal seated, cocktail style, lounge, mix, dance floor focus)
   - Special installations (dance floor, stage, bar, lounge, kids' zone, photo booth)

3. **🎪 Entertainment & Activities**
   - Music entertainment (DJ, live band, playlist, karaoke, dance performances)
   - Party activities and games (interactive games, photo booth, magic show, casino, outdoor games, crafts)
   - Special moments (cake cutting, toasts, awards, surprises, fireworks)
   - Kids' entertainment (face painting, balloon artist, clown, bouncy castle, games coordinator)

4. **🍰 Food & Beverage**
   - Meal/food service type (full meal, heavy appetizers, light snacks, dessert focused, custom)
   - Food service style (buffet, passed appetizers, food stations, plated, dessert bar, grazing table)
   - Beverage service (open bar, limited bar, signature cocktails, mocktails, soft drinks, coffee/tea)
   - Special food items (celebration cake, themed desserts, late-night snacks, kids' menu, dietary accommodations)

5. **✨ Additional Services**
   - Photography and videography (professional photographer, videographer, candid, photo booth, drone)
   - Guest services (valet parking, coat check, welcome drinks, party favors, transportation)
   - Party coordination (full planner, day-of coordinator, setup/breakdown, self-managed)
   - Cleanup and breakdown (full cleanup, venue only, rental pickup, self-managed)

---

### 3. Conference Event Checklist
**File**: `conference.json`
**Event Type**: `conference`
**Display Name**: "Conference Event Checklist"
**Complexity**: ⭐⭐⭐ Craftsman
**Categories**: 5
**Best For**: Corporate events, Business meetings, Seminars, Workshops

#### Categories:
1. **🏢 Venue & Setup**
   - Conference format and style
   - Room layout and seating
   - Registration and check-in area
   - Networking spaces
   - Breakout room requirements

2. **🎯 Materials & Branding**
   - Conference branding and signage
   - Name badges and lanyards
   - Welcome kits and materials
   - Promotional materials
   - Branded merchandise

3. **🎤 Technology & AV**
   - Audio visual equipment (projectors, screens, microphones, speakers)
   - Live streaming and recording
   - Presentation support
   - WiFi and connectivity
   - Interactive tools (polling, Q&A)

4. **☕ Food & Beverage**
   - Breakfast and coffee breaks
   - Lunch service style
   - Refreshment stations
   - Dietary accommodations
   - Networking reception

5. **👥 Support Services**
   - Event staff and coordinators
   - Technical support team
   - Registration desk staff
   - Speaker liaison
   - Photography and documentation

---

### 4. Exhibition Event Checklist
**File**: `exhibition.json`
**Event Type**: `exhibition`
**Display Name**: "Exhibition Event Checklist"
**Complexity**: ⭐⭐⭐⭐ Master
**Categories**: 5
**Best For**: Expos, Trade shows, Showcases, Fairs

#### Categories:
1. **🎨 Exhibition Details**
   - Exhibition type and format
   - Number of exhibitors/stalls
   - Exhibition theme and concept
   - Target audience profile
   - Duration and schedule

2. **🏗️ Venue & Infrastructure**
   - Venue space and layout
   - Booth/stall specifications
   - Electrical and connectivity
   - Storage and warehouse
   - Accessibility requirements

3. **🛠️ Setup & Design**
   - Booth/stall design and fabrication
   - Signage and wayfinding
   - Lighting and display
   - Product display fixtures
   - Branding and graphics

4. **📢 Marketing & Engagement**
   - Pre-event promotion
   - On-site registration
   - Visitor engagement activities
   - Lead capture system
   - Post-event follow-up

5. **📦 Services & Logistics**
   - Setup and breakdown crew
   - Security services
   - Cleaning and maintenance
   - Catering for exhibitors/visitors
   - Transportation and parking

---

## 🎯 Integration with ForgeChat

### Mapping Logic (from `src/lib/checklistMapper.ts`)

| Event Keywords | Maps To | Checklist File |
|---------------|---------|----------------|
| wedding, marriage, nikah, shaadi, matrimony, reception | Wedding | `wedding.json` |
| birthday, party, celebration, anniversary, milestone | Party | `party.json` |
| corporate, conference, business, meeting, seminar, workshop | Conference | `conference.json` |
| exhibition, expo, trade show, showcase, fair | Exhibition | `exhibition.json` |
| **Unknown/Other** | **Fallback** | `wedding.json` (most comprehensive) |

### User Flow

1. **ForgeChat**: User answers 5 questions
   - Event type: "Birthday Party"
   - Date, City, Guests, Venue status

2. **Checklist Selection**: System maps "Birthday Party" → `party.json`

3. **Checklist Customization**: User sees Party Event Checklist with 5 categories
   - Selects party type, theme, atmosphere
   - Customizes venue, decoration, entertainment
   - Chooses food, beverage, activities
   - Adds reference images and notes

4. **Save & Continue**: Checklist data saved to database

5. **Blueprint Generation**: System uses checklist selections to create enhanced blueprint

---

## 📊 Checklist Statistics

| Checklist | Categories | Avg Items per Category | Total Items | Complexity |
|-----------|-----------|----------------------|-------------|-----------|
| Wedding | 6 | ~5 items | ~30 items | Master ⭐⭐⭐⭐⭐ |
| Party | 5 | ~4 items | ~20 items | Craftsman ⭐⭐⭐ |
| Conference | 5 | ~5 items | ~25 items | Craftsman ⭐⭐⭐ |
| Exhibition | 5 | ~5 items | ~25 items | Master ⭐⭐⭐⭐ |

---

## 🎨 Checklist Structure

Each checklist follows this standardized structure:

```json
{
  "eventType": "string",        // Lowercase identifier
  "displayName": "string",       // User-facing title
  "categories": [                // Array of category objects
    {
      "id": "string",           // Unique category ID
      "title": "string",         // Category display name
      "icon": "emoji",           // Category icon
      "items": [                 // Array of checklist items
        {
          "id": "string",        // Unique item ID
          "question": "string",   // Question/prompt for user
          "type": "radio|select|checkbox",  // Input type
          "options": ["..."]      // Array of option strings
        }
      ],
      "additionalNotes": true    // Whether to show notes textarea
    }
  ]
}
```

---

## ✨ Item Types Explained

### 1. Radio (Single Choice)
```json
{
  "type": "radio",
  "options": ["Option A", "Option B", "Option C"]
}
```
User can select **exactly one** option. Good for mutually exclusive choices.

### 2. Select (Dropdown)
```json
{
  "type": "select",
  "options": ["Option 1", "Option 2", "Option 3", "..."]
}
```
User selects **one option** from dropdown. Good for many options (saves space).

### 3. Checkbox (Multiple Choice)
```json
{
  "type": "checkbox",
  "options": ["Item A", "Item B", "Item C", "Item D"]
}
```
User can select **zero or more** options. Good for services that can be combined.

---

## 🚀 Adding New Checklists

To add a new event-specific checklist:

### Step 1: Create JSON File
Create: `/public/data/checklists/[event-type].json`

Example for "product_launch.json":
```json
{
  "eventType": "product_launch",
  "displayName": "Product Launch Event Checklist",
  "categories": [
    {
      "id": "launch_specs",
      "title": "Launch Specifications",
      "icon": "🚀",
      "items": [
        {
          "id": "product_type",
          "question": "Type of product being launched",
          "type": "select",
          "options": ["Tech product", "Consumer goods", "Service", "App/Software", "Other"]
        }
      ],
      "additionalNotes": true
    }
  ]
}
```

### Step 2: Update Mapping
Edit: `src/lib/checklistMapper.ts`

Add to `CHECKLIST_MAPPING`:
```typescript
'product_launch': ['product launch', 'launch event', 'unveiling', 'reveal'],
```

### Step 3: Test
1. Go to ForgeChat
2. Answer "Product Launch" as event type
3. Should route to new checklist

---

## 🎯 Best Practices

### For Checklist Content
- ✅ Keep questions clear and concise
- ✅ Provide 3-8 options per item (not too few, not overwhelming)
- ✅ Use Indian context (festivals, traditions, local preferences)
- ✅ Include "Other" or "Custom" options for flexibility
- ✅ Enable `additionalNotes: true` for most categories

### For Category Design
- ✅ Group related items logically
- ✅ Order categories by decision priority (specs → logistics → details)
- ✅ Use clear, descriptive category titles
- ✅ Choose appropriate emojis for visual recognition
- ✅ Aim for 4-6 categories per checklist

### For Options
- ✅ List most common/popular options first
- ✅ Use consistent terminology across checklists
- ✅ Include price range indicators when relevant
- ✅ Accommodate cultural/regional variations

---

## 📝 Maintenance Notes

### Updating Checklists
1. Edit JSON file in `/public/data/checklists/`
2. **Keep backup copy** in `/src/data/checklists/` in sync
3. Test changes in checklist page
4. No code changes needed (checklists are data-driven)

### Version Control
- Checklists are versioned via git
- Track changes in commit messages
- Document significant updates in CHANGELOG.md

### User Feedback Integration
- Collect user feedback on checklist items
- Add/remove options based on usage patterns
- Refine question wording for clarity

---

## 🎉 Summary

**4 Professional, Production-Ready Checklists Available:**
- ✅ **Wedding** (6 categories, ~30 items) - Most comprehensive
- ✅ **Party** (5 categories, ~20 items) - Birthdays, celebrations
- ✅ **Conference** (5 categories, ~25 items) - Corporate events
- ✅ **Exhibition** (5 categories, ~25 items) - Expos, trade shows

**Fully Integrated with ForgeChat:**
- ✅ Automatic routing based on event type
- ✅ Data persistence to database
- ✅ Reference image support
- ✅ Category notes for custom requirements
- ✅ Seamless flow to blueprint generation

**Ready for Production Use!** 🚀
