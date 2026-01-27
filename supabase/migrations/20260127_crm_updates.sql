-- CRM Updates Migration
-- Add new contact fields to businesses table

-- Add first_name and last_name columns
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add contact_type column with constraint
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contact_type TEXT;
ALTER TABLE businesses ADD CONSTRAINT contact_type_check
  CHECK (contact_type IS NULL OR contact_type IN ('contact', 'business', 'partner', 'customer'));

-- Add contacted status column
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contacted TEXT DEFAULT 'no';
ALTER TABLE businesses ADD CONSTRAINT contacted_check
  CHECK (contacted IS NULL OR contacted IN ('yes', 'no', 'dnr'));

-- Add partner-specific fields
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS resource TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS speciality TEXT;

-- Create pipelines table for custom pipeline support
CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pipeline_stages table for custom stages
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  sort_order INTEGER DEFAULT 0,
  automation_rules JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for pipeline stages ordering
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON pipeline_stages(pipeline_id, sort_order);

-- Create index for businesses by contact_type
CREATE INDEX IF NOT EXISTS idx_businesses_contact_type ON businesses(contact_type);

-- Create index for businesses by contacted status
CREATE INDEX IF NOT EXISTS idx_businesses_contacted ON businesses(contacted);

-- Insert default pipeline if none exists
INSERT INTO pipelines (name, description, is_default)
SELECT 'Default Pipeline', 'Standard sales pipeline', true
WHERE NOT EXISTS (SELECT 1 FROM pipelines WHERE is_default = true);

-- Enable RLS on new tables
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- RLS policies for pipelines (allow all for now - adjust based on auth needs)
CREATE POLICY "Allow all access to pipelines" ON pipelines FOR ALL USING (true);
CREATE POLICY "Allow all access to pipeline_stages" ON pipeline_stages FOR ALL USING (true);
