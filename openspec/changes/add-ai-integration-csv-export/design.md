## Context
ReviewCRM is a single-user CRM for 2ndimpression.co reputation management business. The application needs:
1. AI-powered personalized message generation for cold outreach
2. CSV export to Plusvibe.ai format for email campaigns
3. Proper rate limiting and batch processing for API calls

**Stakeholders**: Solo operator (Archer Wolfe), future VA support

**Constraints**:
- Single-user application (no auth complexity)
- 10 requests/min rate limit (Firecrawl API limitation)
- Export must be RFC 4180 compliant for Excel compatibility
- Clay design system aesthetic requirements

## Goals / Non-Goals

### Goals
- Implement Firecrawl agent API integration for message generation
- Add server-side rate limiting with in-memory storage
- Create RFC 4180 compliant CSV export with UTF-8 BOM
- Build batch processing with 5 concurrent API calls max
- Add real-time progress tracking during bulk operations
- Maintain Clay design system consistency

### Non-Goals
- Redis-based rate limiting (in-memory is sufficient for single-user)
- User authentication (single-user app)
- Custom email sending (export to Plusvibe handles this)
- Real-time WebSocket updates (polling/state updates sufficient)

## Decisions

### Decision 1: Firecrawl Agent API over Claude API
**What**: Use Firecrawl `/v1/agent` endpoint instead of direct Claude API
**Why**:
- Temporary placeholder as specified in business requirements
- Agent mode handles autonomous content generation
- Single endpoint simplifies error handling

**Alternatives considered**:
- Direct Claude API: Already implemented but business wants Firecrawl
- OpenAI API: Not requested, would require different SDK

### Decision 2: In-Memory Rate Limiting
**What**: Use `Map<string, { count: number; resetAt: number }>` for rate limiting
**Why**:
- Single-user app doesn't need distributed rate limiting
- Simple implementation, no Redis dependency
- 60-second sliding window with 10 requests max

**Trade-offs**:
- Rate limits reset on server restart
- Not suitable for multi-instance deployment (acceptable for single-user)

### Decision 3: Batch Processing with Promise.allSettled
**What**: Process AI generation in batches of 5 with Promise.allSettled
**Why**:
- Respects API rate limits
- Continues processing even if some requests fail
- Provides accurate success/failure counts

**Alternatives considered**:
- Promise.all: Would fail entire batch on single error
- Sequential processing: Too slow for large datasets

### Decision 4: RFC 4180 CSV with UTF-8 BOM
**What**: Export CSV with proper escaping and UTF-8 BOM prefix
**Why**:
- RFC 4180 ensures compatibility with all CSV parsers
- UTF-8 BOM (`\uFEFF`) enables Excel to properly display Unicode
- Proper escaping handles commas, quotes, newlines in data

### Decision 5: Client-Side Export Trigger
**What**: ExportButton component handles entire flow (generate → save → export)
**Why**:
- Immediate feedback with progress tracking
- Updates local state for seamless UX
- Browser download doesn't require server-side file generation

## Architecture

### API Route Flow
```
POST /api/generate-message
├── Extract IP → Check rate limit → Return 429 if exceeded
├── Validate request body → Return 400 if missing fields
├── Check FIRECRAWL_API_KEY → Return 500 if not configured
├── Build prompt with business context
├── Call Firecrawl agent API
│   ├── 429 → Return "AI service rate limit exceeded"
│   ├── 401/403 → Return "Invalid AI API credentials"
│   └── Success → Extract message from response
├── Clean response (trim, remove quotes, normalize)
├── Validate minimum length (50 chars)
└── Return { message: string }
```

### Export Flow
```
ExportButton.handleExport()
├── Check businesses.length > 0
├── Identify businesses without personalized_message
├── If none need messages → Export immediately
├── If some need messages:
│   ├── Show info toast
│   ├── Process in batches of 5
│   │   ├── Call /api/generate-message for each
│   │   ├── Update Supabase with message
│   │   ├── Update local state
│   │   └── Track progress
│   └── Show success/warning toast with counts
├── Generate Plusvibe CSV format
├── Trigger browser download
└── Show final success toast
```

### Component Hierarchy
```
src/app/page.tsx (DashboardPage)
├── FilterBar
├── Bulk Actions Toolbar (visible when selected)
│   ├── Stage dropdown
│   ├── Email status dropdown
│   ├── ExportButton
│   └── Clear selection button
├── Business Table
│   ├── Checkbox column
│   ├── Business info
│   ├── Review data
│   ├── Pricing badges
│   └── Stage/Email status
└── ImportModal
```

## Risks / Trade-offs

### Risk 1: Firecrawl API Rate Limiting
**Risk**: Exceeding 10 requests/min causes batch failures
**Mitigation**:
- Server-side rate limiting enforced before API call
- Batch processing with delays between batches
- Clear user feedback on rate limit errors

### Risk 2: In-Memory State Loss
**Risk**: Server restart clears rate limit counters
**Mitigation**:
- Acceptable for single-user deployment
- Document for future multi-instance consideration
- Could add Redis in production if needed

### Risk 3: Large Export Performance
**Risk**: Exporting 10K+ businesses with AI generation could timeout
**Mitigation**:
- Batch processing with progress tracking
- Continue on failures (resilient processing)
- Export what succeeded even if some failed

## Migration Plan

### Phase 1: API Route Update
1. Update `src/app/api/generate-message/route.ts` with Firecrawl integration
2. Add rate limiting logic
3. Add response cleaning
4. Test with single requests

### Phase 2: Export Utilities
1. Create `src/lib/export.ts` with CSV functions
2. Test RFC 4180 compliance with special characters
3. Verify Excel compatibility with UTF-8 BOM

### Phase 3: ExportButton Component
1. Create `src/components/ExportButton.tsx`
2. Implement batch processing logic
3. Add progress tracking UI
4. Integration test with dashboard

### Phase 4: App Configuration
1. Update `.env.local` with credentials
2. Update root layout with navigation
3. Enhance globals.css
4. Refactor dashboard page

### Rollback
- Git revert to previous commit
- API key removal from .env.local
- No database migrations required

## Open Questions
- None - all requirements clearly specified in prompts
