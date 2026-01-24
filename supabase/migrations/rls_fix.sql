-- Fix RLS Policy for ReviewCRM (Unauthenticated App)
-- Run this ENTIRE script in your Supabase SQL Editor
--
-- Root Cause: App has no authentication but RLS policies require authenticated users
-- Solution: Allow anonymous (anon) role to perform all operations

-- ============================================
-- BUSINESSES TABLE
-- ============================================

-- Drop the restrictive authenticated-only policy
DROP POLICY IF EXISTS "Allow all for authenticated users" ON businesses;

-- Create policies that allow anonymous access
CREATE POLICY "Allow anonymous insert" ON businesses
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON businesses
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous update" ON businesses
  FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anonymous delete" ON businesses
  FOR DELETE TO anon USING (true);

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================

DROP POLICY IF EXISTS "Allow all for authenticated users" ON campaigns;
CREATE POLICY "Allow anonymous all" ON campaigns
  FOR ALL TO anon USING (true);

-- ============================================
-- TAGS TABLE
-- ============================================

DROP POLICY IF EXISTS "Allow all for authenticated users" ON tags;
CREATE POLICY "Allow anonymous all" ON tags
  FOR ALL TO anon USING (true);

-- ============================================
-- BUSINESS_TAGS TABLE
-- ============================================

DROP POLICY IF EXISTS "Allow all for authenticated users" ON business_tags;
CREATE POLICY "Allow anonymous all" ON business_tags
  FOR ALL TO anon USING (true);

-- ============================================
-- STAGE_HISTORY TABLE
-- ============================================

DROP POLICY IF EXISTS "Allow all for authenticated users" ON stage_history;
CREATE POLICY "Allow anonymous all" ON stage_history
  FOR ALL TO anon USING (true);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that policies were created correctly
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  CASE WHEN roles::text LIKE '%anon%' THEN '✓ Allows anon' ELSE '✗ Missing anon' END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('businesses', 'campaigns', 'tags', 'business_tags', 'stage_history')
ORDER BY tablename, policyname;
