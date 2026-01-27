-- ReviewCRM Migration: CRM Upgrade with Clay.com-style features
-- Adds: Email Accounts, AI Agents, Tasks, Global Blocklist, Campaign Sequences
-- Extends: businesses table with lifecycle_stage and category

-- ============================================
-- STEP 1: EXTEND BUSINESSES TABLE FOR CONTACTS VIEW
-- ============================================

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'lead';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- Add constraint for category values
DO $$ BEGIN
  ALTER TABLE businesses ADD CONSTRAINT businesses_category_check
    CHECK (category IS NULL OR category IN ('partner', 'customer', 'lead'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- STEP 2: EMAIL ACCOUNTS (PlusVibe-style)
-- ============================================

CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'smtp')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'warming', 'error')),
  warmup_enabled BOOLEAN DEFAULT false,
  daily_sent INTEGER DEFAULT 0,
  daily_quota INTEGER DEFAULT 50,
  health_score NUMERIC(5,2) DEFAULT 100,
  spam_rate NUMERIC(5,4) DEFAULT 0,
  bounce_rate NUMERIC(5,4) DEFAULT 0,
  dkim_verified BOOLEAN DEFAULT false,
  spf_verified BOOLEAN DEFAULT false,
  dmarc_verified BOOLEAN DEFAULT false,
  domain TEXT GENERATED ALWAYS AS (split_part(email, '@', 2)) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: AI AGENTS (Claygents)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  model TEXT DEFAULT 'claude-sonnet-4-20250514',
  temperature NUMERIC(2,1) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  mcp_servers JSONB DEFAULT '[]',
  webhook_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 4: AI API KEYS (encrypted storage)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'firecrawl', 'custom')),
  api_key_encrypted TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 5: TASKS
-- ============================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  contact_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  pipeline_stage TEXT,
  assigned_to TEXT,
  due_date DATE,
  labels TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- STEP 6: TASK CHECKLISTS
-- ============================================

CREATE TABLE IF NOT EXISTS task_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 7: TASK COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 8: GLOBAL BLOCKLIST
-- ============================================

CREATE TABLE IF NOT EXISTS global_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  domain TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 9: CAMPAIGN SEQUENCES
-- ============================================

CREATE TABLE IF NOT EXISTS campaign_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  delay_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 10: INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_email_accounts_status ON email_accounts(status);
CREATE INDEX IF NOT EXISTS idx_email_accounts_domain ON email_accounts(domain);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_campaign_id ON tasks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_campaign_id ON campaign_sequences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_lifecycle_stage ON businesses(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_businesses_last_activity_at ON businesses(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_global_blocklist_email ON global_blocklist(email);
CREATE INDEX IF NOT EXISTS idx_global_blocklist_domain ON global_blocklist(domain);

-- ============================================
-- STEP 11: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_blocklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sequences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all" ON email_accounts;
DROP POLICY IF EXISTS "Allow all" ON ai_agents;
DROP POLICY IF EXISTS "Allow all" ON ai_api_keys;
DROP POLICY IF EXISTS "Allow all" ON tasks;
DROP POLICY IF EXISTS "Allow all" ON task_checklists;
DROP POLICY IF EXISTS "Allow all" ON task_comments;
DROP POLICY IF EXISTS "Allow all" ON global_blocklist;
DROP POLICY IF EXISTS "Allow all" ON campaign_sequences;

-- Create RLS policies (allow all for single-user CRM)
CREATE POLICY "Allow all" ON email_accounts FOR ALL USING (true);
CREATE POLICY "Allow all" ON ai_agents FOR ALL USING (true);
CREATE POLICY "Allow all" ON ai_api_keys FOR ALL USING (true);
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all" ON task_checklists FOR ALL USING (true);
CREATE POLICY "Allow all" ON task_comments FOR ALL USING (true);
CREATE POLICY "Allow all" ON global_blocklist FOR ALL USING (true);
CREATE POLICY "Allow all" ON campaign_sequences FOR ALL USING (true);

-- ============================================
-- STEP 12: UPDATE TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_accounts_updated_at ON email_accounts;
CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_agents_updated_at ON ai_agents;
CREATE TRIGGER update_ai_agents_updated_at
  BEFORE UPDATE ON ai_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
