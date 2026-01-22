# Project Context

## Purpose
ReviewCRM is a purpose-built CRM designed specifically for the Google review removal business (2ndimpression.co). It streamlines the workflow from lead scraping to payment collection by eliminating friction through a business-first data model, Clay-style spreadsheet UI, and AI-native personalization using Claude API.

## Tech Stack
- **Frontend Framework:** Next.js 14 (React 18, TypeScript 5.3)
- **Styling:** Tailwind CSS with PostCSS
- **Backend:** Next.js API routes (serverless)
- **Database:** Supabase (PostgreSQL)
- **UI Components:** AG Grid Community (spreadsheet-style views)
- **AI Integration:** Anthropic Claude API (@anthropic-ai/sdk) & Firecrawl API / MCP
- **Data Import:** PapaParse (CSV parsing)
- **Type System:** TypeScript with strict mode enabled
- **Testing:** Jest with React Testing Library
- **Linting:** ESLint (Next.js config)

## Project Conventions

### Code Style
- **Language:** TypeScript with strict mode enabled
- **Naming:** camelCase for variables/functions, PascalCase for components/types
- **File Structure:** Co-locate components with their types; API routes in `src/app/api/`
- **Path Aliases:** Use `@/` prefix for imports from `src/`
- **Formatting:** Tailwind CSS for all styling (no custom CSS except globals)
- **Modules:** ES modules (`"type": "module"` in package.json)

### Architecture Patterns
- **Business-Centric Model:** Business entity is the primary domain object, not contacts
- **Data-Driven UI:** Spreadsheet-first interface (AG Grid) for power-user operations
- **19-Stage Pipeline:** Custom pipeline structure matching actual sales process
- **Computed Fields:** Pricing tier and project value calculated from review data
- **Component Organization:** 
  - `src/components/` - Reusable UI components
  - `src/app/` - Pages and API routes (Next.js app router)
  - `src/lib/` - Utility functions, integrations, Supabase client
  - `src/types/` - TypeScript type definitions

### Testing Strategy
- **Framework:** Jest with jest-environment-jsdom
- **Coverage:** Testing Library for React components
- **Scripts:** `npm test` (single run), `npm run test:watch` (watch mode)
- **Focus:** Integration tests over unit tests; test user workflows

### Git Workflow
- **Not specified in current project** - Use conventional commits where possible
- **Branch strategy:** Implement when needed
- **Commit messages:** Descriptive, imperative mood (e.g., "Add business import modal")

## Domain Context
**ReviewCRM is specifically built for:**
- Solo operator (Archer Wolfe) initially; future VA support for reply handling
- Google review removal/reputation management business
- Importing leads from D7 Lead Finder CSVs
- Verifying and enriching emails for validitiy
- AI-personalized outreach and enrichment via Claude and/or Firecrawl
- Export to Plusvibe format for campaign launch

**Key Workflows:**
1. **Import:** D7 Lead Finder CSV → Auto field mapping → Verify contact info → Valid/good → Database
2. **Enrich:** Auto-calculate pricing tiers ($125/$110/$90 per review) and project values
3. **Generate:** Create AI-personalized messages and enrichment at scale using Claude and/or Firecrawl
4. **Export:** Format for Plusvibe integration
5. **Track:** Monitor through 19-stage pipeline with metrics (sends, replies, proposals, closes)

**Terminology:**
- **Business:** Primary entity (company being contacted)
- **Media Reviews:** 1-star or 2-star reviews with photos/videos (high-value targets)
- **Pricing Tier:** Standard/Volume/Enterprise based on media review count
- **Campaign:** Container for AI generation instructions and resulting personalized messages
- **Pipeline Stage:** One of 19 stages tracking business progress through sales process

## Important Constraints
- **Single-User:** No authentication complexity; built for solo operator
- **Performance Requirements:**
  - Import 10K businesses in under 30 seconds
  - Generate 1,000 AI messages in under 10 minutes
- **Field Mapping:** Auto-detect D7 Lead Finder CSV columns (Business Name, Email, Phone, Website, etc.)
- **Data Integrity:** Handle duplicates gracefully with warnings; skip rows with missing required fields
- **UI/UX:** Clay.com aesthetic - spacious, spreadsheet-first (52px min row height)

## External Dependencies
- **Supabase:** PostgreSQL database with migrations in `supabase/migrations/`
- **Anthropic Claude API:** Text generation for personalized message creation
- **AG Grid Community:** Free version for spreadsheet UI (no enterprise features)
- **D7 Networks:** Lead Finder exports (CSV format)
- **Plusvibe:** Campaign export target (format TBD)

