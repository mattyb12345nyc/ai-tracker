const API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!API_KEY) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing ANTHROPIC_API_KEY or CLAUDE_API_KEY' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { brandName, brandUrl, industry, businessGoals } = body;
    const { brandData, questionCount, userContext } = body;

    // New API: brandName + businessGoals → 10 recommendation-style questions (array of strings)
    if (brandName != null && businessGoals != null && String(businessGoals).trim().length >= 10) {
      const prompt = `You are an AI visibility tracking expert. Your task is to generate exactly 10 recommendation-style questions that real consumers would ask AI assistants (e.g. ChatGPT, Claude, Perplexity) when researching or shopping.

CONTEXT:
- Brand: ${brandName}
- Brand URL: ${brandUrl || 'not provided'}
- Industry: ${industry || 'not specified'}
- User's business goals for AI visibility tracking: ${String(businessGoals).trim()}

REQUIREMENTS:
1. Generate exactly 10 questions.
2. Questions MUST be in formats like:
   - "What are the best [category] for [use case]?"
   - "What [product type] do you recommend for [scenario]?"
   - "Which [category] should I consider for [audience/need]?"
   - "Top [number] [category] for [specific situation]?"
3. Align questions with the user's business goals (e.g. brand awareness, competitor comparison, product recommendations, use-case scenarios).
4. Include a mix of: brand awareness, competitor comparison, product recommendations, and use-case scenarios.
5. Do NOT mention the brand name "${brandName}" in any question—these are questions consumers would ask, not brand-specific.
6. Questions should be relevant to the industry and typical buyer intent.

Return ONLY a valid JSON array of exactly 10 question strings. No explanation, no markdown, no code block—just the array.
Example format: ["What are the best luxury handbags for everyday use?", "What designer brands do you recommend for professional women?", ...]`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Claude API error:', response.status, errText);
        return {
          statusCode: response.status,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: `API error: ${response.status}` })
        };
      }

      const data = await response.json();
      const content = (data.content && data.content[0] && data.content[0].text) || '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'No JSON array in response' })
        };
      }
      let list = [];
      try {
        list = JSON.parse(jsonMatch[0]);
      } catch (e) {
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Invalid JSON in response' })
        };
      }
      const questions = Array.isArray(list) ? list.slice(0, 10).map((q) => (typeof q === 'string' ? q : String(q))) : [];
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions })
      };
    }

    // Legacy API: brandData + questionCount + userContext → questions with text/category
    if (!brandData || questionCount == null) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'brandData and questionCount required, or use brandName + businessGoals (min 10 chars)' })
      };
    }

    const userContextSection = userContext
      ? `\nUSER CONTEXT (IMPORTANT - incorporate these priorities into question generation):\n${userContext}\n`
      : '';

    const prompt = `Generate ${questionCount} questions that real consumers would ask AI assistants when looking to purchase a product/service in this category.

Brand Category: ${brandData.category}
Industry: ${brandData.industry}
Target Audience: ${brandData.target_audience.join(', ')}
Key Features: ${brandData.key_features.join(', ')}
Key Benefits: ${brandData.key_benefits.join(', ')}
Price Tier: ${brandData.price_tier}
Use Cases: ${brandData.use_cases.join(', ')}${userContextSection}

CRITICAL RULES:
1. Every question MUST ask for recommendations, suggestions, rankings, or "best" options
2. Questions should be what real buyers ask when ready to purchase
3. Do NOT mention the brand name "${brandData.brand_name}" in any question
4. Do NOT mention any competitor names
5. Questions should trigger AI to list/recommend specific products or services

REQUIRED QUESTION FORMATS (use variety):
- "What are the best [category] for [use case]?"
- "Which [category] do you recommend for [audience]?"
- "Top [number] [category] for [specific need]?"
- "Best [category] under $[price] / for [budget]?"
- "Best [category] with [specific feature]?"
- "What [category] should I use for [benefit/outcome]?"
- "Recommend a [category] that [specific requirement]"
- "What's the most [adjective] [category] for [use case]?"
- "What [category] do experts recommend for [scenario]?"
- "List the leading [category] for [industry/segment]"

Distribute across buyer journey stages:
- AWARENESS (30%): "What tools exist for X?", "Best ways to solve Y"
- CONSIDERATION (40%): "Top X for Y", "Best X with feature Z", "Recommend X for use case"
- DECISION (30%): "Which X should I choose for Y?", "Best X for my specific needs"

Return ONLY a JSON array:
[{"text": "question text", "category": "Awareness|Consideration|Decision"}]

No explanation. JSON only.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `API error: ${response.status}` })
      };
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No JSON found in response' })
      };
    }
    
    const questions = JSON.parse(jsonMatch[0]);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ questions })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
