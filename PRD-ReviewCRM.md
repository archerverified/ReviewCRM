# Product Requirements Document
## ReviewCRM v2.0 - 2ndImpression Business Management System

---

### Document Info
- **Product:** ReviewCRM (2ndimpression.co CRM)
- **Version:** 2.0 (Complete Rebuild)
- **Owner:** Archer Wolfe
- **Status:** In Development
- **Last Updated:** 2025-01-XX

---

## 1. Executive Summary

### Problem
Current CRM (v1) has fundamental architecture issues:
- Contact-centric model doesn't match business-first workflow
- Broken import flow with incorrect field mapping
- Generic UI that doesn't match operational needs
- No AI personalization integration
- Confusing pipeline structure

### Solution
Build a Clay-style CRM specifically designed for the Google review removal business:
- Business-first data model
- Clean, spacious Clay.com aesthetic
- Seamless D7 Lead Finder → AI Personalization → Plusvibe workflow
- 19-stage pipeline matching actual sales process
- Single-user, no authentication complexity

### Success Criteria
1. Import 10K D7 businesses in under 30 seconds
2. Generate 1,000 AI-personalized messages in under 10 minutes
3. Zero manual data entry for standard workflow
4. Export to Plusvibe works first try, every time
5. 100% of operations can be done from spreadsheet view

---

## 2. Product Overview

### Core Value Proposition
A purpose-built CRM that eliminates all friction in the reputation management sales workflow - from lead scraping to payment collection.

### Target User
- **Primary:** Solo operator (Archer Wolfe)
- **Secondary:** Future VAs for reply handling and delivery tracking

### Key Differentiators
1. **Business-Centric:** Unlike traditional CRMs, businesses are the primary entity
2. **Clay-Style UX:** Spreadsheet-first interface for power users
3. **AI-Native:** Claude API integration for personalization at scale
4. **Workflow-Specific:** Built for one specific business model

---

## 3. User Stories

### Lead Management
- **As a user**, I want to import D7 Lead Finder CSVs with automatic field mapping, so I don't waste time manually mapping columns
- **As a user**, I want to see all business data in a spreadsheet view, so I can quickly scan and filter
- **As a user**, I want to tag businesses by industry/city/campaign, so I can segment for targeted outreach
- **As a user**, I want to see pricing tiers auto-calculate, so I know project values instantly

### Campaign Creation
- **As a user**, I want to create campaigns with AI instructions, so I can generate personalized messages at scale
- **As a user**, I want to preview/edit AI-generated messages, so I maintain quality control
- **As a user**, I want to export campaigns to Plusvibe format, so I can launch outreach immediately

### Pipeline Management
- **As a user**, I want to track businesses through 19 stages, so I know exactly where each prospect is
- **As a user**, I want to move businesses between stages easily, so I can update status quickly
- **As a user**, I want to see stage history, so I can audit the sales process

### Metrics
- **As a user**, I want to see daily KPIs (sends, replies, proposals, closes), so I can track performance
- **As a user**, I want to see project values by stage, so I know pipeline health

---

## 4. Functional Requirements

### 4.1 Data Model

#### Primary Entity: Business
```
- ID (UUID, auto-generated)
- Business Name (required)
- Email
- Phone
- Website
- Address, City, State, Zip
- Total Reviews
- 1-Star Media Reviews (photos/videos)
- 2-Star Media Reviews (photos/videos)
- Total Media Reviews (computed: 1-star + 2-star)
- Pricing Tier (computed: Standard/Volume/Enterprise)
- Price Per Review (computed: $125/$110/$90)
- Total Project Value (computed)
- Social URLs (LinkedIn, Facebook, Instagram)
- Email Status (good/risky/bad/unverified)
- Pipeline Stage (19 stages)
- Personalized Message (AI-generated)
- Campaign ID (FK to campaigns)
- Notes
- Last Contacted At
- Created At, Updated At
```

#### Secondary Entities
- **Tags:** Many-to-many relationship with businesses
- **Campaigns:** Container for AI generation settings
- **Stage History:** Audit log of pipeline movements

### 4.2 Import Flow

#### D7 Lead Finder CSV Import
1. User uploads CSV file
2. System shows preview (first 5 rows)
3. Auto-detect field mapping based on column names
4. User confirms or adjusts mappings
5. Import processes all rows
6. Show success message with count

**Field Mappings (Auto-Detect):**
- Business Name ← "Business Name" or "Name"
- Email ← "Email" or "Contact Email"
- Phone ← "Phone" or "Telephone"
- Website ← "Website" or "URL"
- Address, City, State, Zip ← respective columns
- Review breakdowns ← custom logic

**Edge Cases:**
- Empty rows → skip
- Duplicate emails → show warning, allow import
- Missing required fields → show error, skip row

### 4.3 Clay-Style Spreadsheet

#### Must-Have Features
- AG Grid with custom Clay theme
- Row height: 52px minimum
- Columns: Business Name, Email, Phone, City, Media Reviews, Tier, Project Value, Email Status, Stage
- Checkbox selection (multi-select)
- Inline sorting and filtering
- Pagination (50 rows per page)
- Hover states (subtle gray background)

#### Bulk Actions
- Add tags (multi-select)
- Change stage (single stage)
- Delete businesses (with confirmation)
- Export selected to CSV

### 4.4 AI Campaign Engine

#### Campaign Creation
1. User clicks "New Campaign"
2. Enters campaign name and description
3. Writes AI instructions (e.g., "Focus on quick turnaround, mention trust")
4. Optionally provides message template
5. Selects businesses (by tag or filter)
6. Clicks "Generate Messages"

#### Message Generation Process
1. For each business:
   - Call Claude API with business data + instructions
   - Wait for response (500 token max)
   - Save to `personalized_message` field
   - Update progress bar
2. Mark campaign as "ready"
3. Enable export button

#### Export to Plusvibe
- Format: CSV with columns (FirstName, LastName, Email, CompanyName, City, Phone, MediaReviews, ProjectValue, PersonalizedMessage)
- Filename: `{CampaignName}_{Date}.csv`
- Download to user's machine

### 4.5 Pipeline Management

#### 19 Pipeline Stages
1. New Lead
2. Verified Email
3. Campaign Ready
4. In Warmup
5. Active Outreach
6. Positive Reply
7. Auto-Response Sent
8. Awaiting Audit
9. Audited - Qualified
10. Proposal Sent
11. Follow-Up 1
12. Follow-Up 2
13. Qualified Lead
14. Sales Conversation
15. Deal Closed
16. Service Delivery
17. Completion Report Sent
18. Payment Collection
19. Lost/Nurture

#### Kanban View
- Horizontal columns for each stage
- Cards show business name, city, project value
- Drag-and-drop to change stage (future enhancement)
- Click card to open detail view

### 4.6 Business Detail Page

#### Sections
- **Header:** Business name, stage badge, project value
- **Contact Info:** Email, phone, website, address
- **Review Breakdown:** Total, 1-star media, 2-star media
- **Pricing:** Tier, price per review, total value
- **Campaign:** Link to campaign, view message
- **Notes:** Free-text area for manual tracking
- **Activity:** Stage history with timestamps

### 4.7 Metrics Dashboard

#### Daily KPIs
- Emails sent (target: 400-500)
- Replies received (target: 8-10)
- Audits completed
- Proposals sent
- Deals closed (target: 1-2)

#### Weekly KPIs
- Lead generation metrics
- Sales conversion rates
- Delivery metrics
- Financial summary (revenue, costs, profit)

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Import 10,000 businesses in < 30 seconds
- Spreadsheet renders 50 rows instantly
- AI generates 1 message per second (1,000 in ~16 minutes)
- No loading spinners for < 500ms operations

### 5.2 Design
- Follow Clay.com design system exactly
- Use 8px spacing increments
- Generous white space (96px+ between major sections)
- Rounded corners (12-32px)
- Subtle shadows and borders
- Clean typography hierarchy

### 5.3 Security
- No authentication (single-user app)
- API keys in environment variables only
- No sensitive data in client-side code
- Supabase Row Level Security disabled (trusted user)

### 5.4 Reliability
- No data loss during imports
- All database writes wrapped in error handling
- Clear error messages for failures
- Automatic retries for Claude API (3 attempts)

---

## 6. Technical Architecture

### 6.1 Tech Stack
- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **AI:** Anthropic Claude API (Sonnet 4)
- **Grid:** AG Grid Community
- **CSV:** Papaparse
- **Deployment:** Vercel
- **Version Control:** GitHub

### 6.2 Folder Structure
```
/ReviewCRM
  /src
    /app (Next.js routes)
    /components (React components)
    /lib (utilities, API clients)
    /types (TypeScript definitions)
  /public (static assets)
```

### 6.3 Database Schema
See comprehensive prompt for full SQL schema.

### 6.4 API Integrations
- **Supabase REST API:** All database operations
- **Anthropic API:** Message generation
- **Future:** Brainzey (email verification), Firecrawl (enrichment)

---

## 7. User Interface

### 7.1 Navigation
- Top bar: Logo, main nav (Businesses, Campaigns, Pipeline, Metrics)
- Businesses page: Primary workspace (most time spent here)

### 7.2 Key Screens
1. **Businesses (Home):** Clay-style spreadsheet with import/filter/bulk actions
2. **Campaigns:** List of campaigns, create new, view details
3. **Pipeline:** Kanban board of 19 stages
4. **Metrics:** Dashboard with KPIs
5. **Business Detail:** Individual business page

### 7.3 Design Patterns
- Cards: `rounded-3xl`, `p-8`, subtle shadow
- Buttons: Primary (black), Secondary (outline), Ghost (text-only)
- Inputs: `rounded-lg`, blue focus ring
- Tables: Minimal borders, 52px rows, hover states

---

## 8. Future Roadmap

### Post-MVP Features (Phases 6-10)
1. Brainzey email verification integration
2. Firecrawl website enrichment
3. Built-in email sending (replace Plusvibe)
4. Reply handling automation
5. Automated follow-up sequences

### Long-Term Vision
Full-stack email sequencer + CRM + AI engine that runs the entire business autonomously.

---

## 9. Success Metrics

### Launch Criteria
- [ ] Can import real D7 CSV successfully
- [ ] AI generates quality messages
- [ ] Export to Plusvibe works correctly
- [ ] Pipeline tracking is accurate
- [ ] No major bugs in core workflow

### Post-Launch Metrics (Week 1)
- Import 2-3 campaigns (30,000+ businesses)
- Generate 5,000+ AI messages
- Export 10+ Plusvibe CSVs
- Track 50+ businesses through pipeline
- Zero data loss incidents

---

## 10. Open Questions

- [ ] Should we add Brainzey integration in Phase 1 or wait for Phase 6?
- [ ] Do we need business owner name as separate field?
- [ ] Should tags have hierarchies (parent/child)?
- [ ] What's the best way to handle duplicate businesses across imports?

---

## 11. Appendix

### Reference Documents
- Original operations manual: `2NDIMPRESSION-OPERATIONS-MANUAL_1.md`
- Clay.com design analysis (from previous chat)
- Current codebase (v1) for reference on what NOT to do

### Key Decisions
- **2025-01-XX:** Decided on complete rebuild instead of fixing existing code
- **2025-01-XX:** Chose Clay.com as design inspiration
- **2025-01-XX:** Business-first data model confirmed

---

**End of PRD**