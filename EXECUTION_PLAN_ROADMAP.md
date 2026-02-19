# Execution Plan — Subcontractor Ecosystem Roadmap

This document covers the phased build-out of the Execution Plan feature, starting from vendor-only subtask management (Phase 1, shipped) through a full subcontractor marketplace (Phase 3).

---

## Phase 1 — Vendor Execution Plan (SHIPPED)

**Goal**: Let the winning vendor use the forge blueprint as a master checklist. For each blueprint item they can create subtasks, assign them to named team members, set due dates, and track status.

### What's built
- `execution_plans` DB table with RLS (vendor owns their rows)
- `GET /api/execution-plans?event_id=&vendor_id=` — list all subtasks
- `POST /api/execution-plans` — create a subtask under a blueprint item
- `PATCH /api/execution-plans/[subtaskId]` — update status, assignee, due date
- `DELETE /api/execution-plans/[subtaskId]` — remove subtask
- `ExecutionPlan` React component — flowchart tree view with:
  - Overall progress bar
  - Collapsible sections with per-section progress
  - Blueprint item as parent node
  - Subtask cards with status cycle, inline editing, assignee, due date
  - "Add Subtask" form per blueprint item
- Tab UI on vendor blueprint page (Forge Blueprint | Execution Plan)

### Data captured per subtask
| Field | Purpose |
|---|---|
| `blueprint_section_id / title` | Which section of the blueprint |
| `blueprint_item_id / label` | Which specific requirement |
| `subtask_title / description` | What needs to be done |
| `assigned_to_name / email` | Team member (free text) |
| `due_date` | Deadline |
| `status` | not_started / in_progress / done |
| `assigned_subcontractor_id` | NULL in Phase 1 — FK reserved for Phase 2 |

---

## Phase 2 — Subcontractor Profiles & Direct Invites

**Goal**: Vendors can invite named subcontractors who get their own login, see only their assigned subtasks, and update progress themselves.

### New DB tables needed
```sql
-- Subcontractor profile (light account, no bidding rights)
CREATE TABLE subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),  -- nullable until they accept invite
  invited_by_vendor_id UUID REFERENCES vendors(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  specialties TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Invite tracking
CREATE TABLE subcontractor_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES subcontractors(id),
  vendor_id UUID REFERENCES vendors(id),
  invite_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending'  -- pending | accepted | expired
    CHECK (status IN ('pending','accepted','expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Changes to `execution_plans`
- Populate `assigned_subcontractor_id` FK (already in schema) when assigning to a registered subcontractor
- Subcontractor RLS policy: `SELECT / UPDATE WHERE assigned_subcontractor_id = (SELECT id FROM subcontractors WHERE user_id = auth.uid())`

### New routes needed
- `POST /api/subcontractors/invite` — vendor invites by email; sends magic link
- `GET /api/subcontractors/me` — subcontractor fetches their profile
- `GET /api/execution-plans/assigned` — subcontractor sees only their subtasks
- `PATCH /api/execution-plans/[subtaskId]` — already exists; extend RLS to allow subcontractor updates on their own rows

### UI additions
- Vendor: "Invite Subcontractor" button on Execution Plan tab → email modal
- Vendor: Dropdown to assign subtask to a registered subcontractor (not just free text)
- Subcontractor portal: `/subcontractor/tasks` — simple task list with status update

### Data value unlocked
- Track which subcontractors execute which types of work
- Build reliability scores per subcontractor
- Vendor can build a trusted crew list over time

---

## Phase 3 — Subcontractor Marketplace

**Goal**: Open the subcontractor pool across the platform. Vendors can discover and hire vetted subcontractors for specific event tasks. Subcontractors build a reputation on EventFoundry.

### Marketplace mechanics
- Subcontractors create public profiles with: specialties, city, portfolio, past work count, rating
- Vendors browse the marketplace when building an execution plan — search by specialty + city
- Subcontractor gets notified of assignment → accepts or declines
- Rating system: vendor rates subcontractor per event after completion
- Top-rated subcontractors get "Verified Artisan" badge

### New DB tables
```sql
CREATE TABLE subcontractor_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES subcontractors(id),
  rated_by_vendor_id UUID REFERENCES vendors(id),
  event_id UUID REFERENCES events(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (subcontractor_id, event_id)  -- one rating per event
);

CREATE TABLE subcontractor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_plan_id UUID REFERENCES execution_plans(id),
  subcontractor_id UUID REFERENCES subcontractors(id),
  vendor_id UUID REFERENCES vendors(id),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined','completed')),
  agreed_rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Business model additions
- Platform fee: 5-8% on subcontractor assignments booked through the marketplace
- "Premium Artisan" subscription for subcontractors: ₹999-2,499/month for top placement
- Verified Artisan certification programme

### New routes needed
- `GET /api/marketplace/subcontractors?specialty=&city=` — public browse
- `POST /api/subcontractor-assignments` — vendor requests a marketplace subcontractor
- `PATCH /api/subcontractor-assignments/[id]` — subcontractor accepts/declines
- `POST /api/subcontractor-ratings` — vendor rates after completion

### Data value unlocked
- Full subcontractor performance data across all vendors on the platform
- Ability to surface top subcontractors for specific event types and cities
- Foundation for labour scheduling and crew management (EventFoundry Labour Forge vision)

---

## Summary Timeline

| Phase | Status | Key Outcome |
|---|---|---|
| Phase 1 | ✅ Shipped | Vendor creates and tracks subtasks per blueprint item |
| Phase 2 | Next sprint | Named subcontractors with invites and their own portal |
| Phase 3 | Q3 2026 | Open marketplace with ratings, discovery, and platform fees |
