-- Fix RLS Policy for Businesses Table Import
-- Run this in your Supabase SQL Editor

-- Option 1: Allow all authenticated users to insert businesses
-- (Use this if you're logged in to the app)
CREATE POLICY "Allow authenticated users to insert businesses"
ON businesses
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Option 2: Temporarily disable RLS to test (NOT recommended for production)
-- ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;

-- Option 3: Allow inserts from service role (for server-side imports)
CREATE POLICY "Allow service role to insert businesses"
ON businesses
FOR INSERT
TO service_role
WITH CHECK (true);

-- To check current policies:
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'businesses';
