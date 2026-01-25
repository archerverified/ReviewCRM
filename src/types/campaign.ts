// Campaign-specific types for Clay-style enrichment UI

// Cell states for AI generation progress
export type CellState = 'empty' | 'queued' | 'running' | 'complete' | 'error';

// Enrichment types available in the side panel
export type EnrichmentType =
  | 'complete_prompt'
  | 'company_summary'
  | 'pain_points'
  | 'custom';

export interface EnrichmentOption {
  id: EnrichmentType;
  name: string;
  description: string;
  icon: 'sparkles' | 'document' | 'chat' | 'code';
  defaultPrompt?: string;
}

// Available enrichment options
export const ENRICHMENT_OPTIONS: EnrichmentOption[] = [
  {
    id: 'complete_prompt',
    name: 'Complete Prompt',
    description: 'Generate personalized outreach messages using AI',
    icon: 'sparkles',
    defaultPrompt: 'Create a personalized cold outreach message for this business. The message should be professional, concise (3-4 sentences), and highlight how we can help improve their Google rating by removing negative reviews with media.',
  },
  {
    id: 'company_summary',
    name: 'Company Summary',
    description: 'Generate a brief summary of the business',
    icon: 'document',
    defaultPrompt: 'Write a brief 2-3 sentence summary of this business based on their name, location, and industry.',
  },
  {
    id: 'pain_points',
    name: 'Pain Points Analysis',
    description: 'Identify potential pain points from review data',
    icon: 'chat',
    defaultPrompt: 'Based on the negative review count and rating, identify 2-3 potential pain points this business might be experiencing with their online reputation.',
  },
  {
    id: 'custom',
    name: 'Custom Prompt',
    description: 'Write your own prompt for the AI',
    icon: 'code',
  },
];

// Cell data for tracking generation state
export interface CellData {
  businessId: string;
  state: CellState;
  content?: string;
  error?: string;
  generatedAt?: string;
}

// Batch generation progress
export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  running: boolean;
}

// Available variables for prompt templates
export const PROMPT_VARIABLES = [
  { name: 'business_name', description: 'Name of the business' },
  { name: 'city', description: 'City location' },
  { name: 'industry', description: 'Industry/category' },
  { name: 'google_rating', description: 'Current Google rating' },
  { name: 'total_reviews', description: 'Total review count' },
  { name: 'negative_reviews', description: '1 and 2 star reviews' },
  { name: 'media_reviews', description: 'Reviews with photos/videos' },
  { name: 'projected_rating', description: 'Rating after removal' },
  { name: 'project_value', description: 'Total project value' },
];
