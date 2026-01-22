import Anthropic from '@anthropic-ai/sdk'
import { Business } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface GenerateMessageOptions {
  business: Business
  instructions: string
  template?: string
}

interface GenerateMessageResult {
  success: boolean
  message?: string
  error?: string
}

export async function generatePersonalizedMessage({
  business,
  instructions,
  template,
}: GenerateMessageOptions): Promise<GenerateMessageResult> {
  try {
    const systemPrompt = `You are a professional outreach specialist helping with reputation management services.
Your task is to write personalized cold emails that feel genuine and helpful, not salesy.

Key points to incorporate:
- The business has ${business.total_media_reviews} media reviews (photos/videos) that are 1-2 stars
- These reviews can be removed through Google's Terms of Service guidelines
- The project value is $${business.total_project_value.toLocaleString()}
- Keep messages under 150 words
- Sound conversational, not templated
- Focus on helping, not selling

${instructions ? `Additional instructions: ${instructions}` : ''}
${template ? `Use this template as inspiration: ${template}` : ''}`

    const userPrompt = `Write a personalized cold email for this business:

Business Name: ${business.business_name}
City: ${business.city || 'Unknown'}
State: ${business.state || ''}
Total Media Reviews: ${business.total_media_reviews}
1-Star Media Reviews: ${business.one_star_media_reviews}
2-Star Media Reviews: ${business.two_star_media_reviews}
Website: ${business.website || 'Not available'}

Write ONLY the email body (no subject line, no "Hi" or signature). Start directly with the personalized opening.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    })

    const messageContent = response.content[0]
    if (messageContent.type === 'text') {
      return {
        success: true,
        message: messageContent.text.trim(),
      }
    }

    return {
      success: false,
      error: 'Unexpected response format',
    }
  } catch (error) {
    console.error('Error generating message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function generateMessagesForCampaign(
  businesses: Business[],
  instructions: string,
  template: string | undefined,
  onProgress: (current: number, total: number) => void
): Promise<{ success: number; failed: number; results: Map<string, string> }> {
  const results = new Map<string, string>()
  let success = 0
  let failed = 0

  for (let i = 0; i < businesses.length; i++) {
    const business = businesses[i]
    onProgress(i + 1, businesses.length)

    const result = await generatePersonalizedMessage({
      business,
      instructions,
      template,
    })

    if (result.success && result.message) {
      results.set(business.id, result.message)
      success++
    } else {
      failed++
    }

    // Add a small delay to avoid rate limiting
    if (i < businesses.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  return { success, failed, results }
}
