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
    
    const competitorList = competitors.filter(c => c.trim()).join(', ');
    const messagesList = keyMessages.filter(m => m.trim()).join(', ');
    
    const prompt = `You are an AI Visibility strategist. Generate exactly ${questionCount} search questions that consumers would ask AI assistants (ChatGPT, Claude, Gemini, Perplexity) that are relevant to evaluating "${brandName}" and its market position.

The brand's key messages are: ${messagesList || 'not specified'}
Main competitors are: ${competitorList || 'not specified'}

Generate questions across these categories (distribute evenly):
1. AWARENESS - Direct brand questions ("What is [brand]?", "Is [brand] good?")
2. DISCOVERY - Category searches where brand should appear ("Best [category] tools", "Top [category] companies")
3. COMPARISON - Head-to-head with competitors ("How does [brand] compare to [competitor]?")
4. DECISION - Purchase/choice intent ("Should I use [brand] or [competitor]?", "Is [brand] worth it?")
5. REPUTATION - Trust and perception ("What do people think of [brand]?", "Is [brand] reliable?")

Return ONLY a JSON array with objects containing "text" and "category" fields. No other text.
Example: [{"text": "What is Acme Corp?", "category": "Awareness"}, {"text": "Best CRM software 2024", "category": "Discovery"}]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
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
