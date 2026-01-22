-- ReviewCRM Migration: Upgrade to v2.0 Schema
-- Upgrades from v1 (001_create_reviewcrm_schema.sql) to v2.0 (schema.sql)
--
-- Changes:
-- 1. Add ENUM types for pipeline stages, email verification, email outreach
-- 2. Add star breakdown columns and review metrics
-- 3. Convert pricing columns to GENERATED columns
-- 4. Add projected_rating GENERATED column
-- 5. Add validation constraints
-- 6. Enable RLS on all tables
-- 7. Add stage change tracking trigger
--
-- This migration is designed to be safe for existing data.

-- ============================================
-- STEP 1: CREATE ENUM TYPES
-- ============================================

-- Email verification status (Brainzey)
DO $$ BEGIN
  CREATE TYPE email_verification_status_enum AS ENUM (
    'unverified',
    'good',
    'risky',
    'bad'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Email outreach status (Plusvibe)
DO $$ BEGIN
  CREATE TYPE email_outreach_status_enum AS ENUM (
    'not_sent',
    'sent',
    'opened',
    'clicked',
    'replied',
    'bounced',
    'unsubscribed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 19-stage pipeline (from Ops Manual Section 09)
DO $$ BEGIN
  CREATE TYPE pipeline_stage_enum AS ENUM (
    'lead_scraped',
    'email_verified',
    'campaign_ready',
    'outreach_sent',
    'positive_reply',
    'awaiting_audit',
    'audit_complete',
    'proposal_sent',
    'follow_up_1',
    'follow_up_2',
    'qualified_lead',
    'in_negotiation',
    'deal_closed',
    'in_service_delivery',
    'service_complete',
    'payment_collected',
    'follow_up_list',
    'lost_opportunity',
    'do_not_contact'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- STEP 2: ADD MISSING COLUMNS TO CAMPAIGNS
-- ============================================

-- Add template and custom_instructions columns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS template TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS custom_instructions TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS message_template TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS businesses_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS emails_sent INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS emails_opened INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS replies_received INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS deals_closed INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_revenue NUMERIC DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS plusvibe_campaign_id TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS plusvibe_exported_at TIMESTAMPTZ;

-- Make ai_instructions nullable (for backwards compatibility)
ALTER TABLE campaigns ALTER COLUMN ai_instructions DROP NOT NULL;

-- Update status check constraint to include more statuses
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_status_check
  CHECK (status IN ('draft', 'generating', 'ready', 'exported', 'active', 'paused', 'completed'));

-- ============================================
-- STEP 3: ADD MISSING COLUMNS TO BUSINESSES
-- ============================================

-- Rename website to website_url if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'businesses' AND column_name = 'website') THEN
    ALTER TABLE businesses RENAME COLUMN website TO website_url;
  END IF;
END $$;

-- Add website_url if it doesn't exist
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add contact_name and gmaps_url
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS gmaps_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS industry TEXT;

-- Add Google review data columns
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_rating NUMERIC(2,1);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS one_star_reviews INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS two_star_reviews INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS three_star_reviews INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS four_star_reviews INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS five_star_reviews INTEGER DEFAULT 0;

-- ============================================
-- STEP 4: CONVERT PIPELINE_STAGE TO ENUM
-- ============================================

-- Add new enum column
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS pipeline_stage_new pipeline_stage_enum;

-- Migrate existing data - map old TEXT values to new ENUM
UPDATE businesses SET pipeline_stage_new =
  CASE pipeline_stage
    WHEN 'new_lead' THEN 'lead_scraped'::pipeline_stage_enum
    WHEN 'lead_scraped' THEN 'lead_scraped'::pipeline_stage_enum
    WHEN 'email_verified' THEN 'email_verified'::pipeline_stage_enum
    WHEN 'campaign_ready' THEN 'campaign_ready'::pipeline_stage_enum
    WHEN 'outreach_sent' THEN 'outreach_sent'::pipeline_stage_enum
    WHEN 'positive_reply' THEN 'positive_reply'::pipeline_stage_enum
    WHEN 'awaiting_audit' THEN 'awaiting_audit'::pipeline_stage_enum
    WHEN 'audit_complete' THEN 'audit_complete'::pipeline_stage_enum
    WHEN 'proposal_sent' THEN 'proposal_sent'::pipeline_stage_enum
    WHEN 'follow_up_1' THEN 'follow_up_1'::pipeline_stage_enum
    WHEN 'follow_up_2' THEN 'follow_up_2'::pipeline_stage_enum
    WHEN 'qualified_lead' THEN 'qualified_lead'::pipeline_stage_enum
    WHEN 'in_negotiation' THEN 'in_negotiation'::pipeline_stage_enum
    WHEN 'deal_closed' THEN 'deal_closed'::pipeline_stage_enum
    WHEN 'in_service_delivery' THEN 'in_service_delivery'::pipeline_stage_enum
    WHEN 'service_complete' THEN 'service_complete'::pipeline_stage_enum
    WHEN 'payment_collected' THEN 'payment_collected'::pipeline_stage_enum
    WHEN 'follow_up_list' THEN 'follow_up_list'::pipeline_stage_enum
    WHEN 'lost_opportunity' THEN 'lost_opportunity'::pipeline_stage_enum
    WHEN 'do_not_contact' THEN 'do_not_contact'::pipeline_stage_enum
    ELSE 'lead_scraped'::pipeline_stage_enum
  END
WHERE pipeline_stage_new IS NULL;

-- Drop old column and rename new one
ALTER TABLE businesses DROP COLUMN IF EXISTS pipeline_stage;
ALTER TABLE businesses RENAME COLUMN pipeline_stage_new TO pipeline_stage;

-- Set default for pipeline_stage
ALTER TABLE businesses ALTER COLUMN pipeline_stage SET DEFAULT 'lead_scraped'::pipeline_stage_enum;

-- ============================================
-- STEP 5: ADD EMAIL STATUS COLUMNS
-- ============================================

-- Add new email verification status column
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS email_verification_status email_verification_status_enum;

-- Migrate from old email_status if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'businesses' AND column_name = 'email_status') THEN
    UPDATE businesses SET email_verification_status =
      CASE email_status
        WHEN 'unverified' THEN 'unverified'::email_verification_status_enum
        WHEN 'good' THEN 'good'::email_verification_status_enum
        WHEN 'risky' THEN 'risky'::email_verification_status_enum
        WHEN 'bad' THEN 'bad'::email_verification_status_enum
        ELSE 'unverified'::email_verification_status_enum
      END
    WHERE email_verification_status IS NULL;

    ALTER TABLE businesses DROP COLUMN email_status;
  END IF;
END $$;

-- Set default for email_verification_status
ALTER TABLE businesses ALTER COLUMN email_verification_status SET DEFAULT 'unverified'::email_verification_status_enum;

-- Add email outreach status
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS email_outreach_status email_outreach_status_enum DEFAULT 'not_sent';

-- ============================================
-- STEP 6: CONVERT PRICING TO GENERATED COLUMNS
-- ============================================

-- We need to drop and recreate pricing columns as GENERATED
-- First, drop the existing columns
ALTER TABLE businesses DROP COLUMN IF EXISTS pricing_tier;
ALTER TABLE businesses DROP COLUMN IF EXISTS price_per_review;
ALTER TABLE businesses DROP COLUMN IF EXISTS total_project_value;
ALTER TABLE businesses DROP COLUMN IF EXISTS total_media_reviews;

-- Recreate as GENERATED columns
-- Note: total_media_reviews is a dependency for other columns

ALTER TABLE businesses ADD COLUMN total_media_reviews INTEGER GENERATED ALWAYS AS (
  COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)
) STORED;

ALTER TABLE businesses ADD COLUMN pricing_tier TEXT GENERATED ALWAYS AS (
  CASE
    WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) BETWEEN 1 AND 24 THEN 'standard'
    WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) BETWEEN 25 AND 49 THEN 'volume'
    WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) >= 50 THEN 'enterprise'
    ELSE NULL
  END
) STORED;

ALTER TABLE businesses ADD COLUMN price_per_review NUMERIC GENERATED ALWAYS AS (
  CASE
    WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) BETWEEN 1 AND 24 THEN 125
    WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) BETWEEN 25 AND 49 THEN 110
    WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) >= 50 THEN 90
    ELSE 125
  END
) STORED;

ALTER TABLE businesses ADD COLUMN total_project_value NUMERIC GENERATED ALWAYS AS (
  (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) *
  CASE
    WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) BETWEEN 1 AND 24 THEN 125
    WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) BETWEEN 25 AND 49 THEN 110
    WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) >= 50 THEN 90
    ELSE 125
  END
) STORED;

-- Add projected_rating GENERATED column
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS projected_rating NUMERIC(2,1) GENERATED ALWAYS AS (
  CASE
    WHEN COALESCE(total_reviews, 0) - (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) > 0
    THEN ROUND(
      (
        1 * (COALESCE(one_star_reviews, 0) - COALESCE(one_star_media_reviews, 0)) +
        2 * (COALESCE(two_star_reviews, 0) - COALESCE(two_star_media_reviews, 0)) +
        3 * COALESCE(three_star_reviews, 0) +
        4 * COALESCE(four_star_reviews, 0) +
        5 * COALESCE(five_star_reviews, 0)
      )::NUMERIC / (COALESCE(total_reviews, 0) - (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)))
    , 1)
    ELSE NULL
  END
) STORED;

-- ============================================
-- STEP 7: ADD VALIDATION CONSTRAINTS
-- ============================================

-- Email validation
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS valid_email;
ALTER TABLE businesses ADD CONSTRAINT valid_email
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);

-- Phone validation (E.164 format)
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS valid_phone;
ALTER TABLE businesses ADD CONSTRAINT valid_phone
  CHECK (phone ~ '^\+?[1-9]\d{1,14}$' OR phone IS NULL);

-- Google rating validation
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS valid_google_rating;
ALTER TABLE businesses ADD CONSTRAINT valid_google_rating
  CHECK (google_rating IS NULL OR (google_rating >= 1.0 AND google_rating <= 5.0));

-- ============================================
-- STEP 8: UPDATE STAGE_HISTORY TABLE
-- ============================================

-- Rename columns for consistency
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'stage_history' AND column_name = 'from_stage') THEN
    ALTER TABLE stage_history RENAME COLUMN from_stage TO old_stage;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'stage_history' AND column_name = 'to_stage') THEN
    ALTER TABLE stage_history RENAME COLUMN to_stage TO new_stage;
  END IF;
END $$;

-- Add old_stage if it doesn't exist
ALTER TABLE stage_history ADD COLUMN IF NOT EXISTS old_stage TEXT;
ALTER TABLE stage_history ADD COLUMN IF NOT EXISTS new_stage TEXT;
ALTER TABLE stage_history ADD COLUMN IF NOT EXISTS changed_by TEXT;

-- ============================================
-- STEP 9: UPDATE BUSINESS_TAGS TABLE
-- ============================================

-- Drop the id column if it exists (use composite PK instead)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'business_tags' AND column_name = 'id') THEN
    -- First, drop the primary key constraint
    ALTER TABLE business_tags DROP CONSTRAINT IF EXISTS business_tags_pkey;
    -- Drop the unique constraint if it exists
    ALTER TABLE business_tags DROP CONSTRAINT IF EXISTS business_tags_business_id_tag_id_key;
    -- Drop the id column
    ALTER TABLE business_tags DROP COLUMN id;
    -- Add composite primary key
    ALTER TABLE business_tags ADD PRIMARY KEY (business_id, tag_id);
  END IF;
END $$;

-- ============================================
-- STEP 10: ADD MISSING INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_businesses_email_verification_status ON businesses(email_verification_status);
CREATE INDEX IF NOT EXISTS idx_businesses_email_outreach_status ON businesses(email_outreach_status);
CREATE INDEX IF NOT EXISTS idx_stage_history_changed_at ON stage_history(changed_at DESC);

-- ============================================
-- STEP 11: CREATE STAGE CHANGE TRACKING TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION track_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
    INSERT INTO stage_history (business_id, old_stage, new_stage, changed_by)
    VALUES (NEW.id, OLD.pipeline_stage::text, NEW.pipeline_stage::text, current_user);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_business_stage_change ON businesses;
CREATE TRIGGER track_business_stage_change
AFTER UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION track_stage_change();

-- ============================================
-- STEP 12: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Allow all for authenticated users" ON businesses;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON campaigns;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON tags;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON business_tags;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON stage_history;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow all for authenticated users" ON businesses
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON campaigns
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON tags
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON business_tags
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON stage_history
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- STEP 13: CLEANUP DEPRECATED COLUMNS
-- ============================================

-- Remove old social media columns if they exist (not in v2.0 schema)
ALTER TABLE businesses DROP COLUMN IF EXISTS linkedin_url;
ALTER TABLE businesses DROP COLUMN IF EXISTS facebook_url;
ALTER TABLE businesses DROP COLUMN IF EXISTS instagram_url;
ALTER TABLE businesses DROP COLUMN IF EXISTS address;
ALTER TABLE businesses DROP COLUMN IF EXISTS zip;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verification queries (uncomment to run):
-- SELECT column_name, data_type, is_generated FROM information_schema.columns WHERE table_name = 'businesses' ORDER BY ordinal_position;
-- SELECT typname FROM pg_type WHERE typname LIKE '%_enum';
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
