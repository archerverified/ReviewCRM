// ReviewCRM TypeScript Types v2.0
// Matches corrected database schema for 2ndimpression.co

// 19 pipeline stages (from Ops Manual Section 09)
export type PipelineStage =
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

// Email verification status (Brainzey)
export type EmailVerificationStatus =
  | 'unverified'
  | 'good'
  | 'risky'
  | 'bad';

// Email outreach status (Plusvibe)
export type EmailOutreachStatus =
  | 'not_sent'
  | 'sent'
  | 'opened'
  | 'clicked'
  | 'replied'
  | 'bounced'
  | 'unsubscribed';

// Pricing tiers: standard/volume/enterprise
export type PricingTier = 'standard' | 'volume' | 'enterprise';

// Core business entity (matches D7 Lead Finder CSV format)
export interface Business {
  id: string;

  // Basic info
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

  // Auto-calculated fields (GENERATED)
  total_media_reviews: number;
  projected_rating: number | null;
  pricing_tier: PricingTier | null;
  price_per_review: number;
  total_project_value: number;

  // Pipeline and status
  pipeline_stage: PipelineStage;
  email_verification_status: EmailVerificationStatus;
  email_outreach_status: EmailOutreachStatus;
  personalized_message: string | null;
  outreach_message: string | null;

  // Campaign and notes
  notes: string | null;
  campaign_id: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
}

// Campaign status
export type CampaignStatus = 'draft' | 'generating' | 'ready' | 'exported' | 'active' | 'paused' | 'completed';

// Campaign
export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  // AI personalization (both field names supported for compatibility)
  template: string | null;
  custom_instructions: string | null;
  ai_instructions: string | null;
  message_template: string | null;
  // Counts
  businesses_count: number;
  total_count: number;
  generated_count: number;
  emails_sent: number;
  emails_opened: number;
  replies_received: number;
  deals_closed: number;
  total_revenue: number;
  // Status
  status: CampaignStatus;
  // Plusvibe integration
  plusvibe_campaign_id: string | null;
  plusvibe_exported_at: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Tag
export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

// Business-Tag junction
export interface BusinessTag {
  business_id: string;
  tag_id: string;
  created_at: string;
}

// Stage history for audit trail
export interface StageHistory {
  id: string;
  business_id: string;
  old_stage: string | null;
  new_stage: string;
  changed_by: string;
  notes: string | null;
  changed_at: string;
}

// Filter state for UI
export interface FilterState {
  search: string;
  stages: PipelineStage[];
  emailVerificationStatuses: EmailVerificationStatus[];
  emailOutreachStatuses: EmailOutreachStatus[];
  tags: string[];
  pricingTiers: PricingTier[];
  cities: string[];
  campaigns: string[];
}

// Metric card for dashboard
export interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

// Plusvibe CSV export format
export interface PlusvibeExportRow {
  FirstName: string;
  LastName: string;
  Email: string;
  CompanyName: string;
  City: string;
  Phone: string;
  MediaReviews: number;
  ProjectValue: number;
  PersonalizedMessage: string;
}

// D7 Lead Finder import format (exact CSV columns)
export interface D7LeadRow {
  BusinessName: string;
  PersonName: string;
  Email: string;
  WebsiteURL: string;
  Gmaps_URL: string;
  Rating: string;
  Reviews: string;
  '1 Star Reviews': string;
  '2 Star Reviews': string;
  '3 Star Reviews': string;
  '4 Star Reviews': string;
  '5 Star Reviews': string;
  '1 Star Reviews w/ Media': string;
  '2 Star Reviews w/ Media': string;
}

// AI message generation request
export interface GenerateMessageRequest {
  businessName: string;
  city: string;
  currentRating: number;
  projectedRating: number;
  totalMediaReviews: number;
  instructions?: string;
  template?: string;
}

export interface GenerateMessageResponse {
  message: string;
}

// Batch AI message generation (Clay-style enrichment)
export interface GenerateBatchMessagesRequest {
  businessIds: string[];
  prompt: string;
  campaignDescription?: string;
  template?: string;
}

export interface BatchMessageResult {
  businessId: string;
  success: boolean;
  message?: string;
  error?: string;
}

// Stage pipeline configuration
export interface StageConfig {
  stage: PipelineStage;
  label: string;
  color: string;
  description: string;
  order: number;
  id: PipelineStage;
  name: string;
}

// Email verification statuses constant array
export const EMAIL_VERIFICATION_STATUSES: EmailVerificationStatus[] = [
  'unverified',
  'good',
  'risky',
  'bad',
];

// Email outreach statuses constant array
export const EMAIL_OUTREACH_STATUSES: EmailOutreachStatus[] = [
  'not_sent',
  'sent',
  'opened',
  'clicked',
  'replied',
  'bounced',
  'unsubscribed',
];

// Pricing tiers configuration (from Ops Manual)
export const PRICING_TIERS = {
  standard: { minReviews: 1, maxReviews: 24, pricePerReview: 125 },
  volume: { minReviews: 25, maxReviews: 49, pricePerReview: 110 },
  enterprise: { minReviews: 50, maxReviews: Infinity, pricePerReview: 90 },
} as const;

// D7 CSV Import Field Mapping
export interface D7FieldMapping {
  business_name: string;
  contact_name: string;
  email: string;
  website_url: string;
  gmaps_url: string;
  city: string;
  state: string;
  google_rating: string;
  total_reviews: string;
  one_star_reviews: string;
  two_star_reviews: string;
  three_star_reviews: string;
  four_star_reviews: string;
  five_star_reviews: string;
  one_star_media_reviews: string;
  two_star_media_reviews: string;
}

// Helper function to calculate pricing based on total media reviews
export function calculatePricing(totalMediaReviews: number): {
  tier: PricingTier | null;
  pricePerReview: number;
  totalValue: number;
} {
  let tier: PricingTier | null = null;
  let pricePerReview = 125;

  if (totalMediaReviews >= 50) {
    tier = 'enterprise';
    pricePerReview = 90;
  } else if (totalMediaReviews >= 25) {
    tier = 'volume';
    pricePerReview = 110;
  } else if (totalMediaReviews >= 1) {
    tier = 'standard';
    pricePerReview = 125;
  }

  return {
    tier,
    pricePerReview,
    totalValue: totalMediaReviews * pricePerReview,
  };
}

// Helper to calculate projected rating
export function calculateProjectedRating(
  oneStarReviews: number,
  twoStarReviews: number,
  threeStarReviews: number,
  fourStarReviews: number,
  fiveStarReviews: number,
  oneStarMediaReviews: number,
  twoStarMediaReviews: number,
  totalReviews: number
): number | null {
  const totalMediaReviews = oneStarMediaReviews + twoStarMediaReviews;
  const remainingReviews = totalReviews - totalMediaReviews;

  if (remainingReviews <= 0) return null;

  const newPoints =
    1 * (oneStarReviews - oneStarMediaReviews) +
    2 * (twoStarReviews - twoStarMediaReviews) +
    3 * threeStarReviews +
    4 * fourStarReviews +
    5 * fiveStarReviews;

  return Math.round((newPoints / remainingReviews) * 10) / 10;
}

// Helper to get stage info by stage id
export function getStageInfo(stageId: PipelineStage): StageConfig {
  return PIPELINE_STAGES.find((s) => s.stage === stageId) || PIPELINE_STAGES[0];
}

// Pipeline stages configuration (from Ops Manual Section 09)
export const PIPELINE_STAGES: StageConfig[] = [
  { stage: 'lead_scraped', label: 'Lead Scraped', color: '#9ca3af', description: 'D7 data collected', order: 1, id: 'lead_scraped', name: 'Lead Scraped' },
  { stage: 'email_verified', label: 'Email Verified', color: '#6b7280', description: 'Brainzey validated', order: 2, id: 'email_verified', name: 'Email Verified' },
  { stage: 'campaign_ready', label: 'Campaign Ready', color: '#3b82f6', description: 'Loaded to CRM', order: 3, id: 'campaign_ready', name: 'Campaign Ready' },
  { stage: 'outreach_sent', label: 'Outreach Sent', color: '#3b82f6', description: 'Email delivered', order: 4, id: 'outreach_sent', name: 'Outreach Sent' },
  { stage: 'positive_reply', label: 'Positive Reply', color: '#10b981', description: 'Interest shown', order: 5, id: 'positive_reply', name: 'Positive Reply' },
  { stage: 'awaiting_audit', label: 'Awaiting Audit', color: '#f59e0b', description: 'Auto-response sent', order: 6, id: 'awaiting_audit', name: 'Awaiting Audit' },
  { stage: 'audit_complete', label: 'Audit Complete', color: '#10b981', description: 'Manual review done', order: 7, id: 'audit_complete', name: 'Audit Complete' },
  { stage: 'proposal_sent', label: 'Proposal Sent', color: '#f59e0b', description: 'Pricing delivered', order: 8, id: 'proposal_sent', name: 'Proposal Sent' },
  { stage: 'follow_up_1', label: 'Follow-Up 1', color: '#3b82f6', description: 'First follow-up', order: 9, id: 'follow_up_1', name: 'Follow-Up 1' },
  { stage: 'follow_up_2', label: 'Follow-Up 2', color: '#3b82f6', description: 'Final follow-up', order: 10, id: 'follow_up_2', name: 'Follow-Up 2' },
  { stage: 'qualified_lead', label: 'Qualified Lead', color: '#8b5cf6', description: 'Ready for sales', order: 11, id: 'qualified_lead', name: 'Qualified Lead' },
  { stage: 'in_negotiation', label: 'In Negotiation', color: '#f59e0b', description: 'Active conversation', order: 12, id: 'in_negotiation', name: 'In Negotiation' },
  { stage: 'deal_closed', label: 'Deal Closed', color: '#10b981', description: 'Agreement reached', order: 13, id: 'deal_closed', name: 'Deal Closed' },
  { stage: 'in_service_delivery', label: 'In Service Delivery', color: '#3b82f6', description: 'Reviews submitted', order: 14, id: 'in_service_delivery', name: 'In Service Delivery' },
  { stage: 'service_complete', label: 'Service Complete', color: '#10b981', description: 'All removed', order: 15, id: 'service_complete', name: 'Service Complete' },
  { stage: 'payment_collected', label: 'Payment Collected', color: '#10b981', description: 'Paid', order: 16, id: 'payment_collected', name: 'Payment Collected' },
  { stage: 'follow_up_list', label: 'Follow-Up List', color: '#6b7280', description: 'Nurture for upsells', order: 17, id: 'follow_up_list', name: 'Follow-Up List' },
  { stage: 'lost_opportunity', label: 'Lost Opportunity', color: '#ef4444', description: 'Did not convert', order: 18, id: 'lost_opportunity', name: 'Lost Opportunity' },
  { stage: 'do_not_contact', label: 'Do Not Contact', color: '#ef4444', description: 'Permanent archive', order: 19, id: 'do_not_contact', name: 'Do Not Contact' },
];
