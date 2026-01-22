// Pipeline Stages (19 stages as per PRD)
export const PIPELINE_STAGES = [
  { id: 'new_lead', name: 'New Lead', color: 'gray' },
  { id: 'verified_email', name: 'Verified Email', color: 'blue' },
  { id: 'campaign_ready', name: 'Campaign Ready', color: 'blue' },
  { id: 'in_warmup', name: 'In Warmup', color: 'yellow' },
  { id: 'active_outreach', name: 'Active Outreach', color: 'yellow' },
  { id: 'positive_reply', name: 'Positive Reply', color: 'green' },
  { id: 'auto_response_sent', name: 'Auto-Response Sent', color: 'blue' },
  { id: 'awaiting_audit', name: 'Awaiting Audit', color: 'yellow' },
  { id: 'audited_qualified', name: 'Audited - Qualified', color: 'green' },
  { id: 'proposal_sent', name: 'Proposal Sent', color: 'blue' },
  { id: 'follow_up_1', name: 'Follow-Up 1', color: 'yellow' },
  { id: 'follow_up_2', name: 'Follow-Up 2', color: 'yellow' },
  { id: 'qualified_lead', name: 'Qualified Lead', color: 'green' },
  { id: 'sales_conversation', name: 'Sales Conversation', color: 'green' },
  { id: 'deal_closed', name: 'Deal Closed', color: 'green' },
  { id: 'service_delivery', name: 'Service Delivery', color: 'blue' },
  { id: 'completion_report_sent', name: 'Completion Report Sent', color: 'blue' },
  { id: 'payment_collection', name: 'Payment Collection', color: 'yellow' },
  { id: 'lost_nurture', name: 'Lost/Nurture', color: 'gray' },
] as const

export type PipelineStage = typeof PIPELINE_STAGES[number]['id']

// Email Status
export const EMAIL_STATUSES = ['unverified', 'good', 'risky', 'bad'] as const
export type EmailStatus = typeof EMAIL_STATUSES[number]

// Pricing Tiers - Auto-calculated based on media review count
export const PRICING_TIERS = {
  standard: { minReviews: 1, maxReviews: 24, pricePerReview: 125 },
  volume: { minReviews: 25, maxReviews: 99, pricePerReview: 110 },
  enterprise: { minReviews: 100, maxReviews: Infinity, pricePerReview: 90 },
} as const

export type PricingTier = 'standard' | 'volume' | 'enterprise'

// Business Entity
export interface Business {
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
  pricing_tier: PricingTier
  price_per_review: number
  total_project_value: number
  linkedin_url: string | null
  facebook_url: string | null
  instagram_url: string | null
  email_status: EmailStatus
  pipeline_stage: PipelineStage
  personalized_message: string | null
  campaign_id: string | null
  notes: string | null
  last_contacted_at: string | null
  created_at: string
  updated_at: string
}

// Tag Entity
export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}

// Business-Tag relationship
export interface BusinessTag {
  id: string
  business_id: string
  tag_id: string
  created_at: string
}

// Campaign Entity
export interface Campaign {
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

// Stage History (audit log)
export interface StageHistory {
  id: string
  business_id: string
  from_stage: PipelineStage | null
  to_stage: PipelineStage
  changed_at: string
  notes: string | null
}

// Filter State for UI
export interface FilterState {
  search: string
  tags: string[]
  stages: PipelineStage[]
  emailStatus: EmailStatus[]
}

// D7 CSV Import Mapping
export interface D7FieldMapping {
  business_name: string
  email: string
  phone: string
  website: string
  address: string
  city: string
  state: string
  zip: string
  total_reviews: string
  one_star_media_reviews: string
  two_star_media_reviews: string
}

// Plusvibe Export Format
export interface PlusvibeExportRow {
  FirstName: string
  LastName: string
  Email: string
  CompanyName: string
  City: string
  Phone: string
  MediaReviews: number
  ProjectValue: number
  PersonalizedMessage: string
}

// Helper function to calculate pricing
export function calculatePricing(totalMediaReviews: number): {
  tier: PricingTier
  pricePerReview: number
  totalValue: number
} {
  let tier: PricingTier
  let pricePerReview: number

  if (totalMediaReviews >= PRICING_TIERS.enterprise.minReviews) {
    tier = 'enterprise'
    pricePerReview = PRICING_TIERS.enterprise.pricePerReview
  } else if (totalMediaReviews >= PRICING_TIERS.volume.minReviews) {
    tier = 'volume'
    pricePerReview = PRICING_TIERS.volume.pricePerReview
  } else {
    tier = 'standard'
    pricePerReview = PRICING_TIERS.standard.pricePerReview
  }

  return {
    tier,
    pricePerReview,
    totalValue: totalMediaReviews * pricePerReview,
  }
}

// Helper to get stage info
export function getStageInfo(stageId: PipelineStage) {
  return PIPELINE_STAGES.find((s) => s.id === stageId) || PIPELINE_STAGES[0]
}
