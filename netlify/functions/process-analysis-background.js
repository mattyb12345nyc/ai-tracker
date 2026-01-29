// API Keys from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const AIRTABLE_BASE_ID = "appgSZR92pGCMlUOc";
const SITE_URL = process.env.URL || "https://ai-tracker.netlify.app";

// Normalize brand name to consolidate similar variations
function normalizeBrandName(name) {
  if (!name || typeof name !== 'string') return '';

  // Clean up the name
  let normalized = name.trim();

  // Remove common suffixes/prefixes that don't change the brand
  normalized = normalized.replace(/\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?)$/i, '').trim();

  // Create a lowercase version for comparison
  const lower = normalized.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Known brand name variations to consolidate
  const brandAliases = {
    'surveymonkey': 'SurveyMonkey',
    'survey monkey': 'SurveyMonkey',
    'typeform': 'Typeform',
    'type form': 'Typeform',
    'qualtrics': 'Qualtrics',
    'qualtricsxm': 'Qualtrics',
    'google forms': 'Google Forms',
    'googleforms': 'Google Forms',
    'microsoft forms': 'Microsoft Forms',
    'msforms': 'Microsoft Forms',
    'jotform': 'Jotform',
    'jot form': 'Jotform',
    'airtable': 'Airtable',
    'air table': 'Airtable',
    'hubspot': 'HubSpot',
    'hub spot': 'HubSpot',
    'salesforce': 'Salesforce',
    'sales force': 'Salesforce',
    'mailchimp': 'Mailchimp',
    'mail chimp': 'Mailchimp',
    'constantcontact': 'Constant Contact',
    'zoho': 'Zoho',
    'zendesk': 'Zendesk',
    'intercom': 'Intercom',
    'freshdesk': 'Freshdesk',
    'medallia': 'Medallia',
    'zappi': 'Zappi',
    'toluna': 'Toluna',
    'quantilope': 'Quantilope',
    'forsta': 'Forsta',
    'alchemer': 'Alchemer',
    'suzy': 'Suzy',
    'attest': 'Attest',
    'pollfish': 'Pollfish',
    'momentive': 'Momentive',
    'usertesting': 'UserTesting',
    'user testing': 'UserTesting',
    'hotjar': 'Hotjar',
    'hot jar': 'Hotjar',
    'fullstory': 'FullStory',
    'full story': 'FullStory',
    'amplitude': 'Amplitude',
    'mixpanel': 'Mixpanel',
    'heap': 'Heap',
    'pendo': 'Pendo',
    'gainsight': 'Gainsight',
    'clickup': 'ClickUp',
    'click up': 'ClickUp',
    'asana': 'Asana',
    'monday': 'Monday.com',
    'mondaycom': 'Monday.com',
    'notion': 'Notion',
    'trello': 'Trello',
    'slack': 'Slack',
    'discord': 'Discord',
    'zoom': 'Zoom',
    'teams': 'Microsoft Teams',
    'microsoftteams': 'Microsoft Teams',
  };

  // Check if we have a known alias
  if (brandAliases[lower]) {
    return brandAliases[lower];
  }

  // Capitalize first letter of each word for consistency
  return normalized.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Query ChatGPT
async function queryChatGPT(question) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: question }],
        max_tokens: 2048,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    }
    return `Error: ${response.status}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Query Claude
async function queryClaude(question) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: question }],
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.content[0].text;
    }
    return `Error: ${response.status}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Query Gemini
async function queryGemini(question) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: question }] }],
        }),
      }
    );
    if (response.ok) {
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }
    return `Error: ${response.status}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Query Perplexity
async function queryPerplexity(question) {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: question }],
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    }
    return `Error: ${response.status}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// True only if the string looks like a publisher/website name, not a product or feature phrase
function isLikelyPublisherOrDomain(str) {
  if (!str || typeof str !== "string") return false;
  const s = str.trim();
  if (s.length < 2 || s.length > 60) return false;
  // Domain-like: contains a dot (e.g. nytimes.com, techcrunch.com)
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s) || (s.includes(".") && !s.includes(" "))) return true;
  // Product/feature phrases: long, or contain em-dash/ " or " / " for " / " in " (descriptive)
  if (s.includes(" – ") || s.includes(" or ") || s.includes(" for ") || s.includes(" in ")) return false;
  if (s.split(/\s+/).length > 4) return false;
  // Reject if it looks like a sentence fragment (ends with period mid-phrase, or has "ideal", "features", etc.)
  if (/\b(ideal|features|functionality|minimalist|travel-ready|refined|premium|offers)\b/i.test(s)) return false;
  return true;
}

// Extract reference list from response text (e.g. [1] url, [2] Source Name at end)
// Returns map: { "1": "url or name", "2": "..." } — only publisher/domain-like values
function extractReferenceMap(responseText) {
  if (!responseText || typeof responseText !== "string") return {};
  const map = {};
  const text = responseText.trim();
  // Prefer the last 2500 chars (reference blocks are usually at the end)
  const tail = text.length > 2500 ? text.slice(-2500) : text;
  const lines = tail.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    // [1] https://... or [1] Source Name (allow optional trailing content)
    const bracketMatch = trimmed.match(/^\[\s*(\d+)\s*\]\s*(.+)$/);
    if (bracketMatch) {
      const num = String(bracketMatch[1]).trim();
      let value = (bracketMatch[2] || "").trim();
      // Strip trailing markdown or parentheses
      value = value.replace(/\s*[\(\[].*$/, "").trim();
        if (value.length > 1 && !/^[\s\[\]\d,.-]+$/.test(value)) {
        if (value.startsWith("http")) {
          try {
            const u = new URL(value.split(/\s/)[0]);
            value = u.hostname.replace(/^www\./, "") + (u.pathname !== "/" && u.pathname.length < 40 ? u.pathname : "");
          } catch (_) {}
        }
        if (!map[num] && isLikelyPublisherOrDomain(value)) map[num] = value;
      }
      continue;
    }
    // 1. https://... or 1) Source Name
    const numDotMatch = trimmed.match(/^(\d+)[.)]\s*(.+)$/);
    if (numDotMatch) {
      const num = String(numDotMatch[1]).trim();
      let value = (numDotMatch[2] || "").trim();
      value = value.replace(/\s*[\(\[].*$/, "").trim();
      if (value.length > 1 && !/^[\s\[\]\d,.-]+$/.test(value)) {
        if (value.startsWith("http")) {
          try {
            const u = new URL(value.split(/\s/)[0]);
            value = u.hostname.replace(/^www\./, "") + (u.pathname !== "/" && u.pathname.length < 40 ? u.pathname : "");
          } catch (_) {}
        }
        if (!map[num] && isLikelyPublisherOrDomain(value)) map[num] = value;
      }
    }
  }
  // Fallback: inline [1] url [2] url in same line
  const inlineRe = /\[\s*(\d+)\s*\]\s*(https?:\/\/[^\s\[\]]+)/gi;
  let m;
  while ((m = inlineRe.exec(text)) !== null) {
    const num = String(m[1]).trim();
    if (!map[num]) {
      try {
        const u = new URL(m[2]);
        map[num] = u.hostname.replace(/^www\./, "") + (u.pathname !== "/" && u.pathname.length < 40 ? u.pathname : "");
      } catch (_) {
        map[num] = m[2];
      }
    }
  }

  // Fallback: response has [1] [2] but no explicit list — collect all URLs from tail by order
  if (Object.keys(map).length === 0 && /\[\s*\d+\s*\]/.test(text)) {
    const urlRe = /https?:\/\/[^\s)\]>\"]+/g;
    const seen = new Set();
    let idx = 1;
    while ((m = urlRe.exec(tail)) !== null) {
      try {
        const u = new URL(m[0]);
        const val = u.hostname.replace(/^www\./, "") + (u.pathname !== "/" && u.pathname.length < 30 ? u.pathname : "");
        if (!seen.has(val)) {
          seen.add(val);
          map[String(idx)] = val;
          idx++;
        }
      } catch (_) {}
    }
  }

  return map;
}

// If sources_cited contains citation markers [1], [2], resolve them using the response's reference list
function resolveSourcesCited(sourcesCitedStr, responseText) {
  if (!sourcesCitedStr || typeof sourcesCitedStr !== "string") return sourcesCitedStr || "";
  const trimmed = sourcesCitedStr.trim();
  if (!trimmed) return "";
  const refMap = extractReferenceMap(responseText);
  const hasMarkers = /\[\s*\d+\s*\]/.test(trimmed);
  if (!hasMarkers) return sourcesCitedStr;
  if (Object.keys(refMap).length === 0) return ""; // Don't persist raw [1], [2]
  const parts = [];
  const markerRe = /\[\s*(\d+)\s*\]/g;
  let match;
  const seen = new Set();
  while ((match = markerRe.exec(trimmed)) !== null) {
    const num = match[1];
    if (refMap[num] && !seen.has(refMap[num])) {
      seen.add(refMap[num]);
      parts.push(refMap[num]);
    }
  }
  return parts.length > 0 ? parts.join(", ") : ""; // Prefer empty over unresolved markers
}

// Analyze responses using Claude
async function analyzeResponses(brandName, keyMessages, competitors, question, responses) {
  const prompt = `You are analyzing AI responses for brand visibility.
BRAND: ${brandName}
KEY MESSAGES: ${keyMessages.join(", ")}
COMPETITORS: ${competitors.join(", ")}
QUESTION: ${question}
RESPONSES:
ChatGPT: ${responses.chatgpt}
Claude: ${responses.claude}
Gemini: ${responses.gemini}
Perplexity: ${responses.perplexity}

Score each response (0-100) on:
- mention: Was the brand mentioned? (0=no, 100=yes prominently)
- position: Where was brand positioned? (100=first, 75=second, 50=mentioned, 0=absent)
- sentiment: How positive? (0=negative, 50=neutral, 100=positive)
- recommendation: Was it recommended? (0=no, 100=explicitly recommended)
- message_alignment: Did it reflect key messages? (0-100)
- overall: Weighted average
- notes: Write a brief 2-3 sentence summary explaining how this AI answered the question and what it prioritized (e.g., which brands it featured, what criteria it emphasized, whether it gave a direct recommendation)
- sources_cited: List ONLY publication names, website names, or domains (e.g. TechCrunch, G2, Wikipedia, nytimes.com). Resolve [1], [2] from the reference list at the end of each response to the actual source. Never include product names, brand names, feature descriptions, or sentence fragments (e.g. "luxury handbag" or "Travel-ready functionality" are wrong; "Vogue", "nytimes.com" are correct). Output comma-separated. If no real publisher/website sources, return empty string.

Return ONLY valid JSON:
{
  "chatgpt": {"mention":0,"position":0,"sentiment":0,"recommendation":0,"message_alignment":0,"overall":0,"competitors_mentioned":"","notes":"Brief summary...","sources_cited":""},
  "claude": {"mention":0,"position":0,"sentiment":0,"recommendation":0,"message_alignment":0,"overall":0,"competitors_mentioned":"","notes":"Brief summary...","sources_cited":""},
  "gemini": {"mention":0,"position":0,"sentiment":0,"recommendation":0,"message_alignment":0,"overall":0,"competitors_mentioned":"","notes":"Brief summary...","sources_cited":""},
  "perplexity": {"mention":0,"position":0,"sentiment":0,"recommendation":0,"message_alignment":0,"overall":0,"competitors_mentioned":"","notes":"Brief summary...","sources_cited":""}
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    let raw = data.content[0].text;
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }
    const parsed = JSON.parse(raw);
    const platforms = ["chatgpt", "claude", "gemini", "perplexity"];
    for (const p of platforms) {
      const cited = parsed[p]?.sources_cited || "";
      const responseText = responses[p] || "";
      if (cited && responseText) {
        const resolved = resolveSourcesCited(cited, responseText);
        if (resolved) parsed[p].sources_cited = resolved;
      }
      // When Claude left sources_cited empty but response has [1], [2] and URLs, fill from extraction
      if ((!cited || !cited.trim()) && responseText && /\[\s*\d+\s*\]/.test(responseText)) {
        const refMap = extractReferenceMap(responseText);
        if (Object.keys(refMap).length > 0) {
          const ordered = Object.keys(refMap)
            .sort((a, b) => Number(a) - Number(b))
            .map((k) => refMap[k])
            .filter((v) => isLikelyPublisherOrDomain(v));
          parsed[p].sources_cited = ordered.join(", ");
        }
      }
      // Keep only publisher/website names — drop product phrases or feature text
      const current = parsed[p]?.sources_cited || "";
      if (current) {
        const filtered = current
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s && isLikelyPublisherOrDomain(s));
        parsed[p].sources_cited = filtered.join(", ");
      }
    }
    return parsed;
  } catch (error) {
    console.error("Analysis error:", error);
    return {
      chatgpt: { mention: 0, position: 0, sentiment: 0, recommendation: 0, message_alignment: 0, overall: 0, competitors_mentioned: "", notes: "", sources_cited: "" },
      claude: { mention: 0, position: 0, sentiment: 0, recommendation: 0, message_alignment: 0, overall: 0, competitors_mentioned: "", notes: "", sources_cited: "" },
      gemini: { mention: 0, position: 0, sentiment: 0, recommendation: 0, message_alignment: 0, overall: 0, competitors_mentioned: "", notes: "", sources_cited: "" },
      perplexity: { mention: 0, position: 0, sentiment: 0, recommendation: 0, message_alignment: 0, overall: 0, competitors_mentioned: "", notes: "", sources_cited: "" },
    };
  }
}

// Generate content strategy recommendations based on AI responses
async function generateContentRecommendations(brandName, category, industry, results, brandRankings, brandCoverage, topCompetitors) {
  // Collect sample responses and themes from results
  const sampleResponses = results.slice(0, 5).map(r => ({
    question: r.question_text,
    chatgpt: (r.chatgpt_response || '').substring(0, 500),
    claude: (r.claude_response || '').substring(0, 500),
    gemini: (r.gemini_response || '').substring(0, 500),
    perplexity: (r.perplexity_response || '').substring(0, 500)
  }));

  const topBrands = brandRankings.slice(0, 5).map(b => b.brand).join(', ');

  const prompt = `You are an AI visibility and content strategy expert. Analyze these AI responses and generate 5 specific, actionable content recommendations.

BRAND: ${brandName}
CATEGORY: ${category}
INDUSTRY: ${industry}
CURRENT COVERAGE: ${brandCoverage}% of queries mention this brand
TOP COMPETITORS IN AI RESPONSES: ${topCompetitors.join(', ')}
TOP MENTIONED BRANDS: ${topBrands}

SAMPLE AI RESPONSES TO CATEGORY QUESTIONS:
${sampleResponses.map((s, i) => `
Q${i+1}: ${s.question}
- ChatGPT highlighted: ${s.chatgpt}
- Claude highlighted: ${s.claude}
- Gemini highlighted: ${s.gemini}
- Perplexity highlighted: ${s.perplexity}
`).join('\n')}

Based on what the AI models value and recommend, generate exactly 5 content strategy recommendations. Each recommendation should:
1. Be specific and actionable (not generic advice)
2. Focus on creating content that will improve AI visibility
3. Address specific topics, attributes, or themes the AI models seem to prioritize
4. Help the brand get mentioned more and ranked higher in future AI responses
5. Include specific content types (blog posts, comparison pages, case studies, etc.)

Return ONLY valid JSON array with exactly 5 items:
[
  {
    "priority": "high|medium|low",
    "title": "Short action title (5-8 words)",
    "description": "Detailed explanation of what content to create and why it will help (2-3 sentences)",
    "content_type": "Type of content (e.g., Blog Post, Comparison Guide, Case Study, FAQ Page, etc.)"
  }
]`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    let raw = data.content[0].text;
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const firstBracket = raw.indexOf("[");
    const lastBracket = raw.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1) {
      raw = raw.substring(firstBracket, lastBracket + 1);
    }

    const recommendations = JSON.parse(raw);

    // Ensure we have exactly 5 recommendations
    if (recommendations.length >= 5) {
      return recommendations.slice(0, 5);
    }

    // Pad with defaults if needed
    const defaults = [
      { priority: "high", title: "Create comparison content vs top competitors", description: "Develop detailed comparison guides showing your brand's advantages over competitors frequently mentioned by AI. Focus on the specific features and benefits AI models highlight.", content_type: "Comparison Guide" },
      { priority: "high", title: "Publish expert thought leadership content", description: "Create authoritative content that positions your brand as an industry leader. AI models favor brands with strong expertise signals and comprehensive educational content.", content_type: "Blog Post Series" },
      { priority: "medium", title: "Build detailed use case documentation", description: "Document specific use cases and success stories that align with how AI models categorize solutions in your space. Include concrete examples and outcomes.", content_type: "Case Studies" },
      { priority: "medium", title: "Optimize for question-based queries", description: "Create FAQ and Q&A content that directly addresses the types of questions users ask AI assistants about your category. Mirror the question formats in your content.", content_type: "FAQ Page" },
      { priority: "medium", title: "Strengthen technical documentation", description: "Enhance your technical docs and feature explanations to match the depth of information AI models cite when recommending solutions.", content_type: "Documentation" }
    ];

    while (recommendations.length < 5) {
      recommendations.push(defaults[recommendations.length]);
    }

    return recommendations;
  } catch (error) {
    console.error("Content recommendations error:", error);
    // Return default recommendations on error
    return [
      { priority: "high", title: "Create comparison content vs top competitors", description: `Develop detailed comparison guides showing ${brandName}'s advantages over ${topCompetitors[0] || 'competitors'}. AI models frequently cite comparative information when making recommendations.`, content_type: "Comparison Guide" },
      { priority: "high", title: "Publish expert thought leadership content", description: `Create authoritative ${industry} content that positions ${brandName} as an industry leader. AI models favor brands with strong expertise signals.`, content_type: "Blog Post Series" },
      { priority: "medium", title: "Build detailed use case documentation", description: `Document specific ${category} use cases with concrete examples and outcomes. AI models value solution-oriented content with measurable results.`, content_type: "Case Studies" },
      { priority: "medium", title: "Optimize FAQ content for AI queries", description: `Create comprehensive Q&A content addressing common ${category} questions. Structure content to match how users query AI assistants.`, content_type: "FAQ Page" },
      { priority: "medium", title: "Strengthen feature and benefit documentation", description: `Enhance documentation of ${brandName}'s key features and benefits. AI models cite detailed product information when recommending solutions.`, content_type: "Product Documentation" }
    ];
  }
}

// Save results to Airtable Raw Question Data table
async function saveToAirtable(results, sessionId) {
  const tableName = "raw question data";
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;
  const headers = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
  };

  const createdRecords = [];

  // Airtable accepts max 10 records per request
  for (let i = 0; i < results.length; i += 10) {
    const batch = results.slice(i, i + 10);
    const records = batch.map((r, idx) => {
      const analysis = r.analysis || {};
      return {
        fields: {
          session_id: sessionId,
          run_id: r.run_id || "",
          customer_id: r.customer_id || "",
          question_number: i + idx + 1,
          question_text: r.question_text || "",
          question_category: r.question_category || "",
          analyzed_at: r.run_date || "",
          chatgpt_response: r.chatgpt_response || "",
          claude_response: r.claude_response || "",
          gemini_response: r.gemini_response || "",
          perplexity_response: r.perplexity_response || "",
          chatgpt_mention: analysis.chatgpt?.mention || 0,
          chatgpt_position: analysis.chatgpt?.position || 0,
          chatgpt_sentiment: analysis.chatgpt?.sentiment || 0,
          chatgpt_recommendation: analysis.chatgpt?.recommendation || 0,
          chatgpt_message_alignment: analysis.chatgpt?.message_alignment || 0,
          chatgpt_overall: analysis.chatgpt?.overall || 0,
          chatgpt_notes: analysis.chatgpt?.notes || "",
          chatgpt_sources: analysis.chatgpt?.sources_cited || "",
          claude_mention: analysis.claude?.mention || 0,
          claude_position: analysis.claude?.position || 0,
          claude_sentiment: analysis.claude?.sentiment || 0,
          claude_recommendation: analysis.claude?.recommendation || 0,
          claude_message_alignment: analysis.claude?.message_alignment || 0,
          claude_overall: analysis.claude?.overall || 0,
          claude_notes: analysis.claude?.notes || "",
          claude_sources: analysis.claude?.sources_cited || "",
          gemini_mention: analysis.gemini?.mention || 0,
          gemini_position: analysis.gemini?.position || 0,
          gemini_sentiment: analysis.gemini?.sentiment || 0,
          gemini_recommendation: analysis.gemini?.recommendation || 0,
          gemini_message_alignment: analysis.gemini?.message_alignment || 0,
          gemini_overall: analysis.gemini?.overall || 0,
          gemini_notes: analysis.gemini?.notes || "",
          gemini_sources: analysis.gemini?.sources_cited || "",
          perplexity_mention: analysis.perplexity?.mention || 0,
          perplexity_position: analysis.perplexity?.position || 0,
          perplexity_sentiment: analysis.perplexity?.sentiment || 0,
          perplexity_recommendation: analysis.perplexity?.recommendation || 0,
          perplexity_message_alignment: analysis.perplexity?.message_alignment || 0,
          perplexity_overall: analysis.perplexity?.overall || 0,
          perplexity_notes: analysis.perplexity?.notes || "",
          perplexity_sources: analysis.perplexity?.sources_cited || "",
        },
      };
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ records }),
      });
      if (response.ok) {
        const data = await response.json();
        createdRecords.push(...(data.records || []));
      } else {
        const errorBody = await response.text();
        console.error(`Airtable error: ${response.status} - ${errorBody}`);
        console.error(`Token prefix: ${AIRTABLE_API_KEY?.substring(0, 10)}...`);
      }
    } catch (error) {
      console.error("Airtable save error:", error);
    }
  }

  return createdRecords;
}

// Analyze aggregated run data
async function analyzeRunData(results, brandName, validCompetitors, industry, category) {
  const avg = (nums) => {
    const valid = nums.filter((n) => typeof n === "number" && n <= 100);
    return valid.length ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10 : 0;
  };

  const avgNonzero = (nums) => {
    const valid = nums.filter((n) => typeof n === "number" && n > 0 && n <= 100);
    return valid.length ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10 : 0;
  };

  brandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
  const numQuestions = results.length;
  const platforms = ["chatgpt", "claude", "gemini", "perplexity"];
  const platformNames = { chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini", perplexity: "Perplexity" };

  const platformData = {};
  for (const p of platforms) {
    platformData[p] = { mention: [], position: [], sentiment: [], recommendation: [], message_alignment: [], overall: [], competitors_mentioned: [], sources_cited: [] };
  }

  // Track all sources across all platforms
  const sourceCounts = {};

  for (const r of results) {
    const analysis = r.analysis || {};
    for (const p of platforms) {
      const pAnalysis = analysis[p] || {};
      platformData[p].mention.push(pAnalysis.mention || 0);
      platformData[p].position.push(pAnalysis.position || 0);
      platformData[p].sentiment.push(pAnalysis.sentiment || 0);
      platformData[p].recommendation.push(Math.min(pAnalysis.recommendation || 0, 100));
      platformData[p].message_alignment.push(pAnalysis.message_alignment || 0);
      platformData[p].overall.push(pAnalysis.overall || 0);
      platformData[p].competitors_mentioned.push(pAnalysis.competitors_mentioned || "");
      platformData[p].sources_cited.push(pAnalysis.sources_cited || "");

      // Aggregate sources for top sources (only publisher/website names, not product phrases)
      const sourcesStr = pAnalysis.sources_cited || "";
      if (sourcesStr) {
        const citationMarker = /^\[\s*\d+\s*\]$/;
        const sources = sourcesStr
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s && s.length > 1 && !citationMarker.test(s) && isLikelyPublisherOrDomain(s));
        for (const source of sources) {
          const normalizedSource = source.charAt(0).toUpperCase() + source.slice(1).toLowerCase();
          sourceCounts[normalizedSource] = (sourceCounts[normalizedSource] || 0) + 1;
        }
      }
    }
  }

  // Build top sources array sorted by frequency
  const topSources = Object.entries(sourceCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);  // Keep top 10 sources

  // Calculate percentages for top sources
  const totalSourceRefs = topSources.reduce((sum, s) => sum + s.count, 0) || 1;
  for (const source of topSources) {
    source.percentage = Math.round((source.count / totalSourceRefs) * 100);
  }

  // Count brand mentions and competitor mentions (with normalization)
  const brandMentionCounts = {};
  const brandMentionedPerQuestion = [];
  const normalizedTrackedBrand = normalizeBrandName(brandName);

  for (let i = 0; i < numQuestions; i++) {
    let questionBrandMentioned = false;
    for (const p of platforms) {
      if (platformData[p].mention[i] > 0) {
        questionBrandMentioned = true;
        // Use normalized brand name for counting
        brandMentionCounts[normalizedTrackedBrand] = (brandMentionCounts[normalizedTrackedBrand] || 0) + 1;
      }
      // Parse competitors mentioned from analysis
      const competitorsStr = platformData[p].competitors_mentioned[i] || "";
      if (competitorsStr) {
        const competitors = competitorsStr.split(",").map(c => c.trim()).filter(c => c);
        for (const comp of competitors) {
          // Normalize competitor names to consolidate variations
          const normalizedComp = normalizeBrandName(comp);
          if (normalizedComp && normalizedComp.length > 1) {
            brandMentionCounts[normalizedComp] = (brandMentionCounts[normalizedComp] || 0) + 1;
          }
        }
      }
    }
    brandMentionedPerQuestion.push(questionBrandMentioned);
  }

  const brandAppearedCount = brandMentionedPerQuestion.filter((m) => m).length;
  const brandCoverage = numQuestions > 0 ? Math.round((brandAppearedCount / numQuestions) * 1000) / 10 : 0;

  // Brand rankings - always show top 10
  const totalMentions = Object.values(brandMentionCounts).reduce((a, b) => a + b, 0);
  const brandRankings = [];
  for (const [brand, count] of Object.entries(brandMentionCounts)) {
    const sov = totalMentions > 0 ? Math.round((count / totalMentions) * 1000) / 10 : 0;
    // Check if this is the tracked brand (comparing normalized versions)
    const isTracked = brand.toLowerCase() === normalizedTrackedBrand.toLowerCase();
    brandRankings.push({ brand, mentions: count, share_of_voice: sov, is_tracked_brand: isTracked });
  }
  brandRankings.sort((a, b) => b.mentions - a.mentions);

  // Ensure we always have at least 10 entries (pad with tracked brand at 0 if needed)
  if (brandRankings.length < 10 && !brandRankings.some(b => b.is_tracked_brand)) {
    brandRankings.push({
      brand: normalizedTrackedBrand,
      mentions: 0,
      share_of_voice: 0,
      is_tracked_brand: true
    });
  }

  let brandRank = null;
  let brandSov = 0;
  for (let i = 0; i < brandRankings.length; i++) {
    if (brandRankings[i].is_tracked_brand) {
      brandRank = i + 1;
      brandSov = brandRankings[i].share_of_voice;
      break;
    }
  }

  // Platform metrics
  const platformsSummary = {};
  for (const p of platforms) {
    platformsSummary[p] = {
      score: avg(platformData[p].overall),
      mention: avg(platformData[p].mention),
      sentiment: avgNonzero(platformData[p].sentiment),
      recommendation: avg(platformData[p].recommendation),
    };
  }

  const allScores = platforms.map((p) => platformsSummary[p].score);
  const overallScore = allScores.length ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10 : 0;

  const sortedPlatforms = Object.entries(platformsSummary).sort((a, b) => b[1].score - a[1].score);
  const bestModel = sortedPlatforms.length ? platformNames[sortedPlatforms[0][0]] : "";
  const bestScore = sortedPlatforms.length ? sortedPlatforms[0][1].score : 0;
  const worstModel = sortedPlatforms.length ? platformNames[sortedPlatforms[sortedPlatforms.length - 1][0]] : "";

  // Platform consistency
  const platformMentionRates = {};
  for (const p of platforms) {
    platformMentionRates[p] = avg(platformData[p].mention);
  }
  const consistencyValues = Object.values(platformMentionRates);
  const platformConsistency = {
    rates: platformMentionRates,
    variance: consistencyValues.length ? Math.round((Math.max(...consistencyValues) - Math.min(...consistencyValues)) * 10) / 10 : 0,
    strongest: Object.entries(platformMentionRates).sort((a, b) => b[1] - a[1])[0]?.[0] || "",
    weakest: Object.entries(platformMentionRates).sort((a, b) => a[1] - b[1])[0]?.[0] || "",
    is_consistent: consistencyValues.length ? Math.max(...consistencyValues) - Math.min(...consistencyValues) < 30 : true,
  };

  // Question breakdown
  const questionBreakdown = results.map((r, i) => {
    const mentionedOn = [];
    for (const p of platforms) {
      if (platformData[p].mention[i] > 0) {
        mentionedOn.push(p[0].toUpperCase());
      }
    }
    return {
      q: i + 1,
      text: (r.question_text || "").substring(0, 50),
      category: r.question_category || "",
      m: mentionedOn.length ? 1 : 0,
      p: mentionedOn.join(""),
    };
  });

  // Generate content-focused recommendations using AI analysis
  const topCompetitors = brandRankings.filter(b => !b.is_tracked_brand).slice(0, 5).map(b => b.brand);
  const recommendations = await generateContentRecommendations(
    brandName,
    category || industry || "general",
    industry || category || "general",
    results,
    brandRankings,
    brandCoverage,
    topCompetitors
  );

  // Calculate averages for executive summary
  const avgRec = avg(platforms.map((p) => platformsSummary[p].recommendation));
  const avgSent = avgNonzero(platforms.map((p) => platformsSummary[p].sentiment));

  // Executive summary
  const topCompetitorsList = brandRankings.filter((b) => !b.is_tracked_brand).slice(0, 3).map((b) => b.brand);
  const avgSentDisplay = avgSent > 0 ? avgSent : 50;

  let headline;
  let paragraphs = [];
  let bullets = [];

  if (brandRank && brandRank <= 3 && brandCoverage >= 50) {
    headline = `${brandName} leads AI visibility in its category`;
    paragraphs.push(
      `${brandName} demonstrates strong AI visibility with a score of ${overallScore}, appearing in ${brandCoverage}% of relevant AI queries. The brand is consistently mentioned and recommended across major AI platforms.`
    );
    paragraphs.push(
      `${bestModel} shows the strongest affinity for ${brandName}, while ${worstModel} presents the biggest opportunity for improvement. The brand maintains a ${avgSentDisplay}% positive sentiment rating across all platforms.`
    );
  } else if (brandCoverage >= 50) {
    headline = `${brandName} has moderate AI visibility with room to grow`;
    paragraphs.push(
      `${brandName} appears in ${brandCoverage}% of relevant AI queries with a visibility score of ${overallScore}. While the brand has established presence, there are opportunities to strengthen positioning.`
    );
    paragraphs.push(
      `Performance varies across platforms, with ${bestModel} providing the strongest visibility and ${worstModel} offering the most room for improvement.`
    );
  } else {
    headline = `${brandName} has limited AI visibility - action needed`;
    paragraphs.push(
      `${brandName} currently appears in only ${brandCoverage}% of relevant AI queries, with a visibility score of ${overallScore}. This indicates significant opportunity to improve AI discoverability.`
    );
    paragraphs.push(
      `Focusing on content optimization and brand authority signals could help improve visibility across AI platforms.`
    );
  }

  // Generate insight bullets
  bullets.push(`Visibility Score: ${overallScore} out of 100`);
  bullets.push(`Brand Coverage: Mentioned in ${brandCoverage}% of queries`);
  bullets.push(`Best Platform: ${bestModel} (strongest performance)`);
  bullets.push(`Recommendation Rate: ${avgRec}% across all platforms`);
  if (topCompetitorsList.length > 0) {
    bullets.push(`Top Competitors: ${topCompetitorsList.join(', ')}`);
  }
  if (brandSov > 0) {
    bullets.push(`Share of Voice: ${brandSov}% of total brand mentions`);
  }

  const execSummary = {
    headline,
    paragraphs,
    bullets,
    visibility_score: overallScore,
    brand_coverage: brandCoverage,
    brand_rank: brandRank,
    brand_sov: brandSov,
    best_model: bestModel,
    worst_model: worstModel,
    avg_sentiment: avgSentDisplay,
    avg_recommendation: avgRec,
    top_competitors: topCompetitorsList,
  };

  return {
    visibility_score: overallScore,
    brand_name: brandName,
    industry,
    best_model: bestModel,
    worst_model: worstModel,
    executive_summary: execSummary,
    brand_rankings: brandRankings.slice(0, 10),
    brand_rank: brandRank || 0,
    brand_sov: brandSov,
    platform_consistency: platformConsistency,
    platforms_summary: platformsSummary,
    question_breakdown: questionBreakdown,
    brand_coverage: brandCoverage,
    recommendations,
    num_questions_processed: numQuestions,
    top_sources: topSources,
  };
}

// Save dashboard output to Airtable
async function saveDashboardOutput(analysis, runId, sessionId, brandLogo, brandAssets) {
  const tableId = "tblheMjYJzu1f88Ft";
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}`;
  const headers = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
  };

  const score = analysis.visibility_score || 0;
  let grade;
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";
  else grade = "F";

  const platformsSummary = analysis.platforms_summary || {};
  const platformsJson = {};
  for (const [p, data] of Object.entries(platformsSummary)) {
    platformsJson[p] = {
      score: data.score || 0,
      mention: data.mention || 0,
      sentiment: data.sentiment || 50,
      recommendation: data.recommendation || 0,
      trend: "flat",
    };
  }

  const brandRankings = analysis.brand_rankings || [];
  const competitorsSov = brandRankings
    .filter((b) => !b.is_tracked_brand)
    .slice(0, 3)
    .map((b) => ({ name: b.brand, share: b.share_of_voice }));
  const shareOfVoiceJson = {
    brand: analysis.brand_sov || 0,
    competitors: competitorsSov,
  };

  const alerts = [];
  for (const [p, data] of Object.entries(platformsSummary)) {
    const rec = data.recommendation || 0;
    if (rec === 0) {
      alerts.push({ type: "critical", message: `${p.charAt(0).toUpperCase() + p.slice(1)} never recommends ${analysis.brand_name}`, platform: p });
    } else if (rec < 40) {
      alerts.push({ type: "warning", message: `${p.charAt(0).toUpperCase() + p.slice(1)} recommendation rate is only ${rec}%`, platform: p });
    }
  }

  const actions = [];
  const sortedPlatforms = Object.entries(platformsSummary).sort((a, b) => a[1].score - b[1].score);
  const worst = sortedPlatforms[0];
  const best = sortedPlatforms[sortedPlatforms.length - 1];

  if (worst) {
    actions.push({ priority: "high", action: `Investigate why ${worst[0].charAt(0).toUpperCase() + worst[0].slice(1)} underperforms`, impact: `Score: ${worst[1].score}`, effort: "High" });
  }
  if (best) {
    actions.push({ priority: "low", action: `Maintain ${best[0].charAt(0).toUpperCase() + best[0].slice(1)} performance`, impact: "Protect top performer", effort: "Low" });
  }

  const fields = {
    run_id: runId,
    session_id: sessionId,
    brand_name: analysis.brand_name || "",
    brand_logo: brandLogo || "",
    report_date: new Date().toISOString().split("T")[0],
    visibility_score: parseFloat(score),
    grade,
    best_model: analysis.best_model || "",
    worst_model: analysis.worst_model || "",
    platforms_json: JSON.stringify(platformsJson),
    share_of_voice_json: JSON.stringify(shareOfVoiceJson),
    alerts_json: JSON.stringify(alerts),
    actions_json: JSON.stringify(actions),
    recommendations_json: JSON.stringify(analysis.recommendations || []),
    platform_consistency_json: JSON.stringify(analysis.platform_consistency || {}),
    question_breakdown_json: JSON.stringify(analysis.question_breakdown || []),
    brand_rankings_json: JSON.stringify(brandRankings),
    executive_summary_json: JSON.stringify(analysis.executive_summary || {}),
    history_json: JSON.stringify([{ date: "Current", score }]),
    top_sources_json: JSON.stringify(analysis.top_sources || []),
  };

  // brand_coverage is singleLineText, others are multilineText - all need strings
  fields.brand_coverage = String(Math.round(analysis.brand_coverage || 0));
  fields.brand_rank = String(Math.round(analysis.brand_rank || 0));
  fields.brand_sov = String(Math.round(analysis.brand_sov || 0));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ records: [{ fields }] }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.records?.[0] || {};
    }
    const errorBody = await response.text();
    console.error(`Dashboard Output error: ${response.status} - ${errorBody}`);
    console.error(`Token prefix: ${AIRTABLE_API_KEY?.substring(0, 10)}...`);
    return {};
  } catch (error) {
    console.error("Dashboard save error:", error);
    return {};
  }
}

// Send dashboard link via SendGrid
async function sendDashboardEmail(email, brandName, sessionId, analysisData) {
  if (!SENDGRID_API_KEY || !email) {
    console.log("Skipping email: missing API key or email address");
    return;
  }

  const dashboardUrl = `https://ai.futureproof.work/?report=${sessionId}&utm_campaign=website&utm_medium=email&utm_source=sendgrid.com`;
  const signupUrl = 'https://futureproof.work/ai-optimizer-sign-up';

  // Extract platform scores
  const platforms = analysisData.platforms_summary || {};
  const chatgptScore = Math.round(platforms.chatgpt?.score || 0);
  const claudeScore = Math.round(platforms.claude?.score || 0);
  const geminiScore = Math.round(platforms.gemini?.score || 0);
  const perplexityScore = Math.round(platforms.perplexity?.score || 0);

  // Generate 2-sentence summary
  const visibilityScore = analysisData.visibility_score || 0;
  const brandCoverage = analysisData.brand_coverage || 0;
  const bestModel = analysisData.best_model || 'ChatGPT';
  const brandRank = analysisData.brand_rank;

  let summary = '';
  if (brandRank && brandRank <= 3) {
    summary = `${brandName} shows strong AI visibility with a score of ${visibilityScore}, ranking #${brandRank} in your category. ${bestModel} demonstrates the highest affinity for your brand among the AI platforms analyzed.`;
  } else if (brandCoverage >= 50) {
    summary = `${brandName} appears in ${brandCoverage}% of AI responses with an overall visibility score of ${visibilityScore}. There are clear opportunities to improve positioning, particularly on platforms where competitors currently dominate.`;
  } else {
    summary = `${brandName} has a visibility score of ${visibilityScore}, appearing in ${brandCoverage}% of relevant AI queries. Your full report reveals specific strategies to significantly improve your AI presence and outrank competitors.`;
  }

  // LLM Logo URLs
  const logoUrls = {
    chatgpt: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/f7aa1278-3451-4421-8d3b-2de8511dd5ca/1500x469.png',
    claude: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/05a8de1c-981d-45ad-bc39-9cdeb919a36d/1900x594.png',
    gemini: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/1b084fb7-37b9-4763-a356-7e51ea261505/800x250.png',
    perplexity: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/34211da5-8bf5-41bd-821a-62ee0bb0e811/1700x531.png'
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#ff8a80';
    if (score >= 50) return '#ff6b4a';
    return '#a855f7';
  };

  const emailContent = {
    personalizations: [{ to: [{ email }] }],
    from: { email: "ai-ready@futureproof.work", name: "FutureProof AI" },
    subject: `Your AI Visibility Report for ${brandName} is Ready`,
    content: [
      {
        type: "text/html",
        value: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000000; color: #ffffff; padding: 32px; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/d19d829c-a9a9-4fad-b0e7-7938012be26c/800x200.png" alt="FutureProof" style="height: 32px; margin-bottom: 16px;" />
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Your AI Visibility Report is Ready</h1>
            </div>

            <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(245,166,35,0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0;">${summary}</p>
            </div>

            <div style="margin-bottom: 32px;">
              <h3 style="color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">Platform Scores</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,107,74,0.15); border-radius: 8px 0 0 8px; text-align: center; width: 25%;">
                    <img src="${logoUrls.chatgpt}" alt="ChatGPT" style="height: 20px; margin-bottom: 8px;" /><br/>
                    <span style="font-size: 24px; font-weight: bold; color: ${getScoreColor(chatgptScore)};">${chatgptScore}</span>
                  </td>
                  <td style="padding: 12px; background: rgba(255,255,255,0.05); border-top: 1px solid rgba(255,107,74,0.15); border-bottom: 1px solid rgba(255,107,74,0.15); text-align: center; width: 25%;">
                    <img src="${logoUrls.claude}" alt="Claude" style="height: 20px; margin-bottom: 8px;" /><br/>
                    <span style="font-size: 24px; font-weight: bold; color: ${getScoreColor(claudeScore)};">${claudeScore}</span>
                  </td>
                  <td style="padding: 12px; background: rgba(255,255,255,0.05); border-top: 1px solid rgba(255,107,74,0.15); border-bottom: 1px solid rgba(255,107,74,0.15); text-align: center; width: 25%;">
                    <img src="${logoUrls.gemini}" alt="Gemini" style="height: 20px; margin-bottom: 8px;" /><br/>
                    <span style="font-size: 24px; font-weight: bold; color: ${getScoreColor(geminiScore)};">${geminiScore}</span>
                  </td>
                  <td style="padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,107,74,0.15); border-radius: 0 8px 8px 0; text-align: center; width: 25%;">
                    <img src="${logoUrls.perplexity}" alt="Perplexity" style="height: 20px; margin-bottom: 8px;" /><br/>
                    <span style="font-size: 24px; font-weight: bold; color: ${getScoreColor(perplexityScore)};">${perplexityScore}</span>
                  </td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff6b4a 0%, #f97316 100%); color: white; padding: 16px 48px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 0 20px rgba(255,107,74,0.4);">See Full Report</a>
            </div>

            <div style="background: linear-gradient(90deg, rgba(245,166,35,0.15), rgba(212,20,90,0.15)); border: 1px solid rgba(245,166,35,0.3); border-radius: 12px; padding: 24px; text-align: center;">
              <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 18px;">Ready to Optimize Your AI Visibility?</h3>
              <p style="color: rgba(255,255,255,0.8); margin: 0 0 16px 0; font-size: 14px;">Sign up for FutureProof AEO – the ultimate Answer Engine Optimization platform</p>
              <a href="${signupUrl}" style="display: inline-block; background: linear-gradient(90deg, #F5A623, #D4145A); color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Sign Up Now</a>
            </div>

            <hr style="border: none; border-top: 1px solid rgba(245,166,35,0.2); margin: 32px 0;" />
            <p style="color: rgba(255,255,255,0.6); font-size: 12px; text-align: center; margin: 0;">FutureProof AI Visibility Tracker<br/>Helping brands win in the age of AI search</p>
          </div>
        `,
      },
    ],
  };

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailContent),
    });

    if (response.ok) {
      console.log(`Dashboard email sent to ${email}`);
    } else {
      console.error(`SendGrid error: ${response.status}`);
    }
  } catch (error) {
    console.error("Email send error:", error);
  }
}

// Main processing function
async function processAnalysis(data) {
  const {
    session_id: sessionId,
    run_id: runId,
    brand_name: brandName,
    logo_url: logoUrl,
    brand_assets: brandAssets,
    email,
    industry,
    category,
    key_messages: keyMessages,
    competitors,
    questions,
  } = data;

  console.log(`Starting analysis for ${brandName} (${sessionId})`);

  // Parse key messages and competitors
  const keyMessagesList = typeof keyMessages === "string" ? keyMessages.split(",").map((s) => s.trim()) : keyMessages || [];
  const competitorsList = typeof competitors === "string" ? competitors.split(",").map((s) => s.trim()) : competitors || [];

  // Process each question
  const results = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const questionText = q.text || q;
    const questionCategory = q.category || "General";

    console.log(`  Processing question ${i + 1}/${questions.length}: ${questionText.substring(0, 50)}...`);

    // Query all 4 AI platforms in parallel
    const [chatgptResponse, claudeResponse, geminiResponse, perplexityResponse] = await Promise.all([
      queryChatGPT(questionText),
      queryClaude(questionText),
      queryGemini(questionText),
      queryPerplexity(questionText),
    ]);

    const responses = {
      chatgpt: chatgptResponse,
      claude: claudeResponse,
      gemini: geminiResponse,
      perplexity: perplexityResponse,
    };

    // Analyze responses
    const analysis = await analyzeResponses(brandName, keyMessagesList, competitorsList, questionText, responses);

    results.push({
      run_id: runId,
      customer_id: sessionId,
      run_date: new Date().toISOString().split("T")[0],
      brand_name: brandName,
      question_text: questionText,
      question_category: questionCategory,
      chatgpt_response: chatgptResponse,
      claude_response: claudeResponse,
      gemini_response: geminiResponse,
      perplexity_response: perplexityResponse,
      analysis,
    });
  }

  console.log(`Saving ${results.length} results to Airtable...`);

  // Save raw results to Airtable
  await saveToAirtable(results, sessionId);

  // Analyze aggregated data
  const aggregatedAnalysis = await analyzeRunData(results, brandName, competitorsList, industry || "", category || "");

  // Save dashboard output
  await saveDashboardOutput(aggregatedAnalysis, runId, sessionId, logoUrl || "", brandAssets || {});

  // Send dashboard link via email
  await sendDashboardEmail(email, brandName, sessionId, aggregatedAnalysis);

  console.log(`Analysis complete for ${brandName}`);
  return aggregatedAnalysis;
}

// Netlify Background Function handler
// The "-background" suffix in the filename enables background execution (up to 15 min)
export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const data = JSON.parse(event.body);

    // For background functions, the processing runs and completes
    // The frontend polls Airtable for results, so we just need to process
    await processAnalysis(data);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        message: "Analysis complete",
        session_id: data.session_id,
      }),
    };
  } catch (error) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
