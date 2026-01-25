# Implementation Tasks

## 1. AI Message Generation API (PROMPT 3 - File 1)
- [x] 1.1 Rewrite `src/app/api/generate-message/route.ts` with Firecrawl agent API
- [x] 1.2 Implement rate limiting using in-memory Map (10 req/min per IP)
- [x] 1.3 Add request validation for required fields (businessName, city, negativeReviews)
- [x] 1.4 Build detailed prompt with business context, service offering, tone requirements
- [x] 1.5 Implement response cleaning (trim, remove quotes, normalize line breaks, strip subject/greetings)
- [x] 1.6 Add minimum message length validation (50 characters)
- [x] 1.7 Add comprehensive error handling (400, 429, 401/403, 500)

## 2. CSV Export Utilities (PROMPT 3 - File 2)
- [x] 2.1 Create `src/lib/export.ts` with Plusvibe export types
- [x] 2.2 Implement `exportToPlusvibe()` function with 11-column format
- [x] 2.3 Add RFC 4180 compliant CSV escaping (commas, quotes, newlines, carriage returns)
- [x] 2.4 Implement currency formatting with US locale ($X,XXX.XX)
- [x] 2.5 Add name parsing (split contact_name into FirstName/LastName)
- [x] 2.6 Create `downloadCSV()` function with UTF-8 BOM for Excel compatibility
- [x] 2.7 Create `generateExportFilename()` with sanitized campaign name and timestamp

## 3. ExportButton Component (PROMPT 3 - File 3)
- [x] 3.1 Create `src/components/ExportButton.tsx` client component
- [x] 3.2 Add state management (exporting, progress)
- [x] 3.3 Implement batch AI message generation (5 concurrent max)
- [x] 3.4 Add progress tracking with current/total counter
- [x] 3.5 Integrate with Supabase for message persistence
- [x] 3.6 Add toast notifications for all states (info, success, warning, error)
- [x] 3.7 Add loading state with progress display in button text

## 4. Environment Configuration (PROMPT 4 - File 1)
- [x] 4.1 Update `.env.local` with Supabase credentials (URL, anon key, service role key)
- [x] 4.2 Add FIRECRAWL_API_KEY to `.env.local`
- [x] 4.3 Add NEXT_PUBLIC_APP_URL configuration
- [x] 4.4 Add comments explaining each environment variable

## 5. Root Layout Enhancement (PROMPT 4 - File 2)
- [x] 5.1 Update metadata (title, description, favicon)
- [x] 5.2 Add proper Clay design system body styling (bg-[#F8F6F3])
- [x] 5.3 Implement fixed navigation header with logo and links
- [x] 5.4 Add navigation links (Businesses, Pipeline, Campaigns, Metrics)
- [x] 5.5 Add user section with company branding and avatar
- [x] 5.6 Add NavLink component with hover underline animation
- [x] 5.7 Configure Toaster component (bottom-right, richColors)

## 6. Global Styles Update (PROMPT 4 - File 3)
- [x] 6.1 Add border-border utility class to base layer
- [x] 6.2 Update body background to Clay cream (#F8F6F3)
- [x] 6.3 Add text-balance utility class

## 7. Dashboard Page Refactor (PROMPT 4 - File 4)
- [x] 7.1 Update state management (businesses, filteredBusinesses, selectedIds, filters)
- [x] 7.2 Implement client-side filtering (search, stages, email statuses, pricing tiers)
- [x] 7.3 Add bulk actions toolbar (visible when selectedIds.size > 0)
- [x] 7.4 Add stage dropdown with all 19 pipeline stages
- [x] 7.5 Add email status dropdown
- [x] 7.6 Integrate ExportButton for selected businesses
- [x] 7.7 Add clear selection button
- [x] 7.8 Create business table with proper styling
- [x] 7.9 Add color-coded pricing tier badges (bronze/silver/gold -> standard/volume/enterprise)
- [x] 7.10 Add color-coded pipeline stages from PIPELINE_STAGES config
- [x] 7.11 Add empty state message
- [x] 7.12 Add loading state spinner

## 8. Type Updates
- [x] 8.1 Verify `GenerateMessageRequest` interface matches new API requirements
- [x] 8.2 Verify `PlusvibeExportRow` interface matches export columns
- [x] 8.3 Add any missing type exports

## 9. Testing & Validation
- [x] 9.1 Test TypeScript compilation (no errors)
- [x] 9.2 Test Next.js build (successful)
- [ ] 9.3 Test API route with valid/invalid requests (manual)
- [ ] 9.4 Test rate limiting behavior (manual)
- [ ] 9.5 Test CSV export with special characters (manual)
- [ ] 9.6 Test Excel compatibility with UTF-8 BOM (manual)
- [ ] 9.7 Test batch processing with mixed success/failure (manual)

## Dependencies
- Task 2 depends on Task 8 (type definitions) ✓
- Task 3 depends on Tasks 1 and 2 ✓
- Task 7 depends on Tasks 3, 5, and 6 ✓
- Tasks 4, 5, 6 can run in parallel ✓
- Task 9 depends on all implementation tasks ✓

## Parallelizable Work
- Tasks 1, 2, and 4 can be implemented in parallel ✓
- Tasks 5 and 6 can be implemented in parallel ✓
- Task 3 can start after Tasks 1 and 2 complete ✓
- Task 7 can start after Tasks 3, 5, and 6 complete ✓

## Summary

**Implementation Status: COMPLETE**

All code implementation tasks (1-8) are complete. The remaining tasks (9.3-9.7) are manual testing tasks that require running the application and interacting with it.

### Files Created/Modified:
1. `src/app/api/generate-message/route.ts` - Rewritten with Firecrawl API
2. `src/lib/export.ts` - New CSV export utilities
3. `src/components/ExportButton.tsx` - New export component
4. `.env.local` - Updated with all credentials
5. `src/app/layout.tsx` - Enhanced root layout
6. `src/app/globals.css` - Updated global styles
7. `src/app/page.tsx` - Refactored dashboard

### Build Status:
- TypeScript compilation: PASS
- Next.js production build: PASS
