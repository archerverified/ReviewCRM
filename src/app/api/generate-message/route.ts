import { NextRequest, NextResponse } from 'next/server';

interface GenerateMessageRequest {
  businessName: string;
  city: string;
  mediaReviews?: number;
  negativeReviews: number;
  instructions?: string;
  template?: string;
}

interface GenerateMessageResponse {
  message: string;
}

// In-memory rate limiting store
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (record.count >= 10) {
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

export async function POST(req: NextRequest) {
  try {
    // Extract IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 requests per minute.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body: GenerateMessageRequest = await req.json();
    const { businessName, city, mediaReviews, negativeReviews, instructions, template } = body;

    // Validate required fields
    if (!businessName || !city || typeof negativeReviews !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: businessName, city, negativeReviews' },
        { status: 400 }
      );
    }

    // Check API key configuration
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured in environment variables');
      return NextResponse.json(
        { error: 'AI service not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    // Build detailed prompt for Firecrawl agent
    const prompt = `Write a personalized 3-4 sentence cold email outreach message for a reputation management service.

Business Details:
- Name: ${businessName}
- Location: ${city}
- Problem: ${negativeReviews} negative reviews with photos/videos visible on Google, Yelp, and Facebook

Service Offering:
- Remove 1-2 star reviews containing media (photos/videos) permanently
- 100% money-back guarantee if reviews aren't removed
- Results delivered in 24-48 hours
- Proven track record with businesses in ${city}

${instructions ? `Additional instructions: ${instructions}` : ''}

Tone Requirements:
- Conversational and helpful, NOT salesy or pushy
- Focus on the pain point (negative reviews with media hurting their business reputation)
- Present the solution as quick and guaranteed
- Use their business name naturally in the first sentence

${template ? `Follow this template structure: ${template}` : ''}

Output Requirements:
- No subject line
- No signature block
- No greetings like "Hi" or "Hello"
- Start directly with addressing their business situation
- 3-4 sentences maximum
- Professional but approachable tone`;

    // Call Firecrawl agent API
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

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firecrawl API error:', response.status, errorText);

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'AI service rate limit exceeded. Please try again in a few moments.' },
          { status: 429 }
        );
      }

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: 'Invalid AI API credentials. Please contact administrator.' },
          { status: 500 }
        );
      }

      throw new Error(`Firecrawl API returned status ${response.status}`);
    }

    // Parse response
    const data = await response.json();

    // Extract message from various possible response formats
    const generatedMessage = data.result || data.output || data.response || data.message || '';

    if (!generatedMessage || typeof generatedMessage !== 'string') {
      console.error('Unexpected Firecrawl response format:', data);
      return NextResponse.json(
        { error: 'Failed to generate message. Invalid response format.' },
        { status: 500 }
      );
    }

    // Clean the response
    const cleanedMessage = cleanResponse(generatedMessage);

    // Validate minimum length
    if (cleanedMessage.length < 50) {
      console.warn('Generated message suspiciously short:', cleanedMessage);
      return NextResponse.json(
        { error: 'Generated message too short. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json<GenerateMessageResponse>({
      message: cleanedMessage
    });

  } catch (error: unknown) {
    console.error('Message generation error:', error);

    return NextResponse.json(
      { error: 'Failed to generate message. Please try again.' },
      { status: 500 }
    );
  }
}
