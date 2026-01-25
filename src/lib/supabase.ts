import { createClient } from '@supabase/supabase-js';
import type {
  Business,
  Campaign,
  Tag,
  FilterState,
  PipelineStage,
  EmailVerificationStatus,
  EmailOutreachStatus,
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
