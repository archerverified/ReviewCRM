# Change: Document Database Foundation

## Why

The database schema has evolved significantly from v1 (migration 001) to v2.0 (schema.sql), but only v1 is deployed to Supabase. This change:

1. **Bridges the gap** between deployed database (v1) and source code (v2.0 TypeScript types and query helpers)
2. **Documents the capability** as an authoritative OpenSpec specification for future development
3. **Enables auto-calculated pricing** and projected rating functionality that the business logic depends on

## What Changes

### New Migration
- **NEW** `supabase/migrations/002_upgrade_to_v2_schema.sql`
  - Creates 3 ENUM types: `pipeline_stage_enum`, `email_verification_status_enum`, `email_outreach_status_enum`
  - Adds star breakdown columns (1-5 star reviews, 1-2 star media reviews)
  - Converts pricing columns to GENERATED columns
  - Adds `projected_rating` GENERATED column
  - Adds validation constraints (email, phone, rating)
  - Enables RLS on all tables
  - Adds stage change tracking trigger

### New Specification
- **NEW** `openspec/specs/database-foundation/spec.md`
  - Documents all database requirements and behaviors
  - Includes scenarios for auto-calculations, pipeline tracking, tagging

### Impact
- **Affected specs**: None (new capability)
- **Affected code**: None (TypeScript types already match v2.0 schema)
- **BREAKING**: Migration must be executed in Supabase SQL Editor

## Files

| File | Change |
|------|--------|
| `supabase/migrations/002_upgrade_to_v2_schema.sql` | NEW |
| `openspec/specs/database-foundation/spec.md` | NEW |
| `openspec/changes/document-database-foundation/*` | NEW (this proposal) |

## Dependencies

- Existing `supabase/schema.sql` (reference, no changes)
- Existing `src/types/index.ts` (already v2.0 compatible)
- Existing `src/lib/supabase.ts` (already v2.0 compatible)
