// Supabase Database Types v2.0
// Matches corrected schema.sql for 2ndimpression.co

// Email verification status (Brainzey)
export type EmailVerificationStatusEnum =
  | 'unverified'
  | 'good'
  | 'risky'
  | 'bad';

// Email outreach status (Plusvibe)
export type EmailOutreachStatusEnum =
  | 'not_sent'
  | 'sent'
  | 'opened'
  | 'clicked'
  | 'replied'
  | 'bounced'
  | 'unsubscribed';

// Pipeline stages (from Ops Manual Section 09)
export type PipelineStageEnum =
  | 'lead_scraped'
  | 'email_verified'
  | 'campaign_ready'
  | 'outreach_sent'
  | 'positive_reply'
  | 'awaiting_audit'
  | 'audit_complete'
  | 'proposal_sent'
  | 'follow_up_1'
  | 'follow_up_2'
  | 'qualified_lead'
  | 'in_negotiation'
  | 'deal_closed'
  | 'in_service_delivery'
  | 'service_complete'
  | 'payment_collected'
  | 'follow_up_list'
  | 'lost_opportunity'
  | 'do_not_contact';

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          business_name: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          website_url: string | null;
          gmaps_url: string | null;
          city: string | null;
          state: string | null;
          industry: string | null;
          // Google Review Data
          google_rating: number | null;
          total_reviews: number;
          // Individual star counts
          one_star_reviews: number;
          two_star_reviews: number;
          three_star_reviews: number;
          four_star_reviews: number;
          five_star_reviews: number;
          // Media reviews (THE PRODUCT)
          one_star_media_reviews: number;
          two_star_media_reviews: number;
          // GENERATED fields (read-only)
          total_media_reviews: number;
          projected_rating: number | null;
          pricing_tier: 'standard' | 'volume' | 'enterprise' | null;
          price_per_review: number;
          total_project_value: number;
          // Pipeline and status
          pipeline_stage: PipelineStageEnum;
          email_verification_status: EmailVerificationStatusEnum;
          email_outreach_status: EmailOutreachStatusEnum;
          personalized_message: string | null;
          notes: string | null;
          campaign_id: string | null;
          // Timestamps
          created_at: string;
          updated_at: string;
          last_contacted_at: string | null;
        };
        Insert: {
          id?: string;
          business_name: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          website_url?: string | null;
          gmaps_url?: string | null;
          city?: string | null;
          state?: string | null;
          industry?: string | null;
          // Google Review Data
          google_rating?: number | null;
          total_reviews?: number;
          // Individual star counts
          one_star_reviews?: number;
          two_star_reviews?: number;
          three_star_reviews?: number;
          four_star_reviews?: number;
          five_star_reviews?: number;
          // Media reviews
          one_star_media_reviews?: number;
          two_star_media_reviews?: number;
          // GENERATED - cannot insert
          // total_media_reviews
          // projected_rating
          // pricing_tier
          // price_per_review
          // total_project_value
          // Pipeline and status
          pipeline_stage?: PipelineStageEnum;
          email_verification_status?: EmailVerificationStatusEnum;
          email_outreach_status?: EmailOutreachStatusEnum;
          personalized_message?: string | null;
          notes?: string | null;
          campaign_id?: string | null;
          // Timestamps
          created_at?: string;
          updated_at?: string;
          last_contacted_at?: string | null;
        };
        Update: {
          id?: string;
          business_name?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          website_url?: string | null;
          gmaps_url?: string | null;
          city?: string | null;
          state?: string | null;
          industry?: string | null;
          // Google Review Data
          google_rating?: number | null;
          total_reviews?: number;
          // Individual star counts
          one_star_reviews?: number;
          two_star_reviews?: number;
          three_star_reviews?: number;
          four_star_reviews?: number;
          five_star_reviews?: number;
          // Media reviews
          one_star_media_reviews?: number;
          two_star_media_reviews?: number;
          // GENERATED - cannot update
          // total_media_reviews
          // projected_rating
          // pricing_tier
          // price_per_review
          // total_project_value
          // Pipeline and status
          pipeline_stage?: PipelineStageEnum;
          email_verification_status?: EmailVerificationStatusEnum;
          email_outreach_status?: EmailOutreachStatusEnum;
          personalized_message?: string | null;
          notes?: string | null;
          campaign_id?: string | null;
          // Timestamps
          created_at?: string;
          updated_at?: string;
          last_contacted_at?: string | null;
        };
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          template: string | null;
          custom_instructions: string | null;
          ai_instructions: string | null;
          message_template: string | null;
          businesses_count: number;
          total_count: number;
          generated_count: number;
          emails_sent: number;
          emails_opened: number;
          replies_received: number;
          deals_closed: number;
          total_revenue: number;
          status: 'draft' | 'generating' | 'ready' | 'exported' | 'active' | 'paused' | 'completed';
          plusvibe_campaign_id: string | null;
          plusvibe_exported_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          template?: string | null;
          custom_instructions?: string | null;
          ai_instructions?: string | null;
          message_template?: string | null;
          businesses_count?: number;
          total_count?: number;
          generated_count?: number;
          emails_sent?: number;
          emails_opened?: number;
          replies_received?: number;
          deals_closed?: number;
          total_revenue?: number;
          status?: 'draft' | 'generating' | 'ready' | 'exported' | 'active' | 'paused' | 'completed';
          plusvibe_campaign_id?: string | null;
          plusvibe_exported_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          template?: string | null;
          custom_instructions?: string | null;
          ai_instructions?: string | null;
          message_template?: string | null;
          businesses_count?: number;
          total_count?: number;
          generated_count?: number;
          emails_sent?: number;
          emails_opened?: number;
          replies_received?: number;
          deals_closed?: number;
          total_revenue?: number;
          status?: 'draft' | 'generating' | 'ready' | 'exported' | 'active' | 'paused' | 'completed';
          plusvibe_campaign_id?: string | null;
          plusvibe_exported_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      business_tags: {
        Row: {
          business_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          business_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          business_id?: string;
          tag_id?: string;
          created_at?: string;
        };
      };
      stage_history: {
        Row: {
          id: string;
          business_id: string;
          old_stage: string | null;
          new_stage: string;
          changed_by: string;
          notes: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          old_stage?: string | null;
          new_stage: string;
          changed_by?: string;
          notes?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          old_stage?: string | null;
          new_stage?: string;
          changed_by?: string;
          notes?: string | null;
          changed_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      pipeline_stage_enum: PipelineStageEnum;
      email_verification_status_enum: EmailVerificationStatusEnum;
      email_outreach_status_enum: EmailOutreachStatusEnum;
    };
  };
};
