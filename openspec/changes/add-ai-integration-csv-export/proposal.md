# Change: Add AI Integration (Firecrawl) & CSV Export with App Configuration

## Why
ReviewCRM needs AI-powered message generation to create personalized cold outreach for reputation management leads, and a CSV export workflow to send qualified businesses to Plusvibe.ai for email campaigns. The existing API route uses Claude API directly but the business requires Firecrawl API integration as a temporary placeholder while rate limiting, batch processing, and proper export formats are missing.

## What Changes

### PROMPT 3: AI Integration & CSV Export
- **NEW**: Replace Claude API with Firecrawl agent API (`/v1/agent`) for message generation
- **NEW**: Add server-side rate limiting (10 requests/min per IP) using in-memory Map
- **NEW**: Add comprehensive error handling with specific HTTP status codes (400, 429, 401, 500)
- **NEW**: Implement response cleaning (remove quotes, normalize line breaks, strip subjects/greetings)
- **NEW**: Create `src/lib/export.ts` with RFC 4180 compliant CSV export utilities
- **NEW**: Create `ExportButton` component with batch AI generation (5 concurrent max)
- **NEW**: Add progress tracking during bulk operations
- **NEW**: Support Plusvibe.ai CSV format with 11 specific columns

### PROMPT 4: App Configuration & Layout
- **MODIFIED**: Update `.env.local` with Supabase and Firecrawl credentials
- **MODIFIED**: Enhance root layout with proper navigation and Clay design system
- **MODIFIED**: Update `globals.css` with additional utility classes
- **MODIFIED**: Refactor dashboard page with bulk actions toolbar and improved table

## Impact
- Affected specs: `ai-message-generation`, `csv-export`, `app-configuration`
- Affected code:
  - `src/app/api/generate-message/route.ts` (rewrite)
  - `src/lib/export.ts` (new file)
  - `src/components/ExportButton.tsx` (new file)
  - `.env.local` (update)
  - `src/app/layout.tsx` (update)
  - `src/app/globals.css` (update)
  - `src/app/page.tsx` (update)
- Dependencies: sonner (already installed)
- No breaking changes to existing database schema
