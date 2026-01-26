const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const BRAND_DEV_API_KEY = process.env.BRAND_DEV_API_KEY || '';

// Extract domain from URL for brand.dev API
const extractDomain = (url) => {
  return url.replace(/https?:\/\//, '').replace('www.', '').split('/')[0];
};

// Fetch brand assets from brand.dev (logo, colors, fonts)
const fetchBrandAssets = async (domain) => {
  try {
    const response = await fetch(`https://api.brand.dev/v1/brand/retrieve?domain=${domain}`, {
      headers: {
        'Authorization': `Bearer ${BRAND_DEV_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log('Brand.dev API error:', response.status);
      return null;
    }

    const data = await response.json();

    // Extract brand assets
    const assets = {
      logo_url: data.logos?.primary?.url || data.logos?.[0]?.url || data.logo || null,
      logo_light_url: data.logos?.light?.url || null,
      logo_dark_url: data.logos?.dark?.url || null,
      primary_color: data.colors?.primary || data.primaryColor || '#1a1a2e',
      secondary_color: data.colors?.secondary || data.secondaryColor || '#ff7a3d',
      accent_color: data.colors?.accent || '#8b5cf6',
      colors: data.colors || {},
      fonts: {
        heading: data.fonts?.heading || data.typography?.heading || 'Inter',
        body: data.fonts?.body || data.typography?.body || 'Inter'
      },
      brand_name: data.name || data.brandName || null
    };

    return assets;
  } catch (error) {
    console.error('Brand.dev fetch error:', error);
    return null;
  }
};

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

  try {
    const { url } = JSON.parse(event.body);
    
    const prompt = `Analyze this brand URL and extract key information for AI visibility tracking.

URL: ${url}

Based on the URL and your knowledge of this brand/company, return JSON only:
{
  "brand_name": "extracted brand name",
  "category": "specific product/service category (be precise)",
  "industry": "broader industry",
  "target_audience": ["audience segment 1", "audience segment 2", "audience segment 3"],
  "key_features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
  "key_benefits": ["benefit 1", "benefit 2", "benefit 3"],
  "price_tier": "budget/mid-range/premium/enterprise",
  "use_cases": ["use case 1", "use case 2", "use case 3"],
  "competitors": ["competitor 1", "competitor 2", "competitor 3", "competitor 4", "competitor 5"]
}

Rules:
- Be specific about the category (e.g. "consumer insights platform" not "software")
- Include 5+ realistic competitors in the same exact category
- Target audience should be specific buyer personas
- Use cases should be real scenarios where someone would use this product

JSON only. No explanation.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
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
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No JSON found in response' })
      };
    }

    const brandData = JSON.parse(jsonMatch[0]);

    // Fetch brand assets from brand.dev
    const domain = extractDomain(url);
    const brandAssets = await fetchBrandAssets(domain);
    if (brandAssets) {
      brandData.logo_url = brandAssets.logo_url;
      brandData.brand_assets = brandAssets;
    }
    brandData.domain = domain;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ brandData })
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
