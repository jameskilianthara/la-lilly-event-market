# EventFoundry — Master CLAUDE.md (Single Source of Truth)

**Purpose**: One authoritative, unambiguous, developer + product + AI instruction file describing the product vision, UX flow, feature-by-feature behavior, data models, APIs, checklist repository rules, vendor bidding rules, AI/visual generation behaviour, integration points (MCP), deployment, security, and acceptance criteria.

Use this file to onboard engineers, designers, Claude/AI agents, or third-party contractors — everything needed to build, test and operate the product without guessing.

## Table of Contents

1. [Product Summary & Positioning](#1-product-summary--positioning)
2. [High-level User Journeys](#2-high-level-user-journeys)
3. [Homepage & Brand Messaging](#3-homepage--brand-messaging)
4. [Detailed Feature List](#4-detailed-feature-list)
5. [Checklist Repository & Selection Rules](#5-checklist-repository--selection-rules)
6. [Event Page (Single Source of Truth)](#6-event-page-single-source-of-truth)
7. [Vendor Bidding System](#7-vendor-bidding-system)
8. [Contract Generation & E-sign Flow](#8-contract-generation--e-sign-flow)
9. [AI Features & Prompts](#9-ai-features--prompts)
10. [MCP Server (Model Context Protocol)](#10-mcp-server-model-context-protocol)
11. [Data Model (Postgres)](#11-data-model-postgres)
12. [API Spec (REST + Examples)](#12-api-spec-rest--examples)
13. [Frontend Behavior Specifics](#13-frontend-behavior-specifics)
14. [Design & Figma Brief](#14-design--figma-brief)
15. [Dev Workflow & Deployment](#15-dev-workflow--deployment)
16. [Testing & QA Checklist](#16-testing--qa-checklist)
17. [Security & Compliance](#17-security--compliance)
18. [Appendices](#18-appendices)

---

## 1. Product Summary & Positioning

**EventFoundry** is an AI-powered event marketplace connecting clients (hosts) with vendors (service providers). We forge extraordinary events through intelligent technology and artisan craftsmanship.

### Core Differentiators:

1. **Structured Brief Flow**: Client answers 5 core chat questions → platform selects a fixed, predetermined checklist (per event type) from repository → system creates an Event Page (single source of truth).

2. **Vendor Bidding Marketplace**: Vendors submit closed bids; client shortlists top 5; shortlisted vendors receive comparative feedback (percentage higher than lowest bid). Final vendor signs auto-generated contract.

3. **Vendor AI Toolset**: Vendors can generate professional AI visuals/3D sketches inside the app and attach them to bids (vendor-only feature).

4. **Vision Displayed on Homepage**: Includes future ecosystem (employee scheduling, inventory, transport, training). Homepage links to "Forge My Event" (centerpiece CTA).

### Business Model:
- **AI Visual Generation**: ₹50-2,500 per visual (95-99% margins)
- **Vendor Commissions**: 10-15% of booking value
- **Premium Subscriptions**: ₹2,000-10,000/month for vendors
- **Event Management Fees**: 5-8% of total event budget

### Brand Identity:
**EventFoundry** - Where events are forged with precision, craftsmanship, and AI-powered innovation. The foundry metaphor emphasizes:
- **Quality**: Events forged with industrial precision
- **Craftsmanship**: Artisan vendors creating masterpieces
- **Transformation**: Raw ideas forged into extraordinary experiences
- **Strength**: Robust, reliable event execution

---

## 2. High-level User Journeys

### Client (Host) Journey:
1. Visit homepage → Click "Forge My Event"
2. ChatBuilder collects 5 primary answers (conversation + memory)
3. System detects event type → returns a chat message with a link to the selected fixed checklist
4. Client clicks link → reviews checklist, fills optional notes per item
5. System creates Standalone Event Page (event id, metadata, checklist payload)
6. Event posted to vendor pool & selected vendor categories notified
7. Vendors submit closed bids
8. Client reviews, shortlists top 5 bids
9. Platform informs shortlisted vendors of "% above lowest bid"
10. Client selects final vendor → contract auto-generated and e-signed → project moves to execution

### Vendor Journey:
1. Onboard → create profile & services (categories)
2. Receive notification for event matching vendor categories
3. Inspect Event Page (read-only, includes client checklist & reference images)
4. Prepare bid: itemized pricing + optional AI visuals (generated in-app)
5. Submit closed bid
6. If shortlisted: receive comparative feedback (e.g., "12% above lowest")
7. If chosen: accept contract and begin work

### Admin Journey:
1. Monitor pipeline, approve vendors, view metrics, intervene for dispute resolution

---

## 3. Homepage & Brand Messaging — Definitive Content

### Hero (Centerpiece):
- **Headline**: "Forge extraordinary events with master craftsmen"
- **Sub-headline**: "Plan in minutes. Compare bids. Book with confidence."
- **CTA (Primary Center)**: "Forge My Event" (opens ChatBuilder)
- **Small tagline under CTA**: "No signup required — forge a proposal and share it instantly."
- **Secondary CTA**: "Join the Foundry" (goes to vendor onboarding)

### Sections (Order):
1. **Why EventFoundry?** (15+ years, 1,000+ projects, Mumbai-based foundry of events)
2. **How the Foundry works** — 5 step visual strip (Forge → Blueprint → Craftsmen → Bids → Contract)
3. **The EventFoundry Ecosystem** — short blocks:
   - **Labour Forge**: Expert craftsmen management
   - **Supply Chain**: Inventory & transport mastery
   - **Artisan Academy**: Training & certification
   - **Craft Toolkit**: Vendor AI-powered tools
   - **Forge Analytics**: Insights & performance metrics
4. **Master Craftsmen benefits** — AI visuals, qualified leads, centralized bidding forge
5. **Footer** — contact: forge@eventfoundry.com, Mumbai foundry, social links, TOS, Privacy

### Brand Voice & Tone:
India-first, premium, industrial craftsmanship. Forge/foundry metaphors throughout. Use **Editorial Bharat** design language: bold imagery, magazine-style layouts, but with industrial accents - steel blues, foundry oranges, and craft gold (#db2777 → #9d174d → steel blue gradient).

### Key Messaging Pillars:
- **"Forged to Perfection"** - Every event crafted with precision
- **"Master Craftsmen Network"** - Curated artisan vendors
- **"AI-Powered Forge"** - Technology meets traditional craftsmanship
- **"Built to Last"** - Memorable events that endure

---

## 4. Detailed Feature List — Exact Behaviors & Acceptance Criteria

### A. ChatBuilder (Client) - "Event Forge Blueprint"

**User Story**: As a client I want to describe my event in 5 quick steps so the system can select the right blueprint checklist.

**Behavior**:
- Sequential questions: event type, date, city, guest count, venue status
- UI shows "Forging your blueprint..." progress indicators
- Answers saved in session and persisted on event creation
- After 5 answers: bot shows explanatory bubble: "Your event blueprint is ready! Click to review your custom forge checklist."

**Acceptance Criteria**:
- ✅ Answers persist across navigation and reload (session storage + server)
- ✅ Clicking the checklist link opens the blueprint view with the proper checklist pre-selected
- ✅ Back button returns to ChatBuilder with prior messages and answers intact
- ✅ Progress shows "Blueprint Phase" completion

### B. Checklist Repository (Fixed Blueprints) - "Forge Blueprints"

**User Story**: As a product, I want a deterministic mapping from event answers to a single fixed blueprint per event type.

**Behavior**:
- Blueprints stored in `/forge-blueprints/<event-type>.json`
- Mapping rules (see section 5 below)
- Fallback blueprint used when mapping fails
- UI refers to them as "Forge Blueprints" not checklists

**Acceptance Criteria**:
- ✅ For each known event type the exact blueprint JSON is fetched and displayed
- ✅ No dynamic generation of blueprint content from the chat on the fly — blueprint content is only selected from repository
- ✅ UI consistently uses "blueprint" terminology

### C. Event Page Creation - "Forge Project"

**User Story**: As a platform, I need a single source of truth document per event that craftsmen will read and bid against.

**Behavior**:
- When client clicks "Create Forge Project" or "Commission Project", event object is created: eventId, ownerId, answers, blueprintId, blueprintSnapshot, status=OPEN
- The Forge Project is immutable snapshot for bidding (clients can create updated versions)
- URL structure: `/forge/{eventId}`

**Acceptance Criteria**:
- ✅ Forge project displays client answers and entire blueprint (with client notes)
- ✅ Forge project is accessible via stable link and is read-only for vendors
- ✅ UI shows "Forge Project Status", "Blueprint Details", "Craftsmen Requirements"

### D. Vendor AI Toolkit (Craftsmen-Only) - "Forge Visuals"

**User Story**: As a craftsman I want to generate professional visuals to showcase my vision in bids.

**Behavior**:
- Vendors can click "Forge Visuals" inside bid composer
- Platform generates images using vendor-3D/visual prompt template
- **Visuals are not generated automatically for clients. Only craftsmen may forge visuals for bids (platform policy)**
- UI shows "Visual Forge" progress with foundry-themed loading states

**Acceptance Criteria**:
- ✅ Forged visuals appear in vendor draft and can be attached to bids
- ✅ Cost tracked per generation and billed to craftsman account
- ✅ UI uses "Forge Visuals", "Visual Forge", "Crafted Renders" terminology

---

## 5. Checklist Repository & Selection Rules (Definitive) - "Forge Blueprints"

### Location & Format
- **Directory**: `/forge-blueprints/`
- **File naming**: snake_case matching canonical event type keys
- Examples: `wedding_forge.json`, `engagement_forge.json`, `corporate_event_forge.json`, etc.

### Content Structure (Strict)
```json
{
  "eventType": "Wedding",
  "displayName": "Wedding Forge Blueprint",
  "version": "2025-09-01",
  "forgeComplexity": "master", // apprentice | craftsman | master
  "sections": [
    {
      "id": "foundation_specs",
      "title": "Foundation Specifications",
      "description": "Core structural requirements for your event forge",
      "items": [
        { "id": "date_time", "label": "Event date and timing requirements?" },
        { "id": "ceremony_tradition", "label": "Cultural traditions and customs to honor?" }
      ]
    },
    {
      "id": "craft_elements",
      "title": "Craft Elements",
      "description": "Artistic and aesthetic specifications",
      "items": [{"id":"decor_style","label":"Decorative style and theme preferences"}, ...]
    }
  ]
}
```

**Important**: Label fields must match exactly the original checklist entries (case & punctuation) because legal/operational teams might rely on textual exactness.

### Selection Algorithm (Deterministic)
```python
def select_forge_blueprint(chat_answers):
    # event_type is parsed from first answer (or from NLP slot)
    canonical_key = normalize_event_type(chat_answers['event_type'])
    if canonical_key in forge_blueprints_repo:
        return forge_blueprints_repo[canonical_key]
    else:
        # fallback: master_forge_blueprint.json
        return forge_blueprints_repo['master_forge_blueprint']
```

**normalize_event_type** mapping table in `/forge-blueprints/forge_mapping.json`:

```json
{
  "wedding_forge": ["wedding", "marriage", "nikah", "shaadi", "matrimony"],
  "corporate_forge": ["corporate", "business", "conference", "meeting"],
  "celebration_forge": ["birthday", "anniversary", "milestone", "achievement"]
}
```

### Master Forge Blueprint (Fallback)
- Contains comprehensive sections covering all event types
- Used when canonical mapping cannot be resolved
- Labeled as "Master Forge Blueprint - Universal Event Template"

---

## 6. Event Page (Single Source of Truth) — "Forge Project" Schema & Usage

### Forge Project Data Model
```json
{
  "id": "forge_123abc",
  "owner_user_id": "user_456",
  "title": "Anika Wedding Forge - 15 Jun 2025",
  "forge_status": "BLUEPRINT_READY", // BLUEPRINT_READY | OPEN_FOR_BIDS | CRAFTSMEN_BIDDING | SHORTLIST_REVIEW | COMMISSIONED | IN_FORGE | COMPLETED | ARCHIVED
  "client_brief": {
    "event_type": "wedding",
    "date": "2025-06-15",
    "city": "Mumbai",
    "guest_count": 200,
    "venue_status": "not_booked"
  },
  "forge_blueprint": { /* blueprint snapshot - sections + items + client notes */ },
  "created_at": "...",
  "bidding_forge": {
    "craftsmen_bids": ["bid_1", "bid_2", ...],
    "shortlisted_craftsmen": ["bid_5", ...],
    "forge_floor_price": 120000,
    "bidding_closes_at": "2025-09-20T18:00:00Z"
  }
}
```

### Forge Project Behavior
- **Immutable blueprint snapshot** at creation
- Client can create a new version (forgeVersion increment) if they edit significant requirements
- Craftsmen always see the latest published version for bidding
- If client publishes new version while bidding open, craftsmen notified and bidding window extended

### UI Terminology Mapping:
- Event Page → **Forge Project**
- Checklist → **Forge Blueprint**
- Vendors → **Master Craftsmen**
- Bids → **Craft Proposals**
- Status → **Forge Status**

---

## 7. Vendor Bidding System — "Craftsmen Bidding Forge"

### Craft Proposal Structure (Craftsman Submits)
```json
{
  "proposalId": "craft_abc",
  "forgeProjectId": "forge_123abc",
  "craftsmanId": "craftsman_321",
  "craft_specialties": ["stage_mastery", "floral_artistry", "lighting_design"],
  "forge_items": [
    {
      "craftId": "stage_forge",
      "description":"Master-crafted stage with premium lighting forge",
      "quantity":1,
      "unit":"complete_forge",
      "craft_price":250000,
      "materials_cost": 150000,
      "artisan_fee": 100000
    }
  ],
  "subtotal": 300000,
  "taxes": 18000,
  "total_forge_cost": 318000,
  "craft_attachments": ["visual_forge_1.jpg", "blueprint_render_2.png"],
  "craftsman_notes": "We forge with premium materials and backup power systems",
  "estimated_forge_time": "14 days",
  "created_at":"..."
}
```

### Closed Bidding & Foundry Rules
- When a forge project is OPEN_FOR_BIDS and craftsman categories notified:
  - Craftsmen can submit proposals; bids are **closed foundry** — craftsmen cannot see other proposals
  - Admin can define bidding_forge_window (default 7 days)
  - After window closes, client moves to forge review

### Shortlisting Top 5 Craftsmen (Deterministic)
- Shortlist produced by **client**, not platform
- Platform provides UI to sort by total_forge_cost, then craft_complexity, then craftsman_rating
- Auto-shortlist feature: sorts proposals by total ascending, selects first 5 unique craftsmen
- **Forge tie-breaking**: equal totals → prefer shorter estimated_forge_time → higher craftsman_rating → earliest submission

### Forge Pricing Feedback (Exact)
After client selects top 5 craftsmen, platform computes `forge_floor_price` among **all submitted proposals**.

For each shortlisted proposal P_total:
```
forge_premium = round(((P_total - forge_floor_price) / forge_floor_price) * 100)
```

Platform message to shortlisted craftsmen:
> "Congratulations! Your craft proposal has been shortlisted. Your forge pricing is X% above the foundry floor price."

**Foundry confidentiality rule**: only percentage communicated; absolute floor price and competing craftsmen identities never disclosed.

### Final Commission & Forge Contract
When client selects winning craftsman:
- All craftsmen notified: winner gets commission contract, others get "forge closed" notice
- Winner has 48h to accept commission else offer expires
- Platform generates Forge Contract tied to selected proposal

---

## 8. Contract Generation & E-sign Flow — "Forge Commission Contract"

### Contract Source
Generated from Forge Project + Craft Proposal + Forge Milestones.

### Forge Contract Fields (Minimum Required)
- **Forge Project Title & ID**
- **Client (Commissioner) name & contact**
- **Master Craftsman name & contact**
- **Forge Scope Summary** (items from craft proposal)
- **Total Forge Investment** & tax breakdown
- **Forge Milestones**: deposit %, schedule (e.g., 30% on commission, 50% on forge start, 20% on completion)
- **Forge Timeline & critical dates**
- **Craftsman warranty & quality guarantees**
- **Forge cancellation & materials policy**
- **Signature forge** with timestamp & signer credentials

### E-sign Implementation Options
1. **Third-party forge signing** (recommended): DocuSign / HelloSign integration
2. **In-foundry signing**: typed name + email + JWT + audit trail

### Acceptance Criteria
- ✅ Forge Contract generated accurately from Project + Proposal
- ✅ Digital forge signing stored with signed_at, signer_ip, craftsman_email, signature_hash
- ✅ Signed Forge Contract PDF downloadable by both parties

---

## 9. AI Features & Prompts — "AI Forge Assistant & Visual Foundry"

### AI Roles in the Foundry
- **Claude (Forge Assistant)**: orchestrates natural language parsing, blueprint mapping, craftsman matching assistance, automated foundry tasks
- **Visual Foundry**: LeonardoAI / DALL-E / DreamStudio / Sora – craftsmen request renders via UI; system builds prompts from forge project and craftsman notes

### Craftsman Visual Forge Prompt Template (Use Exactly)
```
Master-crafted 3D render of a {event_type} {space_type} forged for {guest_count} guests in {city}.
Forge Style: {style_keywords} (e.g., "Editorial Bharat foundry: industrial elegance, steel-blue gradient, warm forge lighting").
Key Forge Elements: {list_top_items_from_blueprint} (e.g., "steel-framed stage with artisan florals, industrial banquet setup, suspended foundry lighting, craft centerpieces").
Reference Forge Images: {list_urls_of_selected_reference_images}
Foundry Color Palette: {primary_colors}
Forge Deliverables: 5 master images: hero forge shot, stage craft detail, layout forge plan, guest forge perspective, lighting foundry mood.
Output Specifications: 4096x2304 JPG master quality and foundry blueprint PNG.
```

### Client Image Search — Forge Inspiration
For client inspiration only (not auto renders). Generate forge-themed keywords:
- `{event_type} forge decor`
- `{event_type} craftsman setup`
- `{event_type} {city} artisan decor`
- `{event_type} foundry lighting`

### Claude Forge Assistant Prompt
```
Given the client forge requirements: {answers_json}, map to canonical event type using foundry blueprint mapping. If exact match exists, return blueprint key. If ambiguous, return top 3 forge options with confidence scores. Do not create new blueprint content - select only from established forge templates.
```

### Foundry AI Cost & Usage Policy
- Visual forge generation is craftsman-paid
- Platform charges craftsman accounts or logs forge usage for billing
- Maintain craftsman quotas & foundry rate-limits

---

## 10. MCP Server — "Foundry API" Functions (AI Agent Access)

Design MCP as authenticated layer exposing foundry actions to trusted AI agents and automated workflows.

### Essential Foundry API Functions
- `forge_project(user_id, client_brief, metadata)` → returns forgeProjectId
- `get_forge_blueprint(key)` → returns blueprint JSON
- `list_craftsmen_by_specialty(specialty, region)` → returns craftsman list
- `notify_craftsmen(forgeProjectId, craftsmanCategories)`
- `submit_craft_proposal(craftsmanId, forgeProjectId, proposal_payload)`
- `list_proposals(forgeProjectId)`
- `shortlist_craftsmen(clientId, forgeProjectId, proposalIds)`
- `compute_forge_pricing_feedback(forgeProjectId)` → returns floor price and percentages
- `forge_visuals(craftsmanId, render_prompt)` → enqueue, returns jobId
- `generate_forge_contract(forgeProjectId, proposalId)` → returns contract_pdf
- `sign_forge_contract(contractId, signerId)` → capture signature

### Foundry API Security
- All calls require API key & role-based foundry access
- Craftsman-only functions block client requests
- Complete foundry audit trails

---

## 11. Data Model (Postgres) — "Foundry Database Schema"

### Core Foundry Tables

#### users (foundry_users)
- `id`, `email`, `name`, `foundry_role` (CLIENT | CRAFTSMAN | FORGE_ADMIN), `created_at`

#### craftsmen (master_craftsmen)
- `id`, `user_id`, `foundry_name`, `craft_specialties[]`, `forge_location`, `craftsman_rating`, `foundry_profile_json`

#### forge_blueprints
- `id`, `event_type_key`, `version`, `blueprint_content_json`, `forge_complexity`, `created_at`

#### forge_projects (events)
- `id`, `owner_user_id`, `title`, `client_brief_json`, `blueprint_id`, `blueprint_snapshot_json`, `forge_status`, `created_at`

#### craft_proposals (bids)
- `id`, `forge_project_id`, `craftsman_id`, `proposal_payload_json`, `subtotal`, `total_forge_cost`, `craft_attachments[]`, `created_at`

#### forge_contracts (contracts)
- `id`, `forge_project_id`, `proposal_id`, `contract_json`, `pdf_url`, `signatures_json`, `contract_status`, `created_at`

#### foundry_ai_pipeline
- `id`, `forge_type`, `input_json`, `status`, `result_urls[]`, `forge_cost`, `created_at`

---

## 12. API Spec (REST + Examples) — "Foundry API Endpoints"

### Core Foundry Endpoints

#### POST /api/forge/projects
**Payload**: `{ "userId", "clientBrief":{...}, "title": "" }`
Creates forge project, selects blueprint, returns forgeProjectId

#### GET /api/forge/projects/:id
Returns complete Forge Project JSON

#### POST /api/forge/projects/:id/proposals
Craftsman submits proposal. **Payload**: `{ craftsmanId, forgeItems[], craftAttachments[] }`

#### GET /api/forge/projects/:id/proposals
Client/admin view proposals (client sees only after bidding window closed)

#### POST /api/forge/projects/:id/shortlist
Client shortlists craftsmen: `{ shortlistedProposalIds: [] }` → triggers compute_forge_pricing_feedback()

#### POST /api/forge/contracts/commission
`{ forgeProjectId, proposalId }` → returns contractId & pdf url

#### POST /api/forge/contracts/:id/sign
`{ signerId, method: "docusign" | "foundry_internal" }`

#### POST /api/forge/visuals/generate
`{ craftsmanId, forgeProjectId, renderPrompt }` → returns visual forge job

---

## 13. Frontend Behavior Specifics — "Forge UI Flow"

### Forge Memory (Chat State)
- All chat interactions stored in sessionStorage + mirrored to server via `POST /api/forge/projects/draft`
- On reload, forge state restored from server if session exists
- Edits to client brief auto-propagate with message: "Forge blueprint may need refresh"

### Forge Navigation
- On Blueprint page, show "← Back to Forge" control
- Action: navigate back to chat route with rehydrated state
- If client edits brief and proceeds: prompt "Re-forge blueprint from updated requirements? [Yes/No]"

### Foundry Routing
Key foundry routes:
- `/` (foundry homepage)
- `/forge` (chat builder - "Forge My Event")
- `/blueprint/:blueprintId/review` (client blueprint UI)
- `/forge/:forgeProjectId` (forge project page)
- `/craftsmen/dashboard` (craftsman dashboard)
- `/forge/:forgeProjectId/proposals` (craftsman proposal composer)
- `/foundry/admin` (foundry admin)

Use Next.js app router with foundry-themed URLs.

---

## 14. Design & Figma Brief — "EventFoundry Visual Identity"

### Primary Design Direction
**Industrial Craftsmanship meets Editorial Bharat** — foundry aesthetics with magazine-style layouts, steel-blue and forge-orange accents, premium typography.

### Foundry Color Palette
- **Primary**: Steel Blue (#1e3a8a) to Forge Orange (#ea580c) gradient
- **Secondary**: Craft Gold (#f59e0b), Industrial Gray (#6b7280)
- **Accents**: Editorial Bharat purple (#db2777) for premium touches
- **Background**: Foundry White (#fafafa), Deep Steel (#1f2937)

### Mandatory Foundry Screens
1. **Foundry Homepage** with "Forge My Event" hero CTA
2. **Forge Chat Builder** (left chat + right dynamic blueprint preview)
3. **Blueprint Review UI** (collapsible sections, foundry-themed checkboxes + notes)
4. **Forge Project Page** (read-only for craftsmen + action bar)
5. **Craft Proposal Composer** (craftsman side: forge items, attachments, "Forge Visuals" button)
6. **Craftsmen Shortlist & Comparison** (client: foundry table view)
7. **Forge Contract Signing** flow modal

### Foundry UI Components
- **Forge Buttons**: Industrial styling with steel gradients
- **Blueprint Cards**: Steel-framed cards with foundry shadows
- **Craftsman Profiles**: Badge-style craft specialties
- **Progress Indicators**: Foundry-themed with forge completion states
- **Navigation**: Industrial breadcrumbs with forge icons

### Typography & Iconography
- **Headers**: Bold, industrial-weight fonts
- **Body**: Clean, readable sans-serif (Inter/Poppins)
- **Icons**: Foundry-themed - hammers, anvils, gears, blueprints
- **Illustrations**: Industrial craftsmanship with modern touches

---

## 15. Dev Workflow, Environment & Deployment — "Foundry DevOps"

### EventFoundry Repo Structure
```
/foundry-app (nextjs frontend)
  /src
    /components/foundry
    /lib/forge
/foundry-api (node/express backend)
  /src
    /controllers/foundry
    /models/forge
    /mcp/foundry
/forge-blueprints (json)
 /foundry-seeds
/foundry-sql
/foundry-tests
.gitignore
.env.foundry.example
```

### Essential Environment Variables
```bash
# Foundry Database
DATABASE_URL=postgres://user:pass@host:port/eventfoundry_db
FOUNDRY_JWT_SECRET=

# AI Forge Services
LEONARDO_FORGE_KEY=
ANTHROPIC_FORGE_KEY=
OPENAI_FOUNDRY_KEY=

# External Integrations
DOCUSIGN_FOUNDRY_ID=
DOCUSIGN_FOUNDRY_SECRET=
FOUNDRY_S3_BUCKET=

# Foundry Environment
FOUNDRY_ENV=development # development | staging | production
FORGE_API_BASE_URL=http://localhost:5001
```

### Foundry Development Commands
```bash
# Frontend foundry
pnpm install
pnpm dev:foundry

# Backend forge API
cd foundry-api
pnpm install
pnpm dev:forge

# Database migrations
pnpm exec prisma migrate dev --schema foundry.schema

# Foundry tests
pnpm test:foundry
```

### EventFoundry Deployment Strategy
- **Frontend**: Deploy to Vercel with foundry domain
- **Backend**: Google Cloud Run with foundry container
- **Database**: Cloud SQL PostgreSQL (foundry instance)
- **Secrets**: GCP Secret Manager with foundry keys
- **Domain**: eventfoundry.com (production), staging.eventfoundry.com

---

## 16. Testing & QA — "Foundry Quality Assurance"

### Foundry Unit Tests
- **Forge Chat Builder**: saving client brief, session persistence, foundry navigation
- **Blueprint Selection**: forge mapping edge cases, fallback blueprint
- **Proposal Calculations**: forge pricing math, craftsman fee breakdowns

### Foundry Integration Tests
- **Complete Forge Flow**: create project → generate blueprint → project visible to craftsmen
- **Proposal Submission**: forge proposal → compute floor price → percentage feedback
- **Contract Generation**: forge contract creation with proposal details

### Foundry E2E Tests (Cypress/Playwright)
- **Client Foundry Flow**: Forge My Event → chat → blueprint → finalize → visible to craftsmen
- **Craftsman Forge Flow**: login → receive project → submit proposal with visuals → client shortlist → feedback
- **Contract Forge Flow**: commission generation & signing simulation

### Foundry QA Standards
- All foundry tests must pass in CI before merge to main
- Visual regression testing for foundry UI components
- Performance testing for AI visual forge generation
- Security testing for foundry API endpoints

---

## 17. Security & Compliance — "Foundry Security Framework"

### Foundry Data Protection
- **Encryption**: All foundry data encrypted in transit and at rest
- **Access Control**: Foundry RBAC - `/api/foundry/craftsmen/*` only for craftsman role
- **Rate Limiting**: Prevent abuse of visual forge endpoints
- **Audit Trails**: All forge contracts, proposals, and AI generation logged

### Foundry Privacy & Compliance
- **GDPR & Indian Privacy**: Data export & deletion for foundry users
- **Foundry Terms**: Clear legal framework for craftsmen and clients
- **Payment Security**: PCI DSS compliance for foundry transactions
- **Contract Security**: Digital signature verification and storage

---

## 18. Appendices — "Foundry Resources"

### Appendix A — Master Craftsman Visual Forge Prompt (Final)
```
Master-crafted 3D render of an elegant wedding reception forged in Mumbai for 200 guests. Industrial craftsmanship meets traditional celebration. Include: steel-framed stage with artisan florals, foundry-style banquet layout with premium centerpieces, suspended industrial lighting with warm amber glow, craft material textures. Style: EventFoundry signature (steel-blue gradient, forge orange accents, editorial elegance), photorealistic foundry quality, golden hour forge lighting. Deliverables: hero foundry shot, stage craft detail, layout forge blueprint, guest craftsman perspective, lighting foundry mood. Reference forge images: [url1, url2]. Output: 4096x2304 master JPG quality.
```

### Appendix B — Sample Forge Project JSON
```json
{
  "id":"forge_20250901_001",
  "title":"Anika Wedding Forge - 2025-06-15",
  "owner_user_id":"user_10",
  "forge_status":"OPEN_FOR_BIDS",
  "client_brief":{"event_type":"wedding","date":"2025-06-15","city":"Mumbai","guest_count":200,"venue_status":"not_booked"},
  "forge_blueprint":{"eventType":"Wedding","displayName":"Wedding Forge Blueprint","forgeComplexity":"master","sections":[...]}
}
```

### Appendix C — Forge Contract Template
```
EVENTFOUNDRY COMMISSION CONTRACT

Forge Project ID: {forgeProjectId}
Commissioner (Client): {clientName}
Master Craftsman: {craftsmanName}
Foundry: EventFoundry, Mumbai

FORGE SCOPE: {craftProposalItems}
TOTAL FORGE INVESTMENT: {totalForgeInvestment}
FORGE TIMELINE: {forgeTimeline}
PAYMENT FORGE: {forgeMilestones}

Master Craftsman Warranty: All work forged to EventFoundry premium standards
Cancellation Forge Policy: {forgeTerms}

Digital Forge Signatures:
Commissioner: {name + date}
Master Craftsman: {name + date}
EventFoundry Witness: {timestamp}
```

---

## HOW TO USE THIS FOUNDRY BLUEPRINT RIGHT NOW

1. **Initialize EventFoundry Project**:
   ```bash
   mkdir eventfoundry
   cd eventfoundry
   cp CLAUDE.md ./EVENTFOUNDRY_MASTER.md
   ```

2. **Create Forge Blueprints Repository**:
   ```bash
   mkdir forge-blueprints
   # Populate with converted checklists using foundry terminology
   ```

3. **Implement Foundry Mapping**:
   - Create `/forge-blueprints/forge_mapping.json`
   - Ensure deterministic blueprint selection logic

4. **Build Core Forge API**:
   - Implement `POST /api/forge/projects` to create Forge Project snapshots
   - Test craftsman proposal flow on staging foundry

5. **Wire Foundry MCP Functions**:
   - Enable Claude to call `forge_project` and `forge_visuals` as trusted actions
   - Implement foundry authentication and audit trails

---

**This document is the single source of truth for EventFoundry. All development decisions must align with the foundry specifications in this file. Welcome to the foundry - where extraordinary events are forged! 🔥⚒️**