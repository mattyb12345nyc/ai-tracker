/**
 * Shared report parsing for App.jsx (trial report) and Dashboard.jsx (paid report).
 * Fetches dashboard + raw question data from Airtable and returns parsed report object.
 */

export const platformNames = { chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini', perplexity: 'Perplexity' };

export const platformLogos = {
  chatgpt: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/f7aa1278-3451-4421-8d3b-2de8511dd5ca/1500x469.png',
  claude: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/05a8de1c-981d-45ad-bc39-9cdeb919a36d/1900x594.png',
  gemini: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/1b084fb7-37b9-4763-a356-7e51ea261505/800x250.png',
  perplexity: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/34211da5-8bf5-41bd-821a-62ee0bb0e811/1700x531.png'
};

const capitalizeBrand = (name) => {
  if (!name || typeof name !== 'string') return '';
  const known = {
    suzy: 'Suzy', qualtrics: 'Qualtrics', surveymonkey: 'SurveyMonkey',
    typeform: 'Typeform', medallia: 'Medallia', zappi: 'Zappi',
    toluna: 'Toluna', quantilope: 'Quantilope', forsta: 'Forsta',
    chatgpt: 'ChatGPT', openai: 'OpenAI', xbox: 'Xbox',
    playstation: 'PlayStation', nintendo: 'Nintendo', alchemer: 'Alchemer'
  };
  const lower = name.toLowerCase().trim();
  if (known[lower]) return known[lower];
  return name.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const isValidBrand = (name) => {
  if (!name || typeof name !== 'string') return false;
  const invalid = ['none', 'n/a', '', 'implicit', 'implicit tier comparisons',
    'implicit (contrasts with game ownership models)', 'null', 'undefined'];
  const cleaned = name.toLowerCase().trim();
  if (invalid.includes(cleaned)) return false;
  if (cleaned.length < 2) return false;
  if (cleaned.includes('mentioned in') || cleaned.includes('not mentioned') ||
      cleaned.includes('section') || cleaned.includes('positively') ||
      cleaned.includes('negatively') || cleaned.includes('highlighted')) return false;
  return true;
};

export const extractBrands = (competitorsStr) => {
  if (!competitorsStr || typeof competitorsStr !== 'string') return [];
  const raw = competitorsStr.split(/[;,]/).map(s => s.trim());
  const brands = [];
  for (const item of raw) {
    const match = item.match(/^([A-Za-z0-9\s]+?)(?:\s+(?:mentioned|not|highlighted|in|positively|negatively|section).*)?$/i);
    if (match && match[1]) {
      const brand = match[1].trim();
      if (isValidBrand(brand)) brands.push(capitalizeBrand(brand));
    } else if (isValidBrand(item)) {
      brands.push(capitalizeBrand(item));
    }
  }
  return [...new Set(brands)];
};

const generateQuestionSummary = (brandName, platforms) => {
  const mentioned = [];
  const notMentioned = [];
  let bestScore = -1;
  let bestPlatform = '';
  for (const [platform, data] of Object.entries(platforms)) {
    if (data.mention > 0) {
      mentioned.push(platformNames[platform] || platform);
    } else {
      notMentioned.push(platformNames[platform] || platform);
    }
    if (data.overall > bestScore) {
      bestScore = data.overall;
      bestPlatform = platformNames[platform] || platform;
    }
  }
  if (mentioned.length === 0) {
    return `${brandName} was not mentioned in any AI response. This represents an opportunity to improve brand visibility through content optimization.`;
  }
  if (mentioned.length === 4) {
    return `${brandName} was mentioned across all platforms. ${bestPlatform} provided the strongest positioning with a score of ${bestScore.toFixed(0)}.`;
  }
  return `${brandName} was mentioned by ${mentioned.join(', ')} but not by ${notMentioned.join(', ')}. Focus optimization efforts on underperforming platforms.`;
};

/**
 * Fetch raw question records from Airtable for a run_id.
 * @param {string} runId
 * @param {{ baseId: string, rawTableId: string, token: string }} config
 */
export async function fetchRawQuestionData(runId, config) {
  const { baseId, rawTableId, token } = config;
  if (!baseId || !rawTableId || !token) return [];
  try {
    let allRecords = [];
    let offset = null;
    do {
      let url = `https://api.airtable.com/v0/${baseId}/${rawTableId}?filterByFormula={run_id}="${runId}"&sort%5B0%5D%5Bfield%5D=question_number&sort%5B0%5D%5Bdirection%5D=asc`;
      if (offset) url += `&offset=${offset}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.records) allRecords = allRecords.concat(json.records);
      offset = json.offset;
    } while (offset);
    return allRecords;
  } catch (e) {
    console.error('Error fetching raw question data:', e);
    return [];
  }
}

/**
 * Build question breakdown from raw Airtable records.
 */
export function buildQuestionBreakdown(rawRecords, brandName) {
  return rawRecords.map((record) => {
    const f = record.fields;
    const platforms = {
      chatgpt: {
        response_summary: (f.chatgpt_response || '').substring(0, 200) + ((f.chatgpt_response || '').length > 200 ? '...' : ''),
        full_response: f.chatgpt_response || '',
        mention: parseFloat(f.chatgpt_mention) || 0,
        position: parseFloat(f.chatgpt_position) || 0,
        sentiment: parseFloat(f.chatgpt_sentiment) || 0,
        recommendation: parseFloat(f.chatgpt_recommendation) || 0,
        overall: parseFloat(f.chatgpt_overall) || 0,
        competitors_mentioned: extractBrands(Array.isArray(f.chatgpt_competitors_mentioned) ? f.chatgpt_competitors_mentioned.join(', ') : (f.chatgpt_competitors_mentioned || '')),
        notes: f.chatgpt_notes || ''
      },
      claude: {
        response_summary: (f.claude_response || '').substring(0, 200) + ((f.claude_response || '').length > 200 ? '...' : ''),
        full_response: f.claude_response || '',
        mention: parseFloat(f.claude_mention) || 0,
        position: parseFloat(f.claude_position) || 0,
        sentiment: parseFloat(f.claude_sentiment) || 0,
        recommendation: parseFloat(f.claude_recommendation) || 0,
        overall: parseFloat(f.claude_overall) || 0,
        competitors_mentioned: extractBrands(Array.isArray(f.claude_competitors_mentioned) ? f.claude_competitors_mentioned.join(', ') : (f.claude_competitors_mentioned || '')),
        notes: f.claude_notes || ''
      },
      gemini: {
        response_summary: (f.gemini_response || '').substring(0, 200) + ((f.gemini_response || '').length > 200 ? '...' : ''),
        full_response: f.gemini_response || '',
        mention: parseFloat(f.gemini_mention) || 0,
        position: parseFloat(f.gemini_position) || 0,
        sentiment: parseFloat(f.gemini_sentiment) || 0,
        recommendation: parseFloat(f.gemini_recommendation) || 0,
        overall: parseFloat(f.gemini_overall) || 0,
        competitors_mentioned: extractBrands(Array.isArray(f.gemini_competitors_mentioned) ? f.gemini_competitors_mentioned.join(', ') : (f.gemini_competitors_mentioned || '')),
        notes: f.gemini_notes || ''
      },
      perplexity: {
        response_summary: (f.perplexity_response || '').substring(0, 200) + ((f.perplexity_response || '').length > 200 ? '...' : ''),
        full_response: f.perplexity_response || '',
        mention: parseFloat(f.perplexity_mention) || 0,
        position: parseFloat(f.perplexity_position) || 0,
        sentiment: parseFloat(f.perplexity_sentiment) || 0,
        recommendation: parseFloat(f.perplexity_recommendation) || 0,
        overall: parseFloat(f.perplexity_overall) || 0,
        competitors_mentioned: extractBrands(Array.isArray(f.perplexity_competitors_mentioned) ? f.perplexity_competitors_mentioned.join(', ') : (f.perplexity_competitors_mentioned || '')),
        notes: f.perplexity_notes || ''
      }
    };
    const brandMentioned = platforms.chatgpt.mention > 0 || platforms.claude.mention > 0 || platforms.gemini.mention > 0 || platforms.perplexity.mention > 0;
    const scores = [
      { name: 'ChatGPT', score: platforms.chatgpt.overall },
      { name: 'Claude', score: platforms.claude.overall },
      { name: 'Gemini', score: platforms.gemini.overall },
      { name: 'Perplexity', score: platforms.perplexity.overall }
    ].sort((a, b) => b.score - a.score);
    return {
      question_number: f.question_number,
      question_text: f.question_text || '',
      category: f.question_category || 'General',
      platforms,
      brand_mentioned: brandMentioned,
      brand_mentioned_platforms: [],
      executive_summary: generateQuestionSummary(brandName, platforms),
      best_platform: scores[0].name,
      worst_platform: scores[scores.length - 1].name
    };
  });
}

export function calculateBrandRankings(rawRecords, brandName) {
  const brandMentions = {};
  for (const record of rawRecords) {
    const f = record.fields;
    const platforms = ['chatgpt', 'claude', 'gemini', 'perplexity'];
    for (const p of platforms) {
      const response = (f[`${p}_response`] || '').toLowerCase();
      const brandLower = brandName.toLowerCase();
      if (response.includes(brandLower)) {
        brandMentions[brandName] = (brandMentions[brandName] || 0) + 1;
      }
      const competitors = extractBrands(Array.isArray(f[`${p}_competitors_mentioned`]) ? f[`${p}_competitors_mentioned`].join(', ') : (f[`${p}_competitors_mentioned`] || ''));
      for (const comp of competitors) {
        if (comp.toLowerCase() !== brandLower) {
          brandMentions[comp] = (brandMentions[comp] || 0) + 1;
        }
      }
    }
  }
  const totalMentions = Object.values(brandMentions).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(brandMentions)
    .map(([brand, mentions]) => ({
      brand: capitalizeBrand(brand),
      mentions,
      share_of_voice: Math.round((mentions / totalMentions) * 1000) / 10,
      is_tracked_brand: brand.toLowerCase() === brandName.toLowerCase()
    }))
    .sort((a, b) => b.mentions - a.mentions);
}

export function calculateSentimentRankings(rawRecords, brandName) {
  const brandSentiments = {};
  for (const record of rawRecords) {
    const f = record.fields;
    const platforms = ['chatgpt', 'claude', 'gemini', 'perplexity'];
    for (const p of platforms) {
      const brandLower = brandName.toLowerCase();
      const sentiment = parseFloat(f[`${p}_sentiment`]) || 50;
      const response = (f[`${p}_response`] || '').toLowerCase();
      if (response.includes(brandLower)) {
        brandSentiments[brandName] = brandSentiments[brandName] || [];
        brandSentiments[brandName].push(sentiment);
      }
      const competitors = extractBrands(Array.isArray(f[`${p}_competitors_mentioned`]) ? f[`${p}_competitors_mentioned`].join(', ') : (f[`${p}_competitors_mentioned`] || ''));
      for (const comp of competitors) {
        if (comp.toLowerCase() !== brandLower) {
          brandSentiments[comp] = brandSentiments[comp] || [];
          brandSentiments[comp].push(sentiment);
        }
      }
    }
  }
  return Object.entries(brandSentiments)
    .map(([brand, sentiments]) => ({
      brand: capitalizeBrand(brand),
      sentiment: Math.round(sentiments.reduce((a, b) => a + b, 0) / sentiments.length),
      is_tracked_brand: brand.toLowerCase() === brandName.toLowerCase()
    }))
    .sort((a, b) => b.sentiment - a.sentiment)
    .slice(0, 5);
}

export function calculatePlatformConsistency(rawRecords) {
  const platformMentions = { chatgpt: 0, claude: 0, gemini: 0, perplexity: 0 };
  const totalQuestions = rawRecords.length || 1;
  for (const record of rawRecords) {
    const f = record.fields;
    if (parseFloat(f.chatgpt_mention) > 0) platformMentions.chatgpt++;
    if (parseFloat(f.claude_mention) > 0) platformMentions.claude++;
    if (parseFloat(f.gemini_mention) > 0) platformMentions.gemini++;
    if (parseFloat(f.perplexity_mention) > 0) platformMentions.perplexity++;
  }
  const rates = {
    chatgpt: Math.round((platformMentions.chatgpt / totalQuestions) * 1000) / 10,
    claude: Math.round((platformMentions.claude / totalQuestions) * 1000) / 10,
    gemini: Math.round((platformMentions.gemini / totalQuestions) * 1000) / 10,
    perplexity: Math.round((platformMentions.perplexity / totalQuestions) * 1000) / 10
  };
  const rateValues = Object.values(rates);
  const variance = Math.max(...rateValues) - Math.min(...rateValues);
  const sorted = Object.entries(rates).sort((a, b) => b[1] - a[1]);
  return { rates, variance: Math.round(variance * 10) / 10, strongest: sorted[0][0], weakest: sorted[sorted.length - 1][0], is_consistent: variance < 30 };
}

export function calculatePlatformDeepDives(rawRecords, brandName) {
  const platforms = ['chatgpt', 'claude', 'gemini', 'perplexity'];
  const deepDives = {};
  for (const p of platforms) {
    let totalMention = 0, totalSentiment = 0, totalRecommendation = 0, totalOverall = 0;
    const allCompetitors = [];
    let count = 0;
    for (const record of rawRecords) {
      const f = record.fields;
      totalMention += parseFloat(f[`${p}_mention`]) || 0;
      totalSentiment += parseFloat(f[`${p}_sentiment`]) || 0;
      totalRecommendation += parseFloat(f[`${p}_recommendation`]) || 0;
      totalOverall += parseFloat(f[`${p}_overall`]) || 0;
      count++;
      const comps = extractBrands(Array.isArray(f[`${p}_competitors_mentioned`]) ? f[`${p}_competitors_mentioned`].join(', ') : (f[`${p}_competitors_mentioned`] || ''));
      allCompetitors.push(...comps);
    }
    const avgMention = count > 0 ? Math.round((totalMention / count) * 10) / 10 : 0;
    const avgSentiment = count > 0 ? Math.round((totalSentiment / count) * 10) / 10 : 0;
    const avgRecommendation = count > 0 ? Math.round((totalRecommendation / count) * 10) / 10 : 0;
    const avgOverall = count > 0 ? Math.round((totalOverall / count) * 10) / 10 : 0;
    const compCounts = {};
    for (const c of allCompetitors) { compCounts[c] = (compCounts[c] || 0) + 1; }
    const topComps = Object.entries(compCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count }));
    let execSummary = `${brandName} `;
    if (avgMention >= 50) execSummary += `has strong visibility on ${platformNames[p]} (${avgMention}% mention rate).`;
    else if (avgMention > 0) execSummary += `has limited visibility on ${platformNames[p]} (${avgMention}% mention rate).`;
    else execSummary += `is not appearing in ${platformNames[p]} responses.`;
    if (avgRecommendation >= 50) execSummary += ` Actively recommended (${avgRecommendation}%).`;
    else if (avgRecommendation > 0) execSummary += ` Low recommendation rate (${avgRecommendation}%).`;
    else execSummary += ` Not being recommended.`;
    deepDives[p] = {
      executive_summary: execSummary,
      mention_rate: avgMention,
      sentiment: avgSentiment || 50,
      recommendation_rate: avgRecommendation,
      overall_score: avgOverall,
      top_competitors_mentioned: topComps,
      perception: avgSentiment >= 70 ? 'positive' : avgSentiment >= 50 ? 'neutral' : 'negative',
      recommends_brand: avgRecommendation >= 50,
      trend: avgOverall >= 85 ? 'up' : avgOverall < 70 ? 'down' : 'flat'
    };
  }
  return deepDives;
}

const parse = (str, fallback = []) => {
  try { return typeof str === 'string' ? JSON.parse(str) : (str || fallback); } catch { return fallback; }
};

/**
 * Parse Airtable dashboard record fields into report display object.
 * If question_breakdown or platform data is missing, fetches raw question data and builds it.
 * @param {object} fields - Airtable record.fields
 * @param {{ baseId, dashboardTableId, rawTableId, token }} config
 */
export async function parseReportData(fields, config) {
  let questionBreakdown = parse(fields.question_breakdown_json, []);
  let brandRankings = parse(fields.brand_rankings_json, []);
  let sentimentRankings = parse(fields.sentiment_rankings_json, []);
  let platformConsistency = parse(fields.platform_consistency_json, {});
  let platformDeepDives = parse(fields.platform_deep_dives_json, {});

  if (fields.run_id && (questionBreakdown.length === 0 || !questionBreakdown[0]?.platforms?.chatgpt?.full_response)) {
    const rawRecords = await fetchRawQuestionData(fields.run_id, config);
    if (rawRecords.length > 0) {
      questionBreakdown = buildQuestionBreakdown(rawRecords, fields.brand_name);
      if (brandRankings.length === 0) brandRankings = calculateBrandRankings(rawRecords, fields.brand_name);
      if (sentimentRankings.length === 0) sentimentRankings = calculateSentimentRankings(rawRecords, fields.brand_name);
      if (!platformConsistency.rates) platformConsistency = calculatePlatformConsistency(rawRecords);
      if (!platformDeepDives.chatgpt) platformDeepDives = calculatePlatformDeepDives(rawRecords, fields.brand_name);
    }
  }

  return {
    brand_name: fields.brand_name,
    brand_logo: fields.brand_logo || '',
    brand_assets: parse(fields.brand_assets_json, {}),
    run_id: fields.run_id,
    report_date: fields.report_date || new Date().toLocaleDateString(),
    visibility_score: parseFloat(fields.visibility_score) || 0,
    executive_summary: parse(fields.executive_summary_json, {}),
    brand_rankings: brandRankings,
    brand_rank: parseInt(fields.brand_rank) || null,
    brand_sov: parseFloat(fields.brand_sov) || 0,
    sentiment_rankings: sentimentRankings,
    platform_consistency: platformConsistency,
    platform_deep_dives: platformDeepDives,
    platforms: parse(fields.platforms_json, {}),
    brand_keywords: parse(fields.brand_keywords_json, []),
    accuracy_flags: parse(fields.accuracy_flags_json, []),
    source_attribution: parse(fields.source_attribution_json, []),
    question_breakdown: questionBreakdown,
    brand_coverage: parseFloat(fields.brand_coverage) || 0,
    recommendations: parse(fields.recommendations_json, []),
    top_sources: parse(fields.top_sources_json, {})
  };
}

/**
 * Fetch dashboard record by session_id and return parsed report data (with session_id), or null.
 * @param {string} sessionId
 * @param {{ baseId, dashboardTableId, rawTableId, token }} config
 */
export async function loadReportBySessionId(sessionId, config) {
  const { baseId, dashboardTableId, token } = config;
  if (!baseId || !dashboardTableId || !token) return null;
  try {
    const url = `https://api.airtable.com/v0/${baseId}/${dashboardTableId}?filterByFormula={session_id}="${sessionId}"`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.records && json.records.length > 0) {
      const record = json.records[0];
      const data = await parseReportData(record.fields, config);
      return { ...data, session_id: sessionId };
    }
  } catch (e) {
    console.error('Error loading report by session:', e);
  }
  return null;
}
