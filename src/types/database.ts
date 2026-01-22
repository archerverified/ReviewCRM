// Supabase Database Types (auto-generated structure)
export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          business_name: string
          email: string | null
          phone: string | null
          website: string | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          total_reviews: number
          one_star_media_reviews: number
          two_star_media_reviews: number
          total_media_reviews: number
          pricing_tier: 'standard' | 'volume' | 'enterprise'
          price_per_review: number
          total_project_value: number
          linkedin_url: string | null
          facebook_url: string | null
          instagram_url: string | null
          email_status: 'unverified' | 'good' | 'risky' | 'bad'
          pipeline_stage: string
          personalized_message: string | null
          campaign_id: string | null
          notes: string | null
          last_contacted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_name: string
          email?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          total_reviews?: number
          one_star_media_reviews?: number
          two_star_media_reviews?: number
          total_media_reviews?: number
          pricing_tier?: 'standard' | 'volume' | 'enterprise'
          price_per_review?: number
          total_project_value?: number
          linkedin_url?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          email_status?: 'unverified' | 'good' | 'risky' | 'bad'
          pipeline_stage?: string
          personalized_message?: string | null
          campaign_id?: string | null
          notes?: string | null
          last_contacted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          email?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          total_reviews?: number
          one_star_media_reviews?: number
          two_star_media_reviews?: number
          total_media_reviews?: number
          pricing_tier?: 'standard' | 'volume' | 'enterprise'
          price_per_review?: number
          total_project_value?: number
          linkedin_url?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          email_status?: 'unverified' | 'good' | 'risky' | 'bad'
          pipeline_stage?: string
          personalized_message?: string | null
          campaign_id?: string | null
          notes?: string | null
          last_contacted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      business_tags: {
        Row: {
          id: string
          business_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          name: string
          description: string | null
          ai_instructions: string
          message_template: string | null
          status: 'draft' | 'generating' | 'ready' | 'exported'
          generated_count: number
          total_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          ai_instructions: string
          message_template?: string | null
          status?: 'draft' | 'generating' | 'ready' | 'exported'
          generated_count?: number
          total_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          ai_instructions?: string
          message_template?: string | null
          status?: 'draft' | 'generating' | 'ready' | 'exported'
          generated_count?: number
          total_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      stage_history: {
        Row: {
          id: string
          business_id: string
          from_stage: string | null
          to_stage: string
          changed_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          business_id: string
          from_stage?: string | null
          to_stage: string
          changed_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          from_stage?: string | null
          to_stage?: string
          changed_at?: string
          notes?: string | null
        }
      }
    }
  }
}
