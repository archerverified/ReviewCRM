-- ReviewCRM v2.0 Database Schema
-- Based on PRD Section 4.1
-- Run this migration in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Campaigns table (create first due to FK reference)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  ai_instructions TEXT NOT NULL,
  message_template TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'exported')),
  generated_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses table (primary entity)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  total_reviews INTEGER DEFAULT 0,
  one_star_media_reviews INTEGER DEFAULT 0,
  two_star_media_reviews INTEGER DEFAULT 0,
  total_media_reviews INTEGER GENERATED ALWAYS AS (one_star_media_reviews + two_star_media_reviews) STORED,
  pricing_tier TEXT DEFAULT 'standard' CHECK (pricing_tier IN ('standard', 'volume', 'enterprise')),
  price_per_review INTEGER DEFAULT 125,
  total_project_value INTEGER GENERATED ALWAYS AS ((one_star_media_reviews + two_star_media_reviews) * price_per_review) STORED,
  linkedin_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  email_status TEXT DEFAULT 'unverified' CHECK (email_status IN ('unverified', 'good', 'risky', 'bad')),
  pipeline_stage TEXT DEFAULT 'new_lead',
  personalized_message TEXT,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business-Tags junction table
CREATE TABLE IF NOT EXISTS business_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, tag_id)
);

-- Stage History table (audit log)
CREATE TABLE IF NOT EXISTS stage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email);
CREATE INDEX IF NOT EXISTS idx_businesses_pipeline_stage ON businesses(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_businesses_campaign_id ON businesses(campaign_id);
CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stage_history_business_id ON stage_history(business_id);
CREATE INDEX IF NOT EXISTS idx_business_tags_business_id ON business_tags(business_id);
CREATE INDEX IF NOT EXISTS idx_business_tags_tag_id ON business_tags(tag_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
