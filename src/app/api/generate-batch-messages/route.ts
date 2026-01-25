import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface BusinessData {
  id: string;
  business_name: string;
  city: string | null;
  google_rating: number | null;
  total_reviews: number;
  one_star_reviews: number;
  two_star_reviews: number;
  total_media_reviews: number;
  projected_rating: number | null;
  industry: string | null;
}

interface GenerateBatchRequest {
  businesses: BusinessData[];
  prompt: string;
  campaignDescription?: string;
  template?: string;
}

interface BatchResult {
  businessId: string;
  success: boolean;
  message?: string;
  error?: string;
}

// In-memory rate limiting store
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests: number = 50): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

function cleanResponse(message: string): string {
  return message
    .trim()
    // Remove surrounding quotes (single or double)
    .replace(/^["']|["']$/g, '')
    // Normalize excessive line breaks (3+ to 2)
    .replace(/\n{3,}/g, '\n\n')
    // Strip "Subject:" lines
    .replace(/^Subject:.*\n/im, '')
    // Remove greetings (Hi, Hello, Hey)
    .replace(/^(Hi|Hello|Hey)[,\s]+/i, '');
}

function buildPromptForBusiness(
  business: BusinessData,
  userPrompt: string,
  campaignDescription?: string,
  template?: string
): string {
  const negativeReviews = business.one_star_reviews + business.two_star_reviews;

  return `You are writing a personalized cold outreach email for a reputation management service.

USER INSTRUCTIONS:
${userPrompt}

BUSINESS DATA (use this to personalize the message):
- Business Name: ${business.business_name}
- Location: ${business.city || 'Unknown'}
- Industry: ${business.industry || 'Local Business'}
- Current Google Rating: ${business.google_rating || 'N/A'}
- Total Reviews: ${business.total_reviews}
- Negative Reviews (1-2 star): ${negativeReviews}
- Reviews with Media: ${business.total_media_reviews}
- Projected Rating After Cleanup: ${business.projected_rating || 'Improved'}

${campaignDescription ? `CAMPAIGN CONTEXT:\n${campaignDescription}\n` : ''}

SERVICE DETAILS (incorporate naturally):
- We remove 1-2 star reviews containing media (photos/videos) permanently
- 100% money-back guarantee if reviews aren't removed
- Results in 24-48 hours
- Proven track record

${template ? `TEMPLATE TO FOLLOW (use as inspiration, don't copy exactly):\n${template}\n` : ''}

OUTPUT REQUIREMENTS:
- No subject line
- No signature block
- No greetings like "Hi" or "Hello"
- Start directly addressing their business situation
- 3-4 sentences maximum
- Professional but conversational tone
- Reference their specific business name and data

Generate the personalized message now:`;
}

async function generateSingleMessage(
  business: BusinessData,
  userPrompt: string,
  campaignDescription: string | undefined,
  template: string | undefined,
  apiKey: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const prompt = buildPromptForBusiness(business, userPrompt, campaignDescription, template);

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/agent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        mode: 'autonomous'
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, error: 'Rate limit exceeded. Waiting...' };
      }
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    const generatedMessage = data.result || data.output || data.response || data.message || '';

    if (!generatedMessage || typeof generatedMessage !== 'string') {
      return { success: false, error: 'Invalid response format' };
    }

    const cleanedMessage = cleanResponse(generatedMessage);

    if (cleanedMessage.length < 50) {
      return { success: false, error: 'Generated message too short' };
    }

    return { success: true, message: cleanedMessage };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Extract IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Check rate limit (50 requests per minute for batch endpoint)
    if (!checkRateLimit(ip, 50)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before generating more messages.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body: GenerateBatchRequest = await req.json();
    const { businesses, prompt, campaignDescription, template } = body;

    // Validate required fields
    if (!businesses || !Array.isArray(businesses) || businesses.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty businesses array' },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty prompt' },
        { status: 400 }
      );
    }

    // Limit batch size
    if (businesses.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 businesses per batch' },
        { status: 400 }
      );
    }

    // Check API key configuration
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    // Initialize Supabase client for saving messages
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process businesses sequentially to respect rate limits
    const results: BatchResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const business of businesses) {
      // Small delay between requests to avoid rate limiting
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const result = await generateSingleMessage(
        business,
        prompt,
        campaignDescription,
        template,
        apiKey
      );

      if (result.success && result.message) {
        // Save to database
        const { error: dbError } = await supabase
          .from('businesses')
          .update({
            outreach_message: result.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', business.id);

        if (dbError) {
          results.push({
            businessId: business.id,
            success: false,
            error: `Database error: ${dbError.message}`
          });
          failCount++;
        } else {
          results.push({
            businessId: business.id,
            success: true,
            message: result.message
          });
          successCount++;
        }
      } else {
        results.push({
          businessId: business.id,
          success: false,
          error: result.error
        });
        failCount++;

        // If we hit rate limit, wait longer
        if (result.error?.includes('Rate limit')) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: businesses.length,
        successful: successCount,
        failed: failCount
      }
    });

  } catch (error) {
    console.error('Batch generation error:', error);
    return NextResponse.json(
      { error: 'Failed to process batch generation. Please try again.' },
      { status: 500 }
    );
  }
}
