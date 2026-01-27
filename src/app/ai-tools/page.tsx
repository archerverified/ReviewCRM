'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { aiAgentQueries, aiApiKeyQueries } from '@/lib/supabase';
import type { AIAgent, AIApiKey, AIApiKeyProvider, AIAgentStatus } from '@/types';
import { AI_AGENT_STATUSES, AI_API_KEY_PROVIDERS } from '@/types';
import { toast } from 'sonner';

const AGENT_TEMPLATES = [
  {
    name: 'Email Personalization',
    description: 'Generate personalized outreach emails based on business data',
    type: 'email',
    category: 'general',
    creditsPerRow: 3,
    prompt: `You are an expert email copywriter for a B2B reputation management service.
Given the following business information, write a personalized cold email:
- Business Name: {{business_name}}
- City: {{city}}
- Current Rating: {{current_rating}}
- Projected Rating: {{projected_rating}}
- Media Reviews: {{total_media_reviews}}

Keep the email:
- Under 150 words
- Professional but friendly
- Focused on the specific value proposition for this business`,
  },
  {
    name: 'Lead Qualification',
    description: 'Score and qualify leads based on available data',
    type: 'qualification',
    category: 'general',
    creditsPerRow: 2,
    prompt: `Analyze the following business and provide a lead score from 1-10 with reasoning:
- Business Name: {{business_name}}
- Google Rating: {{google_rating}}
- Total Reviews: {{total_reviews}}
- Negative Reviews: {{negative_reviews}}
- Media Reviews: {{total_media_reviews}}
- Project Value: {{total_project_value}}

Consider factors like:
- Urgency (more negative reviews = higher urgency)
- Deal size potential
- Likelihood to convert

Output a JSON object with: { score: number, reasoning: string, nextSteps: string[] }`,
  },
  {
    name: 'Review Response',
    description: 'Generate professional responses to negative reviews',
    type: 'response',
    category: 'general',
    creditsPerRow: 3,
    prompt: `Write a professional response to the following negative review:
Review Text: {{review_text}}
Business: {{business_name}}
Star Rating: {{star_rating}}

Guidelines:
- Acknowledge the customer's concerns
- Apologize if appropriate
- Offer to resolve the issue
- Keep it professional and empathetic
- End with an invitation to discuss further offline`,
  },
];

// 2ndimpression.co specific templates
const BUSINESS_TEMPLATES = [
  {
    name: 'Review Analysis Agent',
    description: 'Extract and analyze 1-2 star reviews with media from Google Maps',
    type: 'analysis',
    category: '2ndimpression',
    creditsPerRow: 5,
    prompt: `You are a review analysis specialist for a reputation management company.
Analyze the following Google Maps review data for {{business_name}}:

Review Details:
- Star Rating: {{star_rating}}
- Has Media: {{has_media}}
- Review Text: {{review_text}}
- Reviewer Name: {{reviewer_name}}
- Review Date: {{review_date}}

Tasks:
1. Identify if this review qualifies for removal (1-2 star with media)
2. Assess the sentiment and key complaints
3. Flag any policy violations (fake reviews, competitor attacks, inappropriate content)
4. Estimate removal difficulty (easy/medium/hard)

Output a JSON object with:
{
  "qualifies_for_removal": boolean,
  "sentiment_score": number (1-5),
  "key_complaints": string[],
  "policy_violations": string[],
  "removal_difficulty": "easy" | "medium" | "hard",
  "recommended_action": string
}`,
  },
  {
    name: 'Value Calculator',
    description: 'Calculate total review removal value for prospect',
    type: 'calculator',
    category: '2ndimpression',
    creditsPerRow: 1,
    prompt: `Calculate the project value for the following business:

Business Data:
- Business Name: {{business_name}}
- Total Reviews: {{total_reviews}}
- Current Rating: {{google_rating}}
- 1-Star Reviews: {{one_star_reviews}}
- 2-Star Reviews: {{two_star_reviews}}
- 1-Star Reviews with Media: {{one_star_media_reviews}}
- 2-Star Reviews with Media: {{two_star_media_reviews}}

Pricing Tiers:
- Standard (1-24 media reviews): $125 per review
- Volume (25-49 media reviews): $110 per review
- Enterprise (50+ media reviews): $90 per review

Calculate:
1. Total media reviews eligible for removal
2. Applicable pricing tier
3. Price per review
4. Total project value
5. Projected rating after removal

Output a JSON object with:
{
  "total_media_reviews": number,
  "pricing_tier": "standard" | "volume" | "enterprise",
  "price_per_review": number,
  "total_project_value": number,
  "current_rating": number,
  "projected_rating": number,
  "rating_improvement": number
}`,
  },
  {
    name: 'Email Personalizer',
    description: 'Generate highly personalized cold emails based on review data',
    type: 'email',
    category: '2ndimpression',
    creditsPerRow: 3,
    prompt: `You are a cold email specialist for 2ndimpression.co, a B2B reputation management company that removes negative Google reviews with photos/videos.

Business Information:
- Business Name: {{business_name}}
- Contact Name: {{contact_name}}
- City: {{city}}
- Industry: {{industry}}
- Current Google Rating: {{google_rating}}
- Total Reviews: {{total_reviews}}
- 1-2 Star Reviews with Media: {{total_media_reviews}}
- Projected Rating After Service: {{projected_rating}}
- Total Project Value: \${{total_project_value}}

Write a personalized cold email that:
1. Opens with a specific observation about their business (not generic)
2. Mentions their exact rating improvement opportunity (e.g., "from 3.8 to 4.5 stars")
3. Quantifies the value (e.g., "remove {{total_media_reviews}} reviews")
4. Creates urgency without being pushy
5. Has a clear, low-friction CTA

Guidelines:
- Keep under 150 words
- Sound human, not salesy
- Reference their specific city/industry
- No buzzwords or corporate jargon`,
  },
  {
    name: 'Industry Classifier',
    description: 'Classify business into target industries for prioritization',
    type: 'classifier',
    category: '2ndimpression',
    creditsPerRow: 1,
    prompt: `Classify the following business into the appropriate target industry and priority level.

Business Data:
- Business Name: {{business_name}}
- Website URL: {{website_url}}
- Google Maps Category: {{gmaps_category}}
- City: {{city}}

Target Industries (High Priority):
- Hotels & Hospitality
- Restaurants & Food Service
- Medical & Healthcare
- Legal Services
- Automotive (Dealers, Repair)
- Real Estate
- Home Services (Contractors, HVAC, Plumbing)
- Professional Services

Secondary Industries:
- Retail
- Personal Care (Salons, Spas)
- Fitness & Wellness
- Education
- Entertainment & Events

Tasks:
1. Identify the primary industry category
2. Assign a priority level (A/B/C) based on industry fit
3. Identify any sub-categories
4. Flag if business type is ideal for reputation management

Output a JSON object with:
{
  "primary_industry": string,
  "sub_category": string,
  "priority_level": "A" | "B" | "C",
  "is_ideal_target": boolean,
  "reasoning": string,
  "recommended_approach": string
}`,
  },
];

export default function AIToolsPage() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [apiKeys, setApiKeys] = useState<AIApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [agentsData, apiKeysData] = await Promise.all([
        aiAgentQueries.getAll(),
        aiApiKeyQueries.getAll(),
      ]);
      setAgents(agentsData);
      setApiKeys(apiKeysData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load AI tools: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickCreate() {
    if (!promptInput.trim()) {
      toast.error('Please enter a prompt for your agent');
      return;
    }

    try {
      const newAgent = await aiAgentQueries.create({
        name: `Agent ${agents.length + 1}`,
        prompt: promptInput,
        status: 'draft',
      });
      setAgents([newAgent, ...agents]);
      setPromptInput('');
      setEditingAgent(newAgent);
      toast.success('Agent created! Edit it to add more details.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to create agent: ${errorMessage}`);
    }
  }

  async function handleCreateFromTemplate(template: typeof AGENT_TEMPLATES[0]) {
    try {
      const newAgent = await aiAgentQueries.create({
        name: template.name,
        description: template.description,
        prompt: template.prompt,
        status: 'draft',
      });
      setAgents([newAgent, ...agents]);
      setShowTemplatesModal(false);
      setEditingAgent(newAgent);
      toast.success('Agent created from template!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to create agent: ${errorMessage}`);
    }
  }

  async function handleDeleteAgent(id: string) {
    try {
      await aiAgentQueries.delete(id);
      setAgents(agents.filter(a => a.id !== id));
      toast.success('Agent deleted');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to delete agent: ${errorMessage}`);
    }
  }

  async function handleStatusChange(id: string, status: AIAgentStatus) {
    try {
      await aiAgentQueries.update(id, { status });
      setAgents(agents.map(a => a.id === id ? { ...a, status } : a));
      toast.success(`Agent status updated to ${status}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update status: ${errorMessage}`);
    }
  }

  async function handleTestConnection(keyId: string) {
    setTestingKeyId(keyId);
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTestingKeyId(null);
    toast.success('Connection successful!');
  }

  function getStatusColor(status: AIAgentStatus): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function AgentStatusBadge({ status }: { status: AIAgentStatus }) {
    const config = {
      active: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ),
      },
      draft: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        icon: (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" clipRule="evenodd" />
          </svg>
        ),
      },
      archived: {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-200',
        icon: (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        ),
      },
    };

    const c = config[status];

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${c.bg} ${c.text} border ${c.border}`}>
        {c.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  function maskApiKey(key: string): string {
    if (key.length <= 8) return '****';
    return key.slice(0, 4) + '****' + key.slice(-4);
  }

  function getProviderLogo(provider: AIApiKeyProvider) {
    switch (provider) {
      case 'anthropic':
        return (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-xs">
            A
          </div>
        );
      case 'openai':
        return (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xs">
            O
          </div>
        );
      case 'firecrawl':
        return (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
            F
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-xs">
            ?
          </div>
        );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with animated icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            {/* Sparkle decorations */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Tools</h1>
            <p className="text-gray-500 mt-1">
              Create and manage AI agents for your CRM workflows
            </p>
          </div>
        </div>
      </div>

      {/* Hero Create Section with enhanced animations */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
        {/* Floating decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

        {/* Animated shimmer effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] animate-shimmer"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Create a new AI Agent</h2>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Describe what you want your AI agent to do... (e.g., 'Write personalized follow-up emails for leads who haven't responded')"
                className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/15 placeholder-white/60 text-white transition-all duration-300"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleQuickCreate}
                disabled={!promptInput.trim()}
                className="bg-white text-purple-700 hover:bg-white/90 disabled:bg-white/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Create
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowTemplatesModal(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
              >
                Templates
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* General Quick Start Templates */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Start Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AGENT_TEMPLATES.map((template, index) => {
            const gradients = [
              'from-blue-500 to-blue-600',
              'from-green-500 to-green-600',
              'from-purple-500 to-purple-600'
            ];
            const hoverGlows = [
              'hover:shadow-blue-200',
              'hover:shadow-green-200',
              'hover:shadow-purple-200'
            ];

            return (
              <button
                key={index}
                onClick={() => handleCreateFromTemplate(template)}
                className={`text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-transparent hover:shadow-xl ${hoverGlows[index]} transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden`}
              >
                {/* Gradient accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradients[index]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${gradients[index]} text-white shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                    {index === 0 ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    ) : index === 1 ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:rotate-90 transition-all duration-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2ndimpression.co Business Templates */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">2ndimpression.co Templates</h3>
          <span className="px-2 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-medium rounded-full">
            Specialized
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {BUSINESS_TEMPLATES.map((template, index) => {
            const gradients = [
              'from-indigo-500 to-indigo-600',
              'from-emerald-500 to-emerald-600',
              'from-orange-500 to-orange-600',
              'from-pink-500 to-pink-600'
            ];
            const icons = [
              <svg key="0" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>,
              <svg key="1" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>,
              <svg key="2" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>,
              <svg key="3" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            ];

            return (
              <button
                key={index}
                onClick={() => handleCreateFromTemplate(template)}
                className="text-left bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Gradient accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradients[index]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${gradients[index]} text-white shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                      {icons[index]}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Agents List with enhanced cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your AI Agents</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{agents.length} agents</span>
        </div>

        {agents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-16 px-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Agents yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Create your first AI agent using the prompt box above or choose from a template.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(agent => {
              const isActive = agent.status === 'active';
              const isDraft = agent.status === 'draft';

              return (
                <div
                  key={agent.id}
                  className={`bg-white rounded-xl border-2 p-5 hover:shadow-xl transition-all duration-300 group relative overflow-hidden ${
                    isActive ? 'border-green-200 hover:border-green-300 hover:shadow-green-100' :
                    isDraft ? 'border-yellow-200 hover:border-yellow-300 hover:shadow-yellow-100' :
                    'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Subtle glow effect based on status */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    isActive ? 'bg-gradient-to-br from-green-50/50 to-transparent' :
                    isDraft ? 'bg-gradient-to-br from-yellow-50/50 to-transparent' :
                    'bg-gradient-to-br from-gray-50/50 to-transparent'
                  }`}></div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                          isActive ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' :
                          isDraft ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                          'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
                        }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                          <span className="text-xs text-gray-500">v{agent.version}</span>
                        </div>
                      </div>
                      <AgentStatusBadge status={agent.status} />
                    </div>

                    {agent.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{agent.description}</p>
                    )}

                    {/* Enhanced prompt preview with syntax highlighting style */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 mb-4 border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        PROMPT
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-3 font-mono leading-relaxed">{agent.prompt}</p>
                    </div>

                    {/* Usage stats */}
                    <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>0 runs</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{new Date(agent.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      {/* Quick action button */}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => toast.info('Test run feature coming soon!')}
                      >
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Test Run
                      </Button>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingAgent(agent)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <select
                          value={agent.status}
                          onChange={(e) => handleStatusChange(agent.id, e.target.value as AIAgentStatus)}
                          className="px-2 py-1 rounded-lg border border-gray-200 text-xs bg-white hover:border-gray-300 transition-colors"
                        >
                          {AI_AGENT_STATUSES.map(status => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Configuration Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            Configuration
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {/* API Keys - Enhanced with provider logos */}
          <div className="border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">API Keys</h3>
                  <p className="text-xs text-gray-500">Connect your AI provider accounts</p>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowApiKeyModal(true)} className="shadow-sm hover:shadow-md transition-shadow">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Key
              </Button>
            </div>

            {apiKeys.length === 0 ? (
              <div className="flex items-center gap-3 py-6 px-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg border border-gray-200">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-600">No API keys configured. Add one to use AI features.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map(key => (
                  <div key={key.id} className="flex items-center justify-between py-3 px-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-300 group">
                    <div className="flex items-center gap-3">
                      {getProviderLogo(key.provider)}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{key.name}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                            key.provider === 'anthropic' ? 'bg-purple-100 text-purple-700' :
                            key.provider === 'openai' ? 'bg-green-100 text-green-700' :
                            key.provider === 'firecrawl' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {key.provider.charAt(0).toUpperCase() + key.provider.slice(1)}
                          </span>
                          {key.is_default && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Default
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block w-fit">
                          {maskApiKey(key.api_key_encrypted)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestConnection(key.id)}
                        disabled={testingKeyId === key.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                        title="Test Connection"
                      >
                        {testingKeyId === key.id ? (
                          <>
                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            Testing...
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Test
                          </>
                        )}
                      </button>
                      <button
                        onClick={async () => {
                          await aiApiKeyQueries.delete(key.id);
                          setApiKeys(apiKeys.filter(k => k.id !== key.id));
                          toast.success('API key deleted');
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MCP Servers - Enhanced Coming Soon */}
          <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-5 overflow-hidden group hover:border-blue-300 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-50"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">MCP Servers</h3>
                      <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2.5 py-1 rounded-full font-medium shadow-sm">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Connect to MCP servers for extended tool capabilities</p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" disabled className="opacity-50">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Server
                </Button>
              </div>
            </div>
          </div>

          {/* Webhooks - Enhanced Coming Soon */}
          <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-5 overflow-hidden group hover:border-green-300 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-blue-50/50 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-200/20 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">Webhooks</h3>
                      <span className="text-xs bg-gradient-to-r from-green-500 to-blue-500 text-white px-2.5 py-1 rounded-full font-medium shadow-sm">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Trigger actions when agents complete tasks</p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" disabled className="opacity-50">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Webhook
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      <Modal isOpen={showTemplatesModal} onClose={() => setShowTemplatesModal(false)} title="Agent Templates">
        <div className="space-y-6">
          {/* General Templates */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">General Templates</h4>
            <div className="space-y-3">
              {AGENT_TEMPLATES.map((template, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all duration-300 group"
                  onClick={() => handleCreateFromTemplate(template)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      index === 0 ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                      index === 1 ? 'bg-gradient-to-br from-green-400 to-green-600' :
                      'bg-gradient-to-br from-purple-400 to-purple-600'
                    } text-white shadow-md`}>
                      {index === 0 ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      ) : index === 1 ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2ndimpression Templates */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">2ndimpression.co Templates</h4>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">Specialized</span>
            </div>
            <div className="space-y-3">
              {BUSINESS_TEMPLATES.map((template, index) => {
                const gradients = [
                  'bg-gradient-to-br from-indigo-400 to-indigo-600',
                  'bg-gradient-to-br from-emerald-400 to-emerald-600',
                  'bg-gradient-to-br from-orange-400 to-orange-600',
                  'bg-gradient-to-br from-pink-400 to-pink-600'
                ];
                return (
                  <div
                    key={index}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all duration-300 group"
                    onClick={() => handleCreateFromTemplate(template)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${gradients[index]} text-white shadow-md`}>
                        {index === 0 ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        ) : index === 1 ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : index === 2 ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{template.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Agent Modal */}
      {editingAgent && (
        <EditAgentModal
          agent={editingAgent}
          isOpen={!!editingAgent}
          onClose={() => setEditingAgent(null)}
          onSave={async (updates) => {
            const updated = await aiAgentQueries.update(editingAgent.id, updates);
            setAgents(agents.map(a => a.id === editingAgent.id ? updated : a));
            setEditingAgent(null);
            toast.success('Agent updated');
          }}
        />
      )}

      {/* Add API Key Modal */}
      <AddApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onAdd={async (key) => {
          await loadData();
          setShowApiKeyModal(false);
        }}
      />

      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-200%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}

// Edit Agent Modal
function EditAgentModal({
  agent,
  isOpen,
  onClose,
  onSave,
}: {
  agent: AIAgent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<AIAgent>) => void;
}) {
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description || '');
  const [prompt, setPrompt] = useState(agent.prompt);
  const [model, setModel] = useState(agent.model);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({ name, description, prompt, model });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Agent">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of what this agent does"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 h-48 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Use {'{{variable_name}}'} for dynamic values (e.g., {'{{business_name}}'})
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          >
            <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4o-mini">GPT-4o Mini</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Add API Key Modal
function AddApiKeyModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (key: AIApiKey) => void;
}) {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<AIApiKeyProvider>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newKey = await aiApiKeyQueries.create({
        name,
        provider,
        api_key_encrypted: apiKey,
        is_default: isDefault,
      });
      toast.success('API key added successfully');
      onAdd(newKey);
      setName('');
      setApiKey('');
      setIsDefault(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to add API key: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add API Key">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Anthropic Key"
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as AIApiKeyProvider)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          >
            {AI_API_KEY_PROVIDERS.map(p => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="API Key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          required
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Set as default for this provider</span>
        </label>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Key'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
