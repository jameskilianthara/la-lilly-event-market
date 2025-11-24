# 🎯 EventFoundry Checklist Mapping Strategy - Discussion Needed

## Context for Co-Founder Review

We've successfully implemented **10 dedicated event-specific checklists** with automatic routing from ForgeChat. However, we've discovered some critical questions about **which checklist best serves which client need**.

---

## 🔍 The Core Question

**Are clients getting the MOST APPROPRIATE checklist based on what they actually need?**

Current system: User types "Corporate Event" → System maps to "Conference Checklist"
But should "Corporate Event" map to:
- Conference Checklist? (external event - seminars, business meetings)
- Employee Engagement Checklist? (internal event - team building, training)
- Something else entirely?

---

## 📊 Current Situation

### What We Have (10 Checklists)

1. **Wedding** - Ceremonies, receptions, traditional events
2. **Engagement** - Ring ceremonies, roka, sagai
3. **Party** - Birthdays, celebrations, anniversaries
4. **Conference** - Corporate seminars, business meetings, workshops
5. **Exhibition** - Trade shows, expos, showcases
6. **Film Events** - Movie launches, Pooja ceremonies, celebrity events
7. **Press Conference** - Media events, announcements, product launches
8. **Promotional Activities** - Road shows, brand activations, marketing
9. **Inauguration** - Ribbon cutting, showroom openings, launches
10. **Employee Engagement** - Team building, dealer meets, training, offsites

### Current Keyword Mapping

**File**: [`src/lib/checklistMapper.ts`](src/lib/checklistMapper.ts:8-19)

```typescript
const CHECKLIST_MAPPING: Record<string, string[]> = {
  'conference': ['corporate', 'conference', 'business', 'meeting', 'seminar', 'workshop', 'symposium'],
  'employee-engagement': ['employee', 'team building', 'dealer meet', 'partner meet', 'training', 'workshop', 'town hall', 'annual day', 'offsite'],
  'inauguration': ['inauguration', 'opening', 'launch', 'ribbon cutting', 'grand opening', 'showroom opening'],
  // ... 7 more
};
```

---

## ⚠️ Problems Discovered

### 1. Keyword Conflicts

**"Workshop"** appears in BOTH:
- `conference` → External business workshop
- `employee-engagement` → Internal training workshop

**Current behavior**: "Workshop" maps to Conference (first match wins)
**Question**: Is this correct? Or should we distinguish internal vs external workshops?

**"Launch"** appears in:
- `inauguration` → Business/showroom launch
- `film-events` → Movie/trailer launch (not in keywords but logical)

**Question**: Should "Product Launch" map to Press Conference or Inauguration?

### 2. Ambiguous Event Types

When a user types **"Corporate Event"**, what do they REALLY mean?

**Could be any of these**:
- External conference/seminar (Conference Checklist)
- Internal team event (Employee Engagement Checklist)
- Corporate party (Party Checklist)
- Business inauguration (Inauguration Checklist)
- Product launch (Press Conference or Inauguration)

**Current mapping**: "Corporate" → Conference Checklist
**Question**: Is this assumption correct for MOST users?

### 3. Indian Market Context

Some event types common in India may not map well:

- **"Dealer Meet"** → Currently maps to Employee Engagement ✅
- **"Pooja Ceremony"** → Currently maps to Film Events (for movie Pooja)
  - But what about business Pooja? Should map to Inauguration?
- **"Annual Day"** → Currently maps to Employee Engagement ✅
- **"Sangeet/Mehendi"** → Not in keywords, would map to Party (fallback)
  - Should these map to Wedding or have their own checklist?

### 4. Overlapping Services

Some events need MULTIPLE checklists:

**Example**: "Product Launch Event"
- Needs Press Conference checklist (media, announcements)
- Needs Inauguration checklist (ribbon cutting, VIP management)
- Needs Promotional Activities checklist (brand activation, giveaways)

**Current limitation**: System only shows ONE checklist
**Question**: Should we allow clients to select multiple checklists or merge them?

---

## 💡 Strategic Questions for Discussion

### Question 1: Keyword Conflicts - How to Resolve?

**Option A**: Make keywords mutually exclusive
- Remove "workshop" from conference, keep only in employee-engagement
- Remove "launch" from inauguration, keep only in film-events
- **Pro**: Clear, no ambiguity
- **Con**: May route users to wrong checklist

**Option B**: Ask clarifying question when ambiguous
- User types "Workshop" → Show popup: "Is this an internal or external event?"
- Based on answer → Route to correct checklist
- **Pro**: More accurate
- **Con**: Extra friction, breaks seamless flow

**Option C**: Create more specific keywords
- "Corporate training workshop" → employee-engagement
- "Business seminar workshop" → conference
- **Pro**: No conflicts
- **Con**: Requires users to be more specific

**Your preference?**

---

### Question 2: "Corporate Event" - Too Generic?

When user types "Corporate Event", current system maps to Conference.

**Is this the right default?**

**Data we need**:
- What % of "corporate events" are actually conferences vs internal events?
- In Indian market, is "corporate event" more commonly external or internal?

**Options**:
1. Keep current (Corporate → Conference)
2. Change to (Corporate → Employee Engagement) - assume internal
3. Ask clarifying question: "Is this for employees or external guests?"
4. Remove "corporate" from keywords entirely, force users to be specific

**Your call?**

---

### Question 3: Indian Event Types - Coverage Gaps?

**Missing from our checklists**:

1. **Sangeet/Mehendi** (separate from wedding)
   - Currently would map to Party (fallback)
   - Should we create dedicated "Pre-Wedding Events" checklist?

2. **Pooja Ceremonies** (business, not film)
   - Currently "Pooja" maps to Film Events
   - Business Pooja should map to Inauguration?
   - Need to distinguish?

3. **College/University Events**
   - Fest, cultural events, sports meets
   - Currently would map to Party or Conference
   - Need dedicated "Campus Events" checklist?

4. **Government/Political Events**
   - Rallies, public meetings, government functions
   - No good match currently
   - Create "Public Events" checklist?

5. **Community/Religious Events**
   - Temple festivals, community celebrations
   - Would map to Party (fallback)
   - Need "Community Events" checklist?

**Should we add more checklists? Which ones are highest priority?**

---

### Question 4: Multi-Checklist Events - How to Handle?

Some events genuinely need multiple checklists:

**Example**: Grand store opening
- Needs Inauguration (ribbon cutting, VIP management)
- Needs Press Conference (media coverage)
- Needs Promotional Activities (customer engagement)

**Current system**: Shows only ONE checklist
**User pain**: Has to manually combine requirements from multiple sources

**Options**:

**Option A**: Allow multi-select
- After ForgeChat → "Your event may need multiple checklists. Select all that apply:"
- ☑ Inauguration
- ☑ Press Conference
- ☑ Promotional Activities
- System merges all selected checklists
- **Pro**: Comprehensive
- **Con**: Complex to implement, may overwhelm users

**Option B**: "Smart merge"
- System detects keywords like "grand opening with media coverage"
- Automatically loads merged checklist
- **Pro**: No user input needed
- **Con**: Hard to get right, may include unnecessary items

**Option C**: Keep it simple (current approach)
- One event type → One checklist
- User can always add notes for additional requirements
- **Pro**: Simple, clear
- **Con**: May miss important items

**Which approach aligns with our product vision?**

---

### Question 5: Mapping Algorithm - First Match or Best Match?

**Current algorithm**: First match wins

```typescript
for (const [checklistName, keywords] of Object.entries(CHECKLIST_MAPPING)) {
  if (matches) {
    return checklistName; // Returns FIRST match found
  }
}
```

**Problem**: "Workshop" matches Conference first, even though it's also in Employee Engagement

**Alternative**: "Best match" - count keyword matches, return checklist with most matches

**Example**:
- User types: "Corporate team building workshop"
- Conference keywords match: 1 ("corporate")
- Employee Engagement keywords match: 2 ("team building", "workshop")
- Result: Employee Engagement wins (more matches)

**Should we implement "best match" algorithm?**

---

## 🎯 Recommended Discussion Framework

### Step 1: Define Priority Use Cases

What are the TOP 5 most common event types our users will request?

**My guess** (based on Indian market):
1. Weddings (already perfect ✅)
2. Corporate internal events (team building, dealer meets)
3. Birthday parties / celebrations
4. Business inaugurations (store openings)
5. Product launches / press events

**Your data/intuition?**

### Step 2: Map Priority Use Cases to Checklists

For each priority use case:
- What keywords do users typically use?
- Which checklist serves them best?
- Any conflicts or gaps?

### Step 3: Decide on Conflict Resolution Strategy

For overlapping keywords:
- First match (simple, current approach)
- Best match (smarter, more complex)
- Clarifying questions (accurate, adds friction)
- Manual selection (flexible, slower)

### Step 4: Identify New Checklists Needed

Based on market demand:
- Which event types are we missing?
- Which would add most value?
- Priority order for implementation?

---

## 📊 Data We Need

To make informed decisions, we should analyze:

1. **ForgeChat inputs** (first 100 users):
   - What event types do users actually type?
   - Frequency distribution
   - Ambiguous vs clear inputs

2. **User behavior** after checklist loads:
   - Do they immediately bounce? (wrong checklist)
   - Do they customize heavily? (items don't match their needs)
   - Do they complete and proceed? (checklist was right)

3. **Support queries**:
   - "I don't see items for XYZ"
   - "Wrong checklist loaded"
   - "Can I combine two checklists?"

4. **Vendor feedback**:
   - Which checklists lead to best bids?
   - Which are too generic or too specific?

---

## 🚀 Proposed Action Plan

### Phase 1: Quick Wins (This Week)

1. **Fix obvious conflicts**:
   - Remove "workshop" from Conference, keep only in Employee Engagement
   - OR add "corporate workshop" vs "team workshop" disambiguation

2. **Add missing Indian keywords**:
   - Add "sangeet", "mehendi" to Wedding keywords
   - Add "pooja" to Inauguration keywords (in addition to Film Events)

3. **Improve fallback**:
   - Log all fallback cases (event types that don't match)
   - Review weekly to identify patterns

### Phase 2: Medium Term (Next Sprint)

1. **Add clarifying questions** for ambiguous types:
   - "Corporate Event" → Ask: "Internal (employees) or External (clients/partners)?"
   - "Workshop" → Ask: "Training workshop or Business seminar?"

2. **Implement "best match" algorithm**:
   - Count keyword matches
   - Return checklist with highest score
   - Resolves conflicts automatically

3. **Add 2-3 new high-priority checklists** based on data

### Phase 3: Long Term (Future)

1. **Multi-checklist support**:
   - Allow selecting multiple checklists
   - Smart merge algorithm
   - Present as unified checklist to vendors

2. **AI-powered mapping**:
   - Use LLM to understand event type description
   - Map to best checklist(s) based on context
   - Learn from user corrections

3. **Custom checklist builder**:
   - Users create custom checklists
   - Save as templates
   - Share with team

---

## 🎤 Questions for Co-Founder

### Immediate Decisions Needed:

1. **Keyword conflicts**: Fix manually or ask clarifying questions?

2. **"Corporate Event" mapping**: Keep as Conference or change to Employee Engagement?

3. **New checklists priority**: Which 2-3 should we add next?
   - Pre-Wedding Events (Sangeet, Mehendi)
   - Campus Events (College fests)
   - Community Events (Religious, social)
   - Government Events (Public meetings)
   - Other?

4. **Multi-checklist approach**: Keep simple (one checklist) or add complexity (multi-select)?

5. **Mapping algorithm**: First match or best match?

### Strategic Alignment:

6. **Product vision**: Are we building for:
   - Speed (quick, one-click checklist - may be less accurate)
   - Accuracy (questions and clarifications - more friction)
   - Flexibility (multi-select, custom - more complex)

7. **Target market**: Who are we optimizing for?
   - Individual clients (weddings, parties - want simplicity)
   - Corporate clients (repeat users - want accuracy)
   - Event planners (professionals - want flexibility)

8. **Competitive advantage**: Should our checklist system be:
   - Comprehensive (cover every event type - breadth)
   - Intelligent (accurate mapping - depth)
   - Flexible (customizable - control)

---

## 💬 Your Input Needed

Please review and provide your thoughts on:

1. ✅ Priority use cases for Indian market
2. ✅ Conflict resolution strategy
3. ✅ New checklists to add (priority order)
4. ✅ Multi-checklist approach: yes or no?
5. ✅ Mapping algorithm: first match or best match?
6. ✅ Product positioning: speed, accuracy, or flexibility?

**This discussion will shape how 80% of our users experience EventFoundry's core value proposition.**

Let's get this right! 🎯

---

## 📎 Related Files

- [`src/lib/checklistMapper.ts`](src/lib/checklistMapper.ts) - Current mapping implementation
- [`ALL_10_CHECKLISTS_COMPLETE.md`](ALL_10_CHECKLISTS_COMPLETE.md) - Full checklist inventory
- [`/public/data/checklists/`](public/data/checklists/) - All 10 checklist JSON files

---

**Prepared by**: Technical Co-Founder (Claude)
**Date**: 2025-01-06
**Status**: Awaiting strategic input and decision
