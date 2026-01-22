-- ReviewCRM Database Schema v2.0
-- Corrected schema matching 2ndimpression.co Operations Manual
-- Auto-calculated pricing, projected ratings, 19-stage pipeline

-- ============================================
-- ENUMS
-- ============================================

-- Email verification status (Brainzey)
CREATE TYPE email_verification_status_enum AS ENUM (
  'unverified',
  'good',
  'risky',
  'bad'
);

-- Email outreach status (Plusvibe)
CREATE TYPE email_outreach_status_enum AS ENUM (
  'not_sent',
  'sent',
  'opened',
  'clicked',
  'replied',
  'bounced',
  'unsubscribed'
);

-- 19-stage pipeline (from Ops Manual Section 09)
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

-- ============================================
-- TABLES
-- ============================================

-- Campaigns table (created first due to FK)
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- AI personalization template (both field names for compatibility)
  template TEXT,
  custom_instructions TEXT,
  ai_instructions TEXT,
  message_template TEXT,

  -- Campaign metrics
  businesses_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  generated_count INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  replies_received INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,

  -- Status (draft, generating, ready, exported, active, paused, completed)
  status TEXT DEFAULT 'draft',

  -- Plusvibe integration
  plusvibe_campaign_id TEXT,
  plusvibe_exported_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses table (main entity - matching D7 Lead Finder CSV format)
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info (from D7 CSV)
  business_name TEXT NOT NULL,
  contact_name TEXT,                    -- CSV: PersonName
  email TEXT,                           -- CSV: Email
  phone TEXT,                           -- Manual entry
  website_url TEXT,                     -- CSV: WebsiteURL
  gmaps_url TEXT,                       -- CSV: Gmaps_URL (for auditing)
  city TEXT,                            -- Parsed or manual
  state TEXT,                           -- Parsed or manual
  industry TEXT,                        -- Manual/parsed

  -- Google Review Data (from D7 CSV)
  google_rating NUMERIC(2,1),           -- CSV: Rating (e.g., 3.4)
  total_reviews INTEGER DEFAULT 0,      -- CSV: Reviews

  -- Individual star counts (for projected rating calculation)
  one_star_reviews INTEGER DEFAULT 0,   -- CSV: 1 Star Reviews
  two_star_reviews INTEGER DEFAULT 0,   -- CSV: 2 Star Reviews
  three_star_reviews INTEGER DEFAULT 0, -- CSV: 3 Star Reviews
  four_star_reviews INTEGER DEFAULT 0,  -- CSV: 4 Star Reviews
  five_star_reviews INTEGER DEFAULT 0,  -- CSV: 5 Star Reviews

  -- Media reviews (THE PRODUCT - what we remove)
  one_star_media_reviews INTEGER DEFAULT 0,   -- CSV: 1 Star Reviews w/ Media
  two_star_media_reviews INTEGER DEFAULT 0,   -- CSV: 2 Star Reviews w/ Media

  -- AUTO-CALCULATED: Total media reviews
  total_media_reviews INTEGER GENERATED ALWAYS AS (
    COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)
  ) STORED,

  -- AUTO-CALCULATED: Projected rating after removal
  -- Formula: new_points / remaining_reviews
  -- new_one_star = one_star_reviews - one_star_media_reviews
  -- new_two_star = two_star_reviews - two_star_media_reviews
  -- remaining_reviews = total_reviews - total_media_reviews
  projected_rating NUMERIC(2,1) GENERATED ALWAYS AS (
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
  ) STORED,

  -- AUTO-CALCULATED: Pricing tier based on total media reviews
  -- 1-24: Standard ($125), 25-49: Volume ($110), 50+: Enterprise ($90)
  pricing_tier TEXT GENERATED ALWAYS AS (
    CASE
      WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) BETWEEN 1 AND 24 THEN 'standard'
      WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) BETWEEN 25 AND 49 THEN 'volume'
      WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) >= 50 THEN 'enterprise'
      ELSE NULL
    END
  ) STORED,

  -- AUTO-CALCULATED: Price per review
  price_per_review NUMERIC GENERATED ALWAYS AS (
    CASE
      WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) BETWEEN 1 AND 24 THEN 125
      WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) BETWEEN 25 AND 49 THEN 110
      WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) >= 50 THEN 90
      ELSE 125
    END
  ) STORED,

  -- AUTO-CALCULATED: Total project value
  total_project_value NUMERIC GENERATED ALWAYS AS (
    (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) *
    CASE
      WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) BETWEEN 1 AND 24 THEN 125
      WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) BETWEEN 25 AND 49 THEN 110
      WHEN (COALESCE(one_star_media_reviews, 0) + COALESCE(two_star_media_reviews, 0)) >= 50 THEN 90
      ELSE 125
    END
  ) STORED,

  -- Pipeline tracking
  pipeline_stage pipeline_stage_enum DEFAULT 'lead_scraped',

  -- Two separate email status fields
  email_verification_status email_verification_status_enum DEFAULT 'unverified',
  email_outreach_status email_outreach_status_enum DEFAULT 'not_sent',

  -- AI-generated personalized message
  personalized_message TEXT,

  -- Notes
  notes TEXT,

  -- Campaign tracking
  campaign_id UUID REFERENCES campaigns(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL),
  CONSTRAINT valid_phone CHECK (phone ~ '^\+?[1-9]\d{1,14}$' OR phone IS NULL),
  CONSTRAINT valid_google_rating CHECK (google_rating IS NULL OR (google_rating >= 1.0 AND google_rating <= 5.0))
);

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business-Tags junction table
CREATE TABLE business_tags (
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (business_id, tag_id)
);

-- Stage history table (audit trail)
CREATE TABLE stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  old_stage TEXT,
  new_stage TEXT,
  changed_by TEXT,
  notes TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_businesses_pipeline_stage ON businesses(pipeline_stage);
CREATE INDEX idx_businesses_email_verification_status ON businesses(email_verification_status);
CREATE INDEX idx_businesses_email_outreach_status ON businesses(email_outreach_status);
CREATE INDEX idx_businesses_campaign_id ON businesses(campaign_id);
CREATE INDEX idx_businesses_created_at ON businesses(created_at DESC);
CREATE INDEX idx_businesses_city ON businesses(city);
CREATE INDEX idx_businesses_pricing_tier ON businesses((pricing_tier));
CREATE INDEX idx_businesses_total_media_reviews ON businesses((total_media_reviews));
CREATE INDEX idx_stage_history_business_id ON stage_history(business_id);
CREATE INDEX idx_stage_history_changed_at ON stage_history(changed_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER campaigns_updated_at
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Auto-track stage changes
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

CREATE TRIGGER track_business_stage_change
AFTER UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION track_stage_change();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_history ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (single-user CRM for now)
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
