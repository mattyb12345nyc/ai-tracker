const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';

exports.handler = async (event) => {
  // Handle CORS preflight
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
    const { brandName, competitors, keyMessages, questionCount } = JSON.parse(event.body);
    
    const messagesList = keyMessages.filter(m => m.trim()).join(', ');
    
    const prompt = `You are an AI Visibility strategist helping measure organic brand visibility. Generate exactly ${questionCount} search questions that a potential buyer would ask AI assistants (ChatGPT, Claude, Gemini, Perplexity) when researching vendors in the same category as "${brandName}".

CRITICAL RULES:
- NEVER include "${brandName}" in any question
- NEVER include any competitor names in questions
- Questions must be generic category/industry searches that a buyer would naturally ask
- Focus on the buyer journey: awareness, research, evaluation, decision

The brand operates in a space with these key value propositions: ${messagesList || 'not specified'}

Generate questions across these buyer journey stages (distribute evenly):
1. AWARENESS - General category questions ("What tools help with X?", "How do companies solve Y?")
2. RESEARCH - Exploring options ("Best platforms for X", "Top solutions for Y", "Leading vendors in Z")
3. EVALUATION - Comparing features ("What features matter most in X?", "How to evaluate Y tools?")
4. CONSIDERATION - Use case fit ("What X solution is best for enterprise?", "Which Y platform works for Z use case?")
5. DECISION - Final selection ("How to choose between X solutions?", "What should I look for in a Y vendor?")

The questions should mimic what a real buyer would type when searching for a new vendor - generic industry terms only, NO brand names.

Return ONLY a JSON array with objects containing "text" and "category" fields. No other text.
Example: [{"text": "What are the best consumer research platforms?", "category": "Research"}, {"text": "How do enterprises gather real-time customer insights?", "category": "Awareness"}]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
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
    
    // Parse JSON from response
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
