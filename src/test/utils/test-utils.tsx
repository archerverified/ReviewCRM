import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Add providers here as needed (e.g., Redux, Theme, Router)
interface AllTheProvidersProps {
  children: ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Utility functions for tests
export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export const createMockFile = (
  name: string = 'test.csv',
  content: string = 'header1,header2\nvalue1,value2',
  type: string = 'text/csv'
): File => {
  return new File([content], name, { type })
}

export const createMockEvent = (value: string) => ({
  target: { value },
  preventDefault: () => {},
  stopPropagation: () => {},
})

// Mock data generators
export const mockBusiness = (overrides = {}) => ({
  id: '123',
  business_name: 'Test Business',
  contact_name: 'John Doe',
  email: 'john@test.com',
  phone: null,
  website_url: 'https://test.com',
  gmaps_url: 'https://maps.google.com/test',
  city: 'Atlanta',
  state: 'GA',
  industry: null,
  google_rating: 4.5,
  total_reviews: 100,
  one_star_reviews: 5,
  two_star_reviews: 10,
  three_star_reviews: 15,
  four_star_reviews: 30,
  five_star_reviews: 40,
  one_star_media_reviews: 3,
  two_star_media_reviews: 7,
  total_media_reviews: 10,
  projected_rating: 4.7,
  pricing_tier: 'standard',
  price_per_review: 125,
  total_project_value: 1250,
  pipeline_stage: 'lead_scraped',
  email_verification_status: 'unverified',
  email_outreach_status: 'not_sent',
  personalized_message: null,
  notes: null,
  campaign_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  last_contacted_at: null,
  ...overrides,
})

export const mockFilterState = (overrides = {}) => ({
  search: '',
  tags: [],
  stages: [],
  emailVerificationStatuses: [],
  emailOutreachStatuses: [],
  pricingTiers: [],
  cities: [],
  campaigns: [],
  ...overrides,
})

export const mockSelectOptions = () => [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
]
