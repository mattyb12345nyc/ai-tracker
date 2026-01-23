const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';

exports.handler = async (event) => {
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

  try {
    const { brandData, questionCount } = JSON.parse(event.body);
    
    const prompt = `Generate ${questionCount} questions that real consumers would ask AI assistants when looking to purchase a product/service in this category.

Brand Category: ${brandData.category}
Industry: ${brandData.industry}
Target Audience: ${brandData.target_audience.join(', ')}
Key Features: ${brandData.key_features.join(', ')}
Key Benefits: ${brandData.key_benefits.join(', ')}
Price Tier: ${brandData.price_tier}
Use Cases: ${brandData.use_cases.join(', ')}

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
        'x-api-key': CLAUDE_API_KEY,
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
