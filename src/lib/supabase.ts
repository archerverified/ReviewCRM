import { createClient } from '@supabase/supabase-js';
import type {
  Business,
  Campaign,
  Tag,
  FilterState,
  PipelineStage,
  EmailVerificationStatus,
  EmailOutreachStatus,
  EmailAccount,
  AIAgent,
  AIApiKey,
  Task,
  TaskChecklist,
  TaskComment,
  GlobalBlocklistEntry,
  CampaignSequence,
  ContactCategory,
} from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Use loose typing during development - regenerate types from Supabase when schema stabilizes
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Business query helpers
export const businessQueries = {
  async getAll(): Promise<Business[]> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Business[];
  },

  async getById(id: string): Promise<Business | null> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Business | null;
  },

  async getByStage(stage: PipelineStage): Promise<Business[]> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('pipeline_stage', stage)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as Business[];
  },

  async getByFilters(filters: FilterState): Promise<Business[]> {
    let query = supabase.from('businesses').select('*');

    // Search across name, email, city
    if (filters.search) {
      query = query.or(
        `business_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
      );
    }

    // Filter by stages
    if (filters.stages.length > 0) {
      query = query.in('pipeline_stage', filters.stages);
    }

    // Filter by email verification status
    if (filters.emailVerificationStatuses.length > 0) {
      query = query.in('email_verification_status', filters.emailVerificationStatuses);
    }

    // Filter by email outreach status
    if (filters.emailOutreachStatuses.length > 0) {
      query = query.in('email_outreach_status', filters.emailOutreachStatuses);
    }

    // Filter by pricing tier
    if (filters.pricingTiers.length > 0) {
      query = query.in('pricing_tier', filters.pricingTiers);
    }

    // Filter by cities
    if (filters.cities.length > 0) {
      query = query.in('city', filters.cities);
    }

    // Filter by campaigns
    if (filters.campaigns.length > 0) {
      query = query.in('campaign_id', filters.campaigns);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as Business[];
  },

  async updateStage(id: string, newStage: PipelineStage): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .update({ pipeline_stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async bulkUpdateStage(ids: string[], newStage: PipelineStage): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .update({ pipeline_stage: newStage, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) throw error;
  },

  async updateEmailVerificationStatus(id: string, status: EmailVerificationStatus): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .update({ email_verification_status: status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async bulkUpdateEmailVerificationStatus(ids: string[], status: EmailVerificationStatus): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .update({ email_verification_status: status, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) throw error;
  },

  async updateEmailOutreachStatus(id: string, status: EmailOutreachStatus): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .update({ email_outreach_status: status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async bulkUpdateEmailOutreachStatus(ids: string[], status: EmailOutreachStatus): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .update({ email_outreach_status: status, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) throw error;
  },

  async addTag(businessId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from('business_tags')
      .insert({ business_id: businessId, tag_id: tagId });

    if (error) throw error;
  },

  async removeTag(businessId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from('business_tags')
      .delete()
      .eq('business_id', businessId)
      .eq('tag_id', tagId);

    if (error) throw error;
  },

  async create(business: Partial<Business>): Promise<Business> {
    const { data, error } = await supabase
      .from('businesses')
      .insert(business)
      .select()
      .single();

    if (error) throw error;
    return data as Business;
  },

  async bulkCreate(businesses: Partial<Business>[]): Promise<Business[]> {
    const { data, error } = await supabase
      .from('businesses')
      .insert(businesses)
      .select();

    if (error) throw error;
    return data as Business[];
  },

  async update(id: string, updates: Partial<Business>): Promise<Business> {
    const { data, error } = await supabase
      .from('businesses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Business;
  },

  async updatePersonalizedMessage(id: string, message: string): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .update({ personalized_message: message })
      .eq('id', id);

    if (error) throw error;
  },

  async updateOutreachMessage(id: string, message: string): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .update({ outreach_message: message, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async bulkUpdateOutreachMessages(updates: Array<{ id: string; message: string }>): Promise<void> {
    // Process in parallel with Promise.allSettled to handle individual failures
    const results = await Promise.allSettled(
      updates.map(async ({ id, message }) => {
        const { error } = await supabase
          .from('businesses')
          .update({ outreach_message: message, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
        return id;
      })
    );

    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failed.length > 0) {
      throw new Error(`Failed to update ${failed.length} records`);
    }
  },

  async getByIds(ids: string[]): Promise<Business[]> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .in('id', ids);

    if (error) throw error;
    return data as Business[];
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async bulkDelete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  async getByTagIds(tagIds: string[]): Promise<Business[]> {
    if (tagIds.length === 0) return [];

    // Get business IDs from junction table
    const { data: associations, error: assocError } = await supabase
      .from('business_tags')
      .select('business_id')
      .in('tag_id', tagIds);

    if (assocError) throw assocError;

    // Get unique business IDs
    const businessIds = Array.from(new Set(associations?.map((a) => a.business_id) || []));

    if (businessIds.length === 0) return [];

    // Fetch the businesses
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .in('id', businessIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Business[];
  },

  async bulkAssignToCampaign(businessIds: string[], campaignId: string): Promise<void> {
    if (businessIds.length === 0) return;

    const { error } = await supabase
      .from('businesses')
      .update({ campaign_id: campaignId, updated_at: new Date().toISOString() })
      .in('id', businessIds);

    if (error) throw error;
  },
};

// Campaign query helpers
export const campaignQueries = {
  async getAll(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Campaign[];
  },

  async getById(id: string): Promise<Campaign | null> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Campaign | null;
  },

  async create(campaign: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single();

    if (error) throw error;
    return data as Campaign;
  },

  async update(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Campaign;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Tag with business count for campaign creation
export interface TagWithCount extends Tag {
  business_count: number;
}

// Tag query helpers
export const tagQueries = {
  async getAll(): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as Tag[];
  },

  async getTagsWithBusinessCount(): Promise<TagWithCount[]> {
    // Get all tags with their business counts via junction table
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (tagsError) throw tagsError;

    // Get counts for each tag
    const { data: counts, error: countsError } = await supabase
      .from('business_tags')
      .select('tag_id');

    if (countsError) throw countsError;

    // Count businesses per tag
    const countMap = new Map<string, number>();
    counts?.forEach((bt) => {
      countMap.set(bt.tag_id, (countMap.get(bt.tag_id) || 0) + 1);
    });

    return (tags || []).map((tag) => ({
      ...tag,
      business_count: countMap.get(tag.id) || 0,
    })) as TagWithCount[];
  },

  async create(tag: Partial<Tag>): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .insert(tag)
      .select()
      .single();

    if (error) throw error;
    return data as Tag;
  },

  async createAndAssign(name: string, color: string, businessIds: string[]): Promise<Tag> {
    // Create the tag
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .insert({ name, color })
      .select()
      .single();

    if (tagError) throw tagError;

    // Assign tag to all businesses
    if (businessIds.length > 0) {
      const associations = businessIds.map((businessId) => ({
        business_id: businessId,
        tag_id: tag.id,
      }));

      const { error: assocError } = await supabase
        .from('business_tags')
        .insert(associations);

      if (assocError) throw assocError;
    }

    return tag as Tag;
  },

  async assignToBusinesses(tagId: string, businessIds: string[]): Promise<void> {
    if (businessIds.length === 0) return;

    const associations = businessIds.map((businessId) => ({
      business_id: businessId,
      tag_id: tagId,
    }));

    const { error } = await supabase
      .from('business_tags')
      .insert(associations);

    if (error) throw error;
  },

  async update(id: string, updates: Partial<Tag>): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Tag;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getTagsForBusiness(businessId: string): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('business_tags')
      .select('tag_id, tags(*)')
      .eq('business_id', businessId);

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data?.map((bt: any) => bt.tags).filter(Boolean) as Tag[];
  },
};

// ============================================
// EMAIL ACCOUNT QUERIES
// ============================================

export const emailAccountQueries = {
  async getAll(): Promise<EmailAccount[]> {
    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as EmailAccount[];
  },

  async getById(id: string): Promise<EmailAccount | null> {
    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as EmailAccount | null;
  },

  async create(emailAccount: Partial<EmailAccount>): Promise<EmailAccount> {
    const { data, error } = await supabase
      .from('email_accounts')
      .insert(emailAccount)
      .select()
      .single();

    if (error) throw error;
    return data as EmailAccount;
  },

  async update(id: string, updates: Partial<EmailAccount>): Promise<EmailAccount> {
    const { data, error } = await supabase
      .from('email_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as EmailAccount;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('email_accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getMetrics(): Promise<{
    total: number;
    domains: number;
    warmup: number;
    errors: number;
    active: number;
    paused: number;
  }> {
    const { data, error } = await supabase
      .from('email_accounts')
      .select('status, domain, warmup_enabled');

    if (error) throw error;

    const accounts = data || [];
    const domains = new Set(accounts.map(a => a.domain)).size;

    return {
      total: accounts.length,
      domains,
      warmup: accounts.filter(a => a.warmup_enabled).length,
      errors: accounts.filter(a => a.status === 'error').length,
      active: accounts.filter(a => a.status === 'active').length,
      paused: accounts.filter(a => a.status === 'paused').length,
    };
  },

  async updateStatus(id: string, status: EmailAccount['status']): Promise<void> {
    const { error } = await supabase
      .from('email_accounts')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },

  async bulkUpdateStatus(ids: string[], status: EmailAccount['status']): Promise<void> {
    const { error } = await supabase
      .from('email_accounts')
      .update({ status })
      .in('id', ids);

    if (error) throw error;
  },
};

// ============================================
// AI AGENT QUERIES
// ============================================

export const aiAgentQueries = {
  async getAll(): Promise<AIAgent[]> {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as AIAgent[];
  },

  async getById(id: string): Promise<AIAgent | null> {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AIAgent | null;
  },

  async getActive(): Promise<AIAgent[]> {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) throw error;
    return data as AIAgent[];
  },

  async create(agent: Partial<AIAgent>): Promise<AIAgent> {
    const { data, error } = await supabase
      .from('ai_agents')
      .insert(agent)
      .select()
      .single();

    if (error) throw error;
    return data as AIAgent;
  },

  async update(id: string, updates: Partial<AIAgent>): Promise<AIAgent> {
    const { data, error } = await supabase
      .from('ai_agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AIAgent;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_agents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async incrementVersion(id: string): Promise<void> {
    const { data: agent } = await supabase
      .from('ai_agents')
      .select('version')
      .eq('id', id)
      .single();

    if (agent) {
      await supabase
        .from('ai_agents')
        .update({ version: agent.version + 1 })
        .eq('id', id);
    }
  },
};

// ============================================
// AI API KEY QUERIES
// ============================================

export const aiApiKeyQueries = {
  async getAll(): Promise<AIApiKey[]> {
    const { data, error } = await supabase
      .from('ai_api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as AIApiKey[];
  },

  async getByProvider(provider: AIApiKey['provider']): Promise<AIApiKey[]> {
    const { data, error } = await supabase
      .from('ai_api_keys')
      .select('*')
      .eq('provider', provider);

    if (error) throw error;
    return data as AIApiKey[];
  },

  async getDefault(provider: AIApiKey['provider']): Promise<AIApiKey | null> {
    const { data, error } = await supabase
      .from('ai_api_keys')
      .select('*')
      .eq('provider', provider)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as AIApiKey | null;
  },

  async create(apiKey: Partial<AIApiKey>): Promise<AIApiKey> {
    const { data, error } = await supabase
      .from('ai_api_keys')
      .insert(apiKey)
      .select()
      .single();

    if (error) throw error;
    return data as AIApiKey;
  },

  async update(id: string, updates: Partial<AIApiKey>): Promise<AIApiKey> {
    const { data, error } = await supabase
      .from('ai_api_keys')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AIApiKey;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_api_keys')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async setDefault(id: string, provider: AIApiKey['provider']): Promise<void> {
    // First, unset all defaults for this provider
    await supabase
      .from('ai_api_keys')
      .update({ is_default: false })
      .eq('provider', provider);

    // Then set the new default
    const { error } = await supabase
      .from('ai_api_keys')
      .update({ is_default: true })
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// TASK QUERIES
// ============================================

export const taskQueries = {
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Task[];
  },

  async getById(id: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Task | null;
  },

  async getByStatus(status: Task['status']): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', status)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data as Task[];
  },

  async getByContact(contactId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Task[];
  },

  async getByCampaign(campaignId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Task[];
  },

  async getDueToday(): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('due_date', today)
      .neq('status', 'done')
      .order('priority');

    if (error) throw error;
    return data as Task[];
  },

  async getOverdue(): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .lt('due_date', today)
      .neq('status', 'done')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data as Task[];
  },

  async create(task: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    // Auto-set completed_at when status changes to done
    if (updates.status === 'done' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateStatus(id: string, status: Task['status']): Promise<void> {
    const updates: Partial<Task> = { status };
    if (status === 'done') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// TASK CHECKLIST QUERIES
// ============================================

export const taskChecklistQueries = {
  async getByTask(taskId: string): Promise<TaskChecklist[]> {
    const { data, error } = await supabase
      .from('task_checklists')
      .select('*')
      .eq('task_id', taskId)
      .order('sort_order');

    if (error) throw error;
    return data as TaskChecklist[];
  },

  async create(checklist: Partial<TaskChecklist>): Promise<TaskChecklist> {
    const { data, error } = await supabase
      .from('task_checklists')
      .insert(checklist)
      .select()
      .single();

    if (error) throw error;
    return data as TaskChecklist;
  },

  async update(id: string, updates: Partial<TaskChecklist>): Promise<TaskChecklist> {
    const { data, error } = await supabase
      .from('task_checklists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TaskChecklist;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('task_checklists')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleComplete(id: string): Promise<void> {
    const { data: item } = await supabase
      .from('task_checklists')
      .select('is_completed')
      .eq('id', id)
      .single();

    if (item) {
      await supabase
        .from('task_checklists')
        .update({ is_completed: !item.is_completed })
        .eq('id', id);
    }
  },
};

// ============================================
// TASK COMMENT QUERIES
// ============================================

export const taskCommentQueries = {
  async getByTask(taskId: string): Promise<TaskComment[]> {
    const { data, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as TaskComment[];
  },

  async create(comment: Partial<TaskComment>): Promise<TaskComment> {
    const { data, error } = await supabase
      .from('task_comments')
      .insert(comment)
      .select()
      .single();

    if (error) throw error;
    return data as TaskComment;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// GLOBAL BLOCKLIST QUERIES
// ============================================

export const globalBlocklistQueries = {
  async getAll(): Promise<GlobalBlocklistEntry[]> {
    const { data, error } = await supabase
      .from('global_blocklist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as GlobalBlocklistEntry[];
  },

  async create(entry: Partial<GlobalBlocklistEntry>): Promise<GlobalBlocklistEntry> {
    const { data, error } = await supabase
      .from('global_blocklist')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data as GlobalBlocklistEntry;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('global_blocklist')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async bulkDelete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('global_blocklist')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  async isBlocked(email: string): Promise<boolean> {
    const domain = email.split('@')[1];

    const { data, error } = await supabase
      .from('global_blocklist')
      .select('id')
      .or(`email.eq.${email},domain.eq.${domain}`)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  },

  async bulkCreate(entries: Partial<GlobalBlocklistEntry>[]): Promise<GlobalBlocklistEntry[]> {
    const { data, error } = await supabase
      .from('global_blocklist')
      .insert(entries)
      .select();

    if (error) throw error;
    return data as GlobalBlocklistEntry[];
  },
};

// ============================================
// CAMPAIGN SEQUENCE QUERIES
// ============================================

export const campaignSequenceQueries = {
  async getByCampaign(campaignId: string): Promise<CampaignSequence[]> {
    const { data, error } = await supabase
      .from('campaign_sequences')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('step_number');

    if (error) throw error;
    return data as CampaignSequence[];
  },

  async create(sequence: Partial<CampaignSequence>): Promise<CampaignSequence> {
    const { data, error } = await supabase
      .from('campaign_sequences')
      .insert(sequence)
      .select()
      .single();

    if (error) throw error;
    return data as CampaignSequence;
  },

  async update(id: string, updates: Partial<CampaignSequence>): Promise<CampaignSequence> {
    const { data, error } = await supabase
      .from('campaign_sequences')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CampaignSequence;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('campaign_sequences')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async reorder(campaignId: string, sequenceIds: string[]): Promise<void> {
    // Update step numbers based on array order
    const updates = sequenceIds.map((id, index) =>
      supabase
        .from('campaign_sequences')
        .update({ step_number: index + 1 })
        .eq('id', id)
    );

    await Promise.all(updates);
  },
};

// ============================================
// CONTACT (BUSINESS) EXTENDED QUERIES
// ============================================

export const contactQueries = {
  async getByCategory(category: ContactCategory): Promise<Business[]> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('category', category)
      .order('last_activity_at', { ascending: false });

    if (error) throw error;
    return data as Business[];
  },

  async updateCategory(id: string, category: ContactCategory | null): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .update({ category, last_activity_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async bulkUpdateCategory(ids: string[], category: ContactCategory | null): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .update({ category, last_activity_at: new Date().toISOString() })
      .in('id', ids);

    if (error) throw error;
  },

  async updateLifecycleStage(id: string, lifecycleStage: string): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .update({ lifecycle_stage: lifecycleStage, last_activity_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async getCategoryCounts(): Promise<{
    all: number;
    businesses: number;
    partners: number;
    customers: number;
    uncategorized: number;
  }> {
    const { data, error } = await supabase
      .from('businesses')
      .select('category, contact_type');

    if (error) throw error;

    const records = data || [];
    return {
      all: records.length,
      businesses: records.filter(b => b.category === 'business' || b.contact_type === 'business').length,
      partners: records.filter(b => b.category === 'partner' || b.contact_type === 'partner').length,
      customers: records.filter(b => b.category === 'customer' || b.contact_type === 'customer').length,
      uncategorized: records.filter(b => !b.category && !b.contact_type).length,
    };
  },
};
