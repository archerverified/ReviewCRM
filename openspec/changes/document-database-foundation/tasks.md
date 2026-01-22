# Tasks: Document Database Foundation

## 1. Schema Migration

- [x] 1.1 Analyze v1 migration vs v2.0 schema differences
- [x] 1.2 Create `002_upgrade_to_v2_schema.sql` migration file
- [x] 1.3 Include ENUM type creation with error handling
- [x] 1.4 Include column additions and conversions
- [x] 1.5 Include GENERATED column definitions
- [x] 1.6 Include validation constraints
- [x] 1.7 Include RLS policies
- [x] 1.8 Include stage change tracking trigger

## 2. OpenSpec Documentation

- [x] 2.1 Create change proposal directory structure
- [x] 2.2 Write proposal.md with Why/What/Impact
- [x] 2.3 Write tasks.md (this file)
- [x] 2.4 Write specs/database-foundation/spec.md with all requirements

## 3. Validation

- [x] 3.1 Run `npx tsc --noEmit` to verify TypeScript compiles
- [x] 3.2 Run `openspec validate document-database-foundation --strict --no-interactive`

## 4. Deployment

- [x] 4.1 Execute migration in Supabase SQL Editor
- [x] 4.2 Verify tables, columns, and constraints created
- [x] 4.3 Verify ENUM types exist
- [x] 4.4 Verify RLS policies enabled
- [x] 4.5 Test GENERATED columns calculate correctly

## 5. Functional Verification

- [x] 5.1 Insert test business with review data
- [x] 5.2 Verify `total_media_reviews` auto-calculates (15 ✓)
- [x] 5.3 Verify `pricing_tier` auto-calculates ('standard' ✓)
- [x] 5.4 Verify `price_per_review` auto-calculates (125 ✓)
- [x] 5.5 Verify `total_project_value` auto-calculates (1875 ✓)
- [x] 5.6 Verify `projected_rating` auto-calculates (4.2 ✓)
- [x] 5.7 Verify stage change creates history record (✓)
