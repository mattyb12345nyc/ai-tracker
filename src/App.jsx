import React, { useState, useEffect, useRef } from 'react';
import { Zap, Loader2, CheckCircle, ArrowRight, RefreshCw, TrendingUp, TrendingDown, AlertCircle, X, Pencil, Check, Plus, ChevronRight, Eye, FileText, BarChart3, Download, Calendar, ChevronDown, Sparkles, Target, Activity, ArrowUpRight, ArrowDownRight, Minus, Mail, ExternalLink, Award, Users, MessageSquare, Search, Lightbulb, Globe, Link } from 'lucide-react';

// ============================================================
// CONFIGURATION
// ============================================================
const PROCESS_ANALYSIS_URL = '/.netlify/functions/process-analysis-background';
const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN || '';
const AIRTABLE_BASE_ID = 'appgSZR92pGCMlUOc';
const AIRTABLE_DASHBOARD_TABLE_ID = 'tblheMjYJzu1f88Ft';
const AIRTABLE_RAW_TABLE_ID = 'tblusxWUrocGCwUHb';
// ============================================================

const STORAGE_KEY = 'ai-tracker-customer-v10';

const platformLogos = {
  chatgpt: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/f7aa1278-3451-4421-8d3b-2de8511dd5ca/1500x469.png',
  claude: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/05a8de1c-981d-45ad-bc39-9cdeb919a36d/1900x594.png',
  gemini: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/1b084fb7-37b9-4763-a356-7e51ea261505/800x250.png',
  perplexity: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/34211da5-8bf5-41bd-821a-62ee0bb0e811/1700x531.png'
};

const platformNames = { chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini', perplexity: 'Perplexity' };
const FUTUREPROOF_LOGO = 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/d19d829c-a9a9-4fad-b0e7-7938012be26c/800x200.png';

// Creative loading messages for brand analysis
const LOADING_MESSAGES = [
  'Revving up the analysis engine...',
  'Initiating Answer Engine Optimization...',
  'Scanning the AI landscape...',
  'Decoding brand visibility signals...',
  'Interrogating the AI assistants...',
  'Crunching the visibility numbers...',
  'Mapping your brand footprint...',
  'Analyzing AI recommendation patterns...',
  'Calibrating sentiment sensors...',
  'Extracting competitive insights...',
  'Processing brand intelligence...',
  'Surveying the AI ecosystem...'
];

// Format LLM response: remove asterisks and clean up text
const formatLLMResponse = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/\*/g, '')   // Remove remaining asterisks
    .replace(/#{1,6}\s/g, '') // Remove markdown headers
    .trim();
};

// Component to render formatted response with basic structure
const FormattedResponse = ({ text }) => {
  if (!text) return <span className="fp-text-muted">No response</span>;

  const cleanText = formatLLMResponse(text);
  const lines = cleanText.split('\n').filter(line => line.trim());

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        // Check if it's a numbered list item
        if (/^\d+[\.\)]\s/.test(trimmed)) {
          return <p key={i} className="pl-4 text-white/80">{trimmed}</p>;
        }
        // Check if it's a bullet point
        if (/^[-•]\s/.test(trimmed)) {
          return <p key={i} className="pl-4 text-white/80">{trimmed.replace(/^[-•]\s/, '• ')}</p>;
        }
        // Regular paragraph
        return <p key={i} className="text-white/80">{trimmed}</p>;
      })}
    </div>
  );
};

const gradeColors = {
  'A': { text: 'text-[#ff8a80]', bg: 'bg-[#ff8a80]/20', border: 'border-[#ff8a80]/30' },
  'B': { text: 'text-[#ff6b4a]', bg: 'bg-[#ff6b4a]/20', border: 'border-[#ff6b4a]/30' },
  'C': { text: 'text-[#f97316]', bg: 'bg-[#f97316]/20', border: 'border-[#f97316]/30' },
  'D': { text: 'text-[#a855f7]', bg: 'bg-[#a855f7]/20', border: 'border-[#a855f7]/30' },
  'F': { text: 'text-[#d4a5a5]', bg: 'bg-[#d4a5a5]/20', border: 'border-[#d4a5a5]/30' }
};

const PROGRESS_STAGES = [
  { id: 1, label: 'Querying ChatGPT', icon: 'chatgpt', duration: 35 },
  { id: 2, label: 'Querying Claude', icon: 'claude', duration: 35 },
  { id: 3, label: 'Querying Gemini', icon: 'gemini', duration: 35 },
  { id: 4, label: 'Querying Perplexity', icon: 'perplexity', duration: 35 },
  { id: 5, label: 'Extracting brand mentions & rankings', icon: null, duration: 30 },
  { id: 6, label: 'Analyzing sentiment across platforms', icon: null, duration: 30 },
  { id: 7, label: 'Calculating share of voice', icon: null, duration: 25 },
  { id: 8, label: 'Identifying brand keywords', icon: null, duration: 25 },
  { id: 9, label: 'Generating executive insights', icon: null, duration: 30 },
  { id: 10, label: 'Building your report', icon: null, duration: 20 }
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

const capitalizeBrand = (name) => {
  if (!name || typeof name !== 'string') return '';
  const known = {
    'suzy': 'Suzy', 'qualtrics': 'Qualtrics', 'surveymonkey': 'SurveyMonkey',
    'typeform': 'Typeform', 'medallia': 'Medallia', 'zappi': 'Zappi',
    'toluna': 'Toluna', 'quantilope': 'Quantilope', 'forsta': 'Forsta',
    'chatgpt': 'ChatGPT', 'openai': 'OpenAI', 'xbox': 'Xbox',
    'playstation': 'PlayStation', 'nintendo': 'Nintendo', 'alchemer': 'Alchemer'
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

const extractBrands = (competitorsStr) => {
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
  } else if (mentioned.length === 4) {
    return `${brandName} was mentioned across all platforms. ${bestPlatform} provided the strongest positioning with a score of ${bestScore.toFixed(0)}.`;
  } else {
    return `${brandName} was mentioned by ${mentioned.join(', ')} but not by ${notMentioned.join(', ')}. Focus optimization efforts on underperforming platforms.`;
  }
};

const generateRunId = () => {
  const now = new Date();
  const date = now.toISOString().slice(0,10).replace(/-/g,'');
  const time = now.toTimeString().slice(0,8).replace(/:/g,'');
  const rand = Math.random().toString(36).substring(2,6).toUpperCase();
  return `RUN_${date}_${time}_${rand}`;
};

// ============================================================
// MAIN APP COMPONENT
// ============================================================
export default function App() {
  const [step, setStep] = useState('setup'); // setup, analyzing, questions, processing, complete
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [brandData, setBrandData] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [currentStage, setCurrentStage] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [expandedResponses, setExpandedResponses] = useState({});
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [viewedPlatforms, setViewedPlatforms] = useState(new Set());
  const pollingRef = useRef(null);

  // Sign-up page URL for gated features
  const SIGNUP_URL = 'https://futureproof.work/ai-optimizer-sign-up';

  const handlePlatformDiveDeeper = (platform) => {
    // If already viewed this platform, allow re-viewing
    if (viewedPlatforms.has(platform)) {
      setSelectedPlatform(platform);
      return;
    }

    // If this is the first platform view, allow it
    if (viewedPlatforms.size === 0) {
      setViewedPlatforms(new Set([platform]));
      setSelectedPlatform(platform);
      return;
    }

    // Already viewed one platform, redirect to sign-up
    window.location.href = SIGNUP_URL;
  };

  const isPlatformLocked = (platform) => {
    // Not locked if: no platforms viewed yet, or this platform was already viewed
    if (viewedPlatforms.size === 0 || viewedPlatforms.has(platform)) {
      return false;
    }
    // Locked if: one platform viewed and this is a different one
    return true;
  };

  const toggleResponseExpand = (questionIndex, platform) => {
    const key = `${questionIndex}-${platform}`;
    setExpandedResponses(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ============================================================
  // URL ANALYSIS
  // ============================================================

  const normalizeUrl = (input) => {
    let normalized = input.trim().toLowerCase();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    return normalized;
  };

  const analyzeUrl = async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setError('');

    const normalizedUrl = normalizeUrl(url);

    try {
      const response = await fetch('/.netlify/functions/analyze-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl })
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setBrandData(data.brandData);
      await generateQuestions(data.brandData);
      setStep('questions');
    } catch (err) {
      setError('Failed to analyze URL. Please try again.');
      console.error(err);
    }
    setIsAnalyzing(false);
  };

  const generateQuestions = async (brand) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/.netlify/functions/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandData: brand, questionCount: 15 })
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setGeneratedQuestions(data.questions.map((q, i) => ({
        id: i + 1,
        text: q.text,
        category: q.category,
        included: true
      })));
    } catch (err) {
      console.error('Question generation error:', err);
      // Fallback questions
      setGeneratedQuestions([
        { id: 1, text: `What are the best ${brandData?.category || 'solutions'} for enterprises?`, category: 'Consideration', included: true },
        { id: 2, text: `Top ${brandData?.category || 'tools'} recommended by experts?`, category: 'Consideration', included: true },
        { id: 3, text: `Which ${brandData?.category || 'platforms'} should I use for ${brandData?.use_cases?.[0] || 'my needs'}?`, category: 'Decision', included: true },
      ]);
    }
    setIsGenerating(false);
  };

  // ============================================================
  // AIRTABLE DATA FETCHING
  // ============================================================

  const fetchRawQuestionData = async (runId) => {
    try {
      console.log('fetchRawQuestionData called with runId:', runId);
      let allRecords = [];
      let offset = null;
      do {
        let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_RAW_TABLE_ID}?filterByFormula={run_id}="${runId}"&sort%5B0%5D%5Bfield%5D=question_number&sort%5B0%5D%5Bdirection%5D=asc`;
        if (offset) url += `&offset=${offset}`;
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } });
        const json = await res.json();
        console.log('Raw data API response:', json.records?.length, 'records');
        if (json.records && json.records.length > 0) {
          console.log('First record chatgpt_response length:', json.records[0].fields?.chatgpt_response?.length);
        }
        if (json.records) allRecords = allRecords.concat(json.records);
        offset = json.offset;
      } while (offset);
      return allRecords;
    } catch (e) { console.error('Error fetching raw question data:', e); return []; }
  };

  const buildQuestionBreakdown = (rawRecords, brandName) => {
    console.log('buildQuestionBreakdown called with', rawRecords.length, 'records');
    return rawRecords.map((record, idx) => {
      const f = record.fields;
      if (idx === 0) {
        console.log('First record full response lengths:', {
          chatgpt: f.chatgpt_response?.length,
          claude: f.claude_response?.length,
          gemini: f.gemini_response?.length,
          perplexity: f.perplexity_response?.length
        });
      }
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
      const brandMentionedPlatforms = [];
      if (platforms.chatgpt.mention > 0) brandMentionedPlatforms.push('ChatGPT');
      if (platforms.claude.mention > 0) brandMentionedPlatforms.push('Claude');
      if (platforms.gemini.mention > 0) brandMentionedPlatforms.push('Gemini');
      if (platforms.perplexity.mention > 0) brandMentionedPlatforms.push('Perplexity');
      
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
        brand_mentioned_platforms: brandMentionedPlatforms,
        executive_summary: generateQuestionSummary(brandName, platforms),
        best_platform: scores[0].name,
        worst_platform: scores[scores.length - 1].name
      };
    });
  };

  const calculateBrandRankings = (rawRecords, brandName) => {
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
  };

  const calculateSentimentRankings = (rawRecords, brandName) => {
    const brandSentiments = {};
    for (const record of rawRecords) {
      const f = record.fields;
      const platforms = ['chatgpt', 'claude', 'gemini', 'perplexity'];
      for (const p of platforms) {
        const response = (f[`${p}_response`] || '').toLowerCase();
        const brandLower = brandName.toLowerCase();
        const sentiment = parseFloat(f[`${p}_sentiment`]) || 50;
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
  };

  const calculatePlatformConsistency = (rawRecords) => {
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
  };

  const calculatePlatformDeepDives = (rawRecords, brandName) => {
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
  };

  const parseReportData = async (fields) => {
    const parse = (str, fallback = []) => { try { return typeof str === 'string' ? JSON.parse(str) : (str || fallback); } catch { return fallback; } };
    
    let questionBreakdown = parse(fields.question_breakdown_json, []);
    let brandRankings = parse(fields.brand_rankings_json, []);
    let sentimentRankings = parse(fields.sentiment_rankings_json, []);
    let platformConsistency = parse(fields.platform_consistency_json, {});
    let platformDeepDives = parse(fields.platform_deep_dives_json, {});
    
    if (fields.run_id && (questionBreakdown.length === 0 || !questionBreakdown[0]?.platforms?.chatgpt?.full_response)) {
      console.log('Fetching raw question data for run_id:', fields.run_id);
      const rawRecords = await fetchRawQuestionData(fields.run_id);
      console.log('Raw records found:', rawRecords.length);
      if (rawRecords.length > 0) {
        questionBreakdown = buildQuestionBreakdown(rawRecords, fields.brand_name);
        console.log('Built question breakdown:', questionBreakdown.length, 'questions');
        if (brandRankings.length === 0) brandRankings = calculateBrandRankings(rawRecords, fields.brand_name);
        if (sentimentRankings.length === 0) sentimentRankings = calculateSentimentRankings(rawRecords, fields.brand_name);
        if (!platformConsistency.rates) platformConsistency = calculatePlatformConsistency(rawRecords);
        if (!platformDeepDives.chatgpt) platformDeepDives = calculatePlatformDeepDives(rawRecords, fields.brand_name);
      }
    }

    return {
      brand_name: fields.brand_name,
      run_id: fields.run_id,
      report_date: fields.report_date || new Date().toLocaleDateString(),
      visibility_score: parseFloat(fields.visibility_score) || 0,
      grade: fields.grade || 'C',
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
      recommendations: parse(fields.recommendations_json, [])
    };
  };

  const loadReportBySessionId = async (targetSessionId) => {
    try {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DASHBOARD_TABLE_ID}?filterByFormula={session_id}="${targetSessionId}"`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } });
      const json = await res.json();
      if (json.records && json.records.length > 0) {
        const record = json.records[0];
        const data = await parseReportData(record.fields);
        setDashboardData(data);
        setStep('complete');
      }
    } catch (e) { console.error('Error loading report by session:', e); }
  };

  // Check for report parameter in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportSessionId = params.get('report');
    if (reportSessionId) {
      loadReportBySessionId(reportSessionId);
    }
  }, []);

  // Rotate loading messages while analyzing
  useEffect(() => {
    if (!isAnalyzing) {
      setLoadingMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const pollForResults = async (targetSessionId) => {
    try {
      console.log('Polling for session:', targetSessionId);
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DASHBOARD_TABLE_ID}?filterByFormula={session_id}="${targetSessionId}"`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } });
      const json = await res.json();
      console.log('Poll response:', json);
      if (json.records && json.records.length > 0) {
        console.log('Found record, parsing...');
        const r = json.records[0].fields;
        const data = await parseReportData(r);
        console.log('Parsed data:', data);
        setDashboardData(data);
        clearInterval(pollingRef.current);
        setStep('ready');
        console.log('Step set to ready');
        return true;
      }
      console.log('No records found yet');
      return false;
    } catch (e) { console.error('Polling error:', e); return false; }
  };

  useEffect(() => {
    if (step !== 'processing') return;
    const totalDuration = PROGRESS_STAGES.reduce((sum, s) => sum + s.duration, 0);
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 0.5;
      let cumulative = 0;
      for (let i = 0; i < PROGRESS_STAGES.length; i++) {
        cumulative += PROGRESS_STAGES[i].duration;
        if (elapsed < cumulative) {
          setCurrentStage(i);
          const stageStart = cumulative - PROGRESS_STAGES[i].duration;
          const stageElapsed = elapsed - stageStart;
          setStageProgress(Math.min(100, (stageElapsed / PROGRESS_STAGES[i].duration) * 100));
          break;
        }
      }
      if (elapsed >= totalDuration) { setCurrentStage(PROGRESS_STAGES.length - 1); setStageProgress(100); }
    }, 500);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step === 'processing' && sessionId) {
      // Start polling after 10 seconds, then every 15 seconds
      setTimeout(() => { pollForResults(sessionId); }, 10000);
      pollingRef.current = setInterval(() => { pollForResults(sessionId); }, 15000);
      return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }
  }, [step, sessionId]);

  const handleSubmit = async () => {
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    const sid = `SES_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const runId = generateRunId();
    setSessionId(sid);
    setCurrentStage(0);
    setStageProgress(0);
    setStep('processing');
    
    const activeQuestions = generatedQuestions.filter(q => q.included);
    
    try {
      console.log('Submitting analysis request...', { sid, runId, brandName: brandData.brand_name });
      const response = await fetch(PROCESS_ANALYSIS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sid,
          run_id: runId,
          brand_name: brandData.brand_name,
          brand_url: normalizeUrl(url),
          email: email,
          industry: brandData.industry,
          category: brandData.category,
          key_messages: brandData.key_benefits,
          competitors: brandData.competitors,
          questions: activeQuestions.map(q => ({ text: q.text, category: q.category })),
          question_count: activeQuestions.length,
          timestamp: new Date().toISOString()
        })
      });
      console.log('Analysis response:', response.status, await response.text());
    } catch (error) { console.error('Submit error:', error); }
  };

  const handleEdit = (q) => { setEditingId(q.id); setEditText(q.text); };
  const handleSaveEdit = (id) => { setGeneratedQuestions(qs => qs.map(q => q.id === id ? { ...q, text: editText } : q)); setEditingId(null); setEditText(''); };
  const handleToggle = (id) => { setGeneratedQuestions(qs => qs.map(q => q.id === id ? { ...q, included: !q.included } : q)); };
  const handleAdd = () => {
    const newId = Math.max(...generatedQuestions.map(q => q.id), 0) + 1;
    setGeneratedQuestions([...generatedQuestions, { id: newId, text: 'New question', category: 'Consideration', included: true }]);
    setEditingId(newId);
    setEditText('New question');
  };

  // ============================================================
  // RENDER - SETUP STEP (URL INPUT)
  // ============================================================
  if (step === 'setup') {
    return (
      <div className="min-h-screen text-white fp-shell">
        <header className="fp-header sticky top-0 backdrop-blur-xl z-50">
          <div className="max-w-6xl mx-auto px-8 py-4 flex items-center gap-4">
            <img src={FUTUREPROOF_LOGO} alt="FutureProof" className="h-8" />
            <span className="text-white/20">|</span>
            <span className="font-semibold">AI Visibility Tracker</span>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-8 py-16 animate-fadeIn">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full fp-chip text-sm mb-6">
              <Sparkles className="w-4 h-4" /> AI-Powered Brand Intelligence
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Discover Your AI Visibility
            </h1>
            <p className="fp-text-muted text-lg">
              See how ChatGPT, Claude, Gemini, and Perplexity recommend your brand
            </p>
          </div>

          <div className="fp-card rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl fp-icon-gradient flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold">Enter Your Brand URL</h2>
                <p className="text-sm fp-text-muted">We'll analyze your brand and generate relevant questions</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 fp-text-subtle" />
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl fp-input outline-none transition-all text-lg"
                  placeholder="yourbrand.com"
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl fp-error text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <button
                onClick={analyzeUrl}
                disabled={!url.trim() || isAnalyzing}
                className="w-full py-4 rounded-xl fp-button-primary disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-3 transition-all"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {LOADING_MESSAGES[loadingMessageIndex]}
                  </>
                ) : (
                  <>
                    Analyze & Generate Questions
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t fp-divider">
              <p className="text-xs fp-text-subtle text-center">
                We'll extract your brand info, generate recommendation-focused questions,
                and test how AI assistants respond to purchase intent queries.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-4 gap-4">
            {Object.entries(platformLogos).map(([key, logo]) => (
              <div key={key} className="fp-card rounded-xl p-4 flex items-center justify-center">
                <img src={logo} alt={platformNames[key]} className="h-8 object-contain opacity-50" />
              </div>
            ))}
          </div>
        </main>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.6s ease-out; }`}</style>
      </div>
    );
  }

  // ============================================================
  // RENDER - QUESTIONS REVIEW STEP
  // ============================================================
  if (step === 'questions') {
    return (
      <div className="min-h-screen text-white fp-shell">
        <header className="fp-header sticky top-0 backdrop-blur-xl z-50">
          <div className="max-w-6xl mx-auto px-8 py-4 flex items-center gap-4">
            <img src={FUTUREPROOF_LOGO} alt="FutureProof" className="h-8" />
            <span className="text-white/20">|</span>
            <span className="font-semibold">AI Visibility Tracker</span>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-8 py-12 animate-fadeIn">
          
          {/* Brand Summary Card */}
          {brandData && (
            <div className="fp-card-strong rounded-2xl p-6 mb-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1">{brandData.brand_name}</h2>
                  <p className="fp-text-muted text-sm">{brandData.category} • {brandData.industry}</p>
                </div>
                <button onClick={() => { setStep('setup'); setBrandData(null); setGeneratedQuestions([]); }} className="fp-text-muted hover:text-white text-sm">
                  ← Change URL
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                <div>
                  <span className="fp-text-muted">Price Tier:</span>
                  <span className="ml-2 text-white/80">{brandData.price_tier}</span>
                </div>
                <div>
                  <span className="fp-text-muted">Audience:</span>
                  <span className="ml-2 text-white/80">{brandData.target_audience?.slice(0, 2).join(', ')}</span>
                </div>
                <div>
                  <span className="fp-text-muted">Competitors:</span>
                  <span className="ml-2 text-white/80">{brandData.competitors?.slice(0, 3).join(', ')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="fp-card rounded-2xl p-6 mb-6">
            <label className="block text-sm font-medium text-white/80 mb-2">Email for Report Delivery *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl fp-input outline-none transition-all"
              placeholder="you@company.com"
            />
          </div>

          {/* Questions Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Review Questions</h2>
              <p className="fp-text-muted">
                {generatedQuestions.filter(q => q.included).length} of {generatedQuestions.length} questions selected
              </p>
            </div>
            {isGenerating && (
              <div className="flex items-center gap-2" style={{ color: 'var(--fp-accent-3)' }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </div>
            )}
          </div>

          {/* Questions List */}
          <div className="space-y-3 mb-8">
            {generatedQuestions.map(q => (
              <div key={q.id} className={`p-4 rounded-xl transition-all ${q.included ? 'fp-question-card-active' : 'fp-question-card opacity-50'}`}>
                <div className="flex items-start gap-4">
                  <button onClick={() => handleToggle(q.id)} className="mt-1">
                    {q.included ? (
                      <div className="w-5 h-5 rounded fp-checkbox flex items-center justify-center"><Check className="w-3 h-3" /></div>
                    ) : (
                      <div className="w-5 h-5 rounded border border-white/20" />
                    )}
                  </button>
                  <div className="flex-1">
                    {editingId === q.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg fp-input outline-none"
                          autoFocus
                        />
                        <button onClick={() => handleSaveEdit(q.id)} className="p-2 rounded-lg fp-badge hover:opacity-80"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-white/[0.06] fp-text-muted hover:text-white"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white/90">{q.text}</p>
                          <span className="text-xs fp-text-muted mt-1 inline-block">{q.category}</span>
                        </div>
                        <button onClick={() => handleEdit(q)} className="p-2 rounded-lg hover:bg-white/[0.06] fp-text-muted hover:text-white"><Pencil className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
              <button onClick={handleAdd} className="flex-1 py-3 rounded-xl fp-button-ghost hover:border-white/40 fp-text-muted hover:text-white flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Question
              </button>
            <button
              onClick={handleSubmit}
              disabled={generatedQuestions.filter(q => q.included).length === 0 || !email.includes('@')}
                className="flex-1 py-3 rounded-xl fp-button-primary disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
            >
              Run Analysis <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-xl fp-error text-sm">
              {error}
            </div>
          )}
        </main>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.6s ease-out; }`}</style>
      </div>
    );
  }

  // ============================================================
  // RENDER - PROCESSING STEP
  // ============================================================
  if (step === 'processing') {
    return (
      <div className="min-h-screen text-white fp-shell">
        <header className="fp-header sticky top-0 backdrop-blur-xl z-50">
          <div className="max-w-6xl mx-auto px-8 py-4 flex items-center gap-4">
            <img src={FUTUREPROOF_LOGO} alt="FutureProof" className="h-8" />
            <span className="text-white/20">|</span>
            <span className="font-semibold">AI Visibility Tracker</span>
          </div>
        </header>
        <main className="max-w-xl mx-auto px-8 py-12 text-center animate-fadeIn">
          <div className="mb-8">
            {/* Creative animated loader in FutureProof colors */}
            <div className="relative w-28 h-28 mx-auto mb-6">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full animate-fp-pulse" style={{ background: 'linear-gradient(135deg, rgba(255, 122, 61, 0.3), rgba(139, 92, 246, 0.3))' }} />
              {/* Middle spinning ring */}
              <div className="absolute inset-2 rounded-full animate-fp-spin" style={{ background: 'conic-gradient(from 0deg, var(--fp-accent-1), var(--fp-accent-3), var(--fp-accent-1))', mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))', WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))' }} />
              {/* Inner gradient circle */}
              <div className="absolute inset-5 rounded-full" style={{ background: 'var(--fp-bg-1)' }} />
              <div className="absolute inset-5 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 rounded-full animate-fp-glow fp-icon-gradient" style={{ boxShadow: '0 0 20px rgba(255, 122, 61, 0.5)' }} />
              </div>
              {/* Orbiting dots */}
              <div className="absolute inset-0 animate-fp-orbit">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ background: 'var(--fp-accent-1)', boxShadow: '0 0 10px rgba(255, 122, 61, 0.8)' }} />
              </div>
              <div className="absolute inset-0 animate-fp-orbit-reverse">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ background: 'var(--fp-accent-3)', boxShadow: '0 0 10px rgba(139, 92, 246, 0.8)' }} />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Analyzing AI Visibility</h2>
            <p className="fp-text-muted">This takes about 5 minutes. You'll receive an email when ready.</p>
            <p className="fp-text-subtle text-sm mt-2">Feel free to close this page.</p>
          </div>
          <div className="space-y-4">
            {PROGRESS_STAGES.map((stage, i) => (
              <div key={stage.id} className={`p-4 rounded-xl transition-all ${i < currentStage ? 'fp-stage-complete' : i === currentStage ? 'fp-stage-active' : 'fp-card'}`}>
                <div className="flex items-center gap-4">
                  {stage.icon ? (<img src={platformLogos[stage.icon]} alt={stage.icon} className="w-8 h-8 object-contain" />) : (<div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i < currentStage ? 'fp-checkbox' : i === currentStage ? 'fp-checkbox' : 'bg-white/10'}`}>{i < currentStage ? <Check className="w-4 h-4" /> : <span className="text-sm">{stage.id}</span>}</div>)}
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${i <= currentStage ? 'text-white' : 'fp-text-muted'}`}>{stage.label}</p>
                    {i === currentStage && (<div className="h-1 fp-progress-bar rounded-full mt-2 overflow-hidden"><div className="h-full fp-progress-fill transition-all duration-500" style={{ width: `${stageProgress}%` }} /></div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
          @keyframes fp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-fp-spin { animation: fp-spin 1.5s linear infinite; }
          @keyframes fp-pulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 0.8; } }
          .animate-fp-pulse { animation: fp-pulse 2s ease-in-out infinite; }
          @keyframes fp-glow { 0%, 100% { transform: scale(0.9); opacity: 0.7; } 50% { transform: scale(1); opacity: 1; } }
          .animate-fp-glow { animation: fp-glow 1.5s ease-in-out infinite; }
          @keyframes fp-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-fp-orbit { animation: fp-orbit 3s linear infinite; }
          @keyframes fp-orbit-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
          .animate-fp-orbit-reverse { animation: fp-orbit-reverse 2s linear infinite; }
        `}</style>
      </div>
    );
  }

  // ============================================================
  // RENDER - READY STEP (Report Complete, Show CTA)
  // ============================================================
  if (step === 'ready') {
    const reportUrl = `https://ai.futureproof.work/?report=${sessionId}&utm_campaign=website&utm_medium=email&utm_source=sendgrid.com`;
    return (
      <div className="min-h-screen text-white fp-shell">
        <header className="fp-header sticky top-0 backdrop-blur-xl z-50">
          <div className="max-w-6xl mx-auto px-8 py-4 flex items-center gap-4">
            <img src={FUTUREPROOF_LOGO} alt="FutureProof" className="h-8" />
            <span className="text-white/20">|</span>
            <span className="font-semibold">AI Visibility Tracker</span>
          </div>
        </header>
        <main className="max-w-xl mx-auto px-8 py-24 text-center animate-fadeIn">
          <div className="mb-8">
            <div className="w-24 h-24 rounded-full fp-icon-gradient flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Your AI Optimization Report Is Ready</h2>
            <p className="fp-text-muted text-lg mb-2">We've finished analyzing your brand's AI visibility across ChatGPT, Claude, Gemini, and Perplexity.</p>
            <p className="fp-text-muted">A copy has also been sent to your email.</p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => { window.location.href = reportUrl; }}
              className="w-full py-4 px-8 rounded-2xl text-lg font-semibold text-white transition-all fp-button-primary"
            >
              View Your Report
            </button>
          </div>
        </main>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.6s ease-out; }`}</style>
      </div>
    );
  }

  // ============================================================
  // RENDER - COMPLETE/DASHBOARD STEP
  // ============================================================
  return (
    <div className="min-h-screen text-white fp-shell">
      <header className="fp-header sticky top-0 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={FUTUREPROOF_LOGO} alt="FutureProof" className="h-8" />
            <span className="text-white/20">|</span>
            <span className="font-semibold">AI Visibility Tracker</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12">
        {dashboardData && !selectedPlatform && (
          <div className="animate-fadeIn space-y-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">{dashboardData.brand_name}<span className="text-lg font-normal fp-text-muted">AI Visibility Report</span></h1>
                <p className="fp-text-muted mt-1">{dashboardData.report_date}</p>
              </div>
            </div>

            {/* SECTION 1: EXECUTIVE SUMMARY */}
            <div className="fp-card-strong rounded-3xl p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl fp-icon-gradient flex items-center justify-center shrink-0"><Sparkles className="w-6 h-6 text-white" /></div>
                <div><h2 className="text-xl font-bold">Executive Summary</h2><p className="text-sm fp-text-muted">TL;DR of the most important findings</p></div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-white/90">{dashboardData.executive_summary?.headline}</h3>
                {(dashboardData.executive_summary?.paragraphs || []).map((p, i) => (<p key={i} className="text-white/80 leading-relaxed">{p}</p>))}
                <ul className="grid grid-cols-2 gap-3 mt-6">
                  {(dashboardData.executive_summary?.bullets || []).map((bullet, i) => (<li key={i} className="flex items-start gap-2 text-sm fp-text-muted"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--fp-accent-3)' }} /><span>{bullet}</span></li>))}
                </ul>
              </div>
            </div>

            {/* SECTION 2: BRAND RANKINGS */}
            <div className="fp-card rounded-3xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl fp-icon-gradient flex items-center justify-center shrink-0"><Award className="w-6 h-6 text-white" /></div>
                <div className="flex-1"><h2 className="text-xl font-bold">Brand Rankings</h2><p className="text-sm fp-text-muted">Share of voice across all AI responses</p></div>
                {dashboardData.brand_sov !== undefined && (<div className="text-right"><div className="text-3xl font-bold" style={{ color: 'var(--fp-accent-1)' }}>{dashboardData.brand_sov}%</div><div className="text-sm fp-text-muted">Share of Voice</div></div>)}
              </div>
              {(() => {
                const rankings = dashboardData.brand_rankings || [];
                const trackedBrand = rankings.find(b => b.is_tracked_brand);
                const trackedRank = rankings.findIndex(b => b.is_tracked_brand) + 1;
                const topBrands = rankings.filter(b => !b.is_tracked_brand).slice(0, 3).map(b => b.brand);
                const leader = rankings[0];

                let summary = '';
                if (trackedBrand && trackedRank === 1) {
                  summary = `${dashboardData.brand_name} leads the category with ${trackedBrand.share_of_voice}% share of voice, appearing most frequently in AI responses. ${topBrands.length > 0 ? `Key competitors ${topBrands.slice(0, 2).join(' and ')} follow closely behind.` : ''} This dominant position indicates strong AI visibility and brand recognition.`;
                } else if (trackedBrand && trackedRank <= 3) {
                  summary = `${dashboardData.brand_name} ranks #${trackedRank} with ${trackedBrand.share_of_voice}% share of voice. ${leader ? `${leader.brand} currently leads the category at ${leader.share_of_voice}%.` : ''} With targeted content optimization, there's opportunity to capture the top position.`;
                } else if (trackedBrand && trackedRank <= 5) {
                  summary = `${dashboardData.brand_name} holds position #${trackedRank} with ${trackedBrand.share_of_voice}% share of voice. ${topBrands.length > 0 ? `${topBrands.slice(0, 2).join(', ')} dominate AI recommendations in this space.` : ''} Strategic content improvements could significantly boost visibility.`;
                } else if (trackedBrand) {
                  summary = `${dashboardData.brand_name} currently ranks #${trackedRank} with ${trackedBrand.share_of_voice}% share of voice, indicating room for significant improvement. ${topBrands.length > 0 ? `Leading brands like ${topBrands[0]} capture ${leader?.share_of_voice || 0}% of mentions.` : ''} Focused content strategy is essential to climb the rankings.`;
                } else {
                  summary = `${dashboardData.brand_name} was not mentioned in the analyzed AI responses. ${topBrands.length > 0 ? `${topBrands.slice(0, 3).join(', ')} currently dominate this category.` : ''} This presents a critical opportunity to build AI visibility through strategic content creation.`;
                }

                return summary ? (
                  <p className="text-sm fp-text-muted leading-relaxed mb-6 px-1">{summary}</p>
                ) : null;
              })()}
              <div className="space-y-3">
                {(dashboardData.brand_rankings || []).slice(0, 10).map((brand, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${brand.is_tracked_brand ? 'fp-stage-active' : 'fp-card'}`}>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${brand.is_tracked_brand ? 'fp-rank-number text-white' : 'fp-rank-number-neutral'}`}>{i + 1}</span>
                    <span className={`flex-1 font-medium ${brand.is_tracked_brand ? 'text-white' : 'text-white/80'}`} style={brand.is_tracked_brand ? { color: 'var(--fp-accent-1)' } : {}}>{brand.brand}</span>
                    <span className="fp-text-muted text-sm">{brand.mentions} mentions</span>
                    <span className={`font-semibold ${brand.is_tracked_brand ? 'text-white' : 'text-white/80'}`} style={brand.is_tracked_brand ? { color: 'var(--fp-accent-1)' } : {}}>{brand.share_of_voice}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: PLATFORM CARDS */}
            <div className="grid grid-cols-4 gap-4">
              {['chatgpt', 'claude', 'gemini', 'perplexity'].map(p => {
                const data = dashboardData.platforms?.[p] || {};
                const locked = isPlatformLocked(p);
                return (
                  <div key={p} className="relative fp-card rounded-2xl p-6 hover:border-[rgba(255,122,61,0.5)] transition-all">
                    <button
                      onClick={() => handlePlatformDiveDeeper(p)}
                      className={`absolute top-4 right-4 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${locked ? 'fp-badge-neutral cursor-pointer' : 'text-white hover:opacity-90 fp-button-primary'}`}
                    >
                      {locked && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
                      {locked ? 'Unlock' : 'Dive Deeper'}
                    </button>
                    <img src={platformLogos[p]} alt={platformNames[p]} className="h-8 object-contain mb-4" />
                    <div className="text-2xl font-bold">{data.score || 0}</div>
                    <div className="text-sm fp-text-muted">Overall Score</div>
                    <div className="mt-4 space-y-1 text-sm">
                      <div className="flex justify-between"><span className="fp-text-muted">Mention</span><span>{data.mention || 0}%</span></div>
                      <div className="flex justify-between"><span className="fp-text-muted">Sentiment</span><span>{data.sentiment || 0}%</span></div>
                      <div className="flex justify-between"><span className="fp-text-muted">Recommend</span><span>{data.recommendation || 0}%</span></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SECTION 5: CONTENT STRATEGY RECOMMENDATIONS */}
            <div className="fp-card-strong rounded-3xl p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl fp-icon-gradient flex items-center justify-center shrink-0"><Lightbulb className="w-6 h-6 text-white" /></div>
                <div><h2 className="text-xl font-bold">Content Strategy Recommendations</h2><p className="text-sm fp-text-muted">AI-powered content strategies to improve your visibility rankings</p></div>
              </div>
              <div className="space-y-4">
                {(dashboardData.recommendations || []).map((rec, i) => {
                  const priorityColors = {
                    high: { bg: 'fp-stage-active', border: 'fp-stage-active', badge: 'fp-badge-success' },
                    medium: { bg: 'fp-stage-complete', border: 'fp-stage-complete', badge: 'fp-badge' },
                    low: { bg: 'fp-card', border: 'fp-card', badge: 'fp-badge-neutral' }
                  };
                  const colors = priorityColors[rec.priority] || priorityColors.medium;
                  return (
                    <div key={i} className={`relative p-6 rounded-xl border ${colors.bg} ${colors.border}`}>
                      <div className="flex items-start gap-4">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${colors.badge}`}>{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className={`text-xs font-bold uppercase tracking-wide ${colors.badge.split(' ')[1]}`}>{rec.priority} priority</span>
                            {rec.content_type && (
                              <span className="px-2 py-0.5 rounded text-xs fp-badge-neutral">{rec.content_type}</span>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg text-white/90 mb-2">{rec.title || rec.action}</h3>
                          <p className="text-sm fp-text-muted leading-relaxed">{rec.description || rec.detail || 'Implement this strategy to improve your AI visibility.'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!dashboardData.recommendations || dashboardData.recommendations.length === 0) && (
                  <div className="text-center py-8 fp-text-muted">Content recommendations will be generated based on AI analysis</div>
                )}
              </div>
            </div>

            {/* SECTION 6: QUESTION BREAKDOWN */}
            <div className="fp-card rounded-3xl p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl fp-icon-gradient flex items-center justify-center shrink-0"><MessageSquare className="w-6 h-6 text-white" /></div>
                <div><h2 className="text-xl font-bold">Question-by-Question Analysis</h2><p className="text-sm fp-text-muted">How each AI responded to test queries</p></div>
              </div>
              <div className="space-y-6">
                {(dashboardData.question_breakdown || []).map((q, qIndex) => (
                  <div key={qIndex} className="p-6 rounded-2xl fp-card">
                    <div className="flex items-start gap-4 mb-4">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${q.brand_mentioned ? 'fp-rank-number text-white' : 'fp-rank-number-neutral'}`}>{q.question_number}</span>
                      <div className="flex-1">
                        <p className="font-medium text-white/90">{q.question_text}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded text-xs fp-badge-neutral">{q.category}</span>
                          {q.brand_mentioned ? (<span className="px-2 py-0.5 rounded text-xs fp-badge-success">Brand Mentioned</span>) : (<span className="px-2 py-0.5 rounded text-xs fp-badge-neutral">Not Mentioned</span>)}
                        </div>
                        <p className="text-sm fp-text-muted mt-3">{q.executive_summary}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {['chatgpt', 'claude', 'gemini', 'perplexity'].map(p => {
                        const data = q.platforms?.[p] || {};
                        const isExpanded = expandedResponses[`${qIndex}-${p}`];
                        return (
                          <div key={p} className="bg-white/[0.05] rounded-xl overflow-hidden">
                            <button onClick={() => toggleResponseExpand(qIndex, p)} className="w-full p-3 text-left hover:bg-white/[0.02]">
                              <div className="flex items-center gap-2 mb-2">
                                <img src={platformLogos[p]} alt={p} className="h-4 object-contain" />
                                <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${data.mention > 0 ? 'fp-badge-success' : 'fp-badge-neutral'}`}>{data.mention > 0 ? 'Yes' : 'No'}</span>
                              </div>
                              <div className="text-lg font-bold">{data.overall || 0}</div>
                              <div className="text-xs fp-text-muted">Score</div>
                            </button>
                            {isExpanded && (
                              <div className="p-3 border-t fp-divider">
                                {data.notes && (
                                  <div className="mb-3 p-2 rounded-lg fp-card-strong">
                                    <p className="text-xs leading-relaxed" style={{ color: 'var(--fp-accent-1)' }}>{data.notes}</p>
                                  </div>
                                )}
                                <div className="max-h-64 overflow-y-auto">
                                  <div className="text-xs leading-relaxed"><FormattedResponse text={data.full_response || data.response_summary} /></div>
                                </div>
                                {data.competitors_mentioned?.length > 0 && (
                                  <div className="mt-2 text-xs fp-text-muted">Competitors: {data.competitors_mentioned.join(', ')}</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

                      </div>
        )}

        {/* PLATFORM DEEP DIVE PAGE */}
        {dashboardData && selectedPlatform && (
          <div className="animate-fadeIn space-y-8">
            <button onClick={() => setSelectedPlatform(null)} className="flex items-center gap-2 text-[#d4a5a5]/80 hover:text-white">← Back to Dashboard</button>
            <div className="flex items-center gap-6">
              <img src={platformLogos[selectedPlatform]} alt={selectedPlatform} className="w-16 h-16 object-contain" />
              <div><h1 className="text-3xl font-bold">{platformNames[selectedPlatform]} Deep Dive</h1><p className="fp-text-muted">Detailed analysis for {dashboardData.brand_name}</p></div>
            </div>
            <div className="fp-card-strong rounded-3xl p-8">
              <h2 className="text-xl font-bold mb-4">Executive Summary</h2>
              <p className="text-white/80 leading-relaxed text-lg">{dashboardData.platform_deep_dives?.[selectedPlatform]?.executive_summary}</p>
              <div className="grid grid-cols-4 gap-6 mt-8">
                <div className="text-center"><div className="text-3xl font-bold" style={{ color: 'var(--fp-accent-1)' }}>{dashboardData.platform_deep_dives?.[selectedPlatform]?.mention_rate}%</div><div className="text-sm fp-text-muted">Mention Rate</div></div>
                <div className="text-center"><div className="text-3xl font-bold" style={{ color: 'var(--fp-accent-1)' }}>{dashboardData.platform_deep_dives?.[selectedPlatform]?.sentiment}%</div><div className="text-sm fp-text-muted">Sentiment</div></div>
                <div className="text-center"><div className="text-3xl font-bold" style={{ color: 'var(--fp-accent-1)' }}>{dashboardData.platform_deep_dives?.[selectedPlatform]?.recommendation_rate}%</div><div className="text-sm fp-text-muted">Recommendation</div></div>
                <div className="text-center"><div className="text-3xl font-bold" style={{ color: 'var(--fp-accent-3)' }}>{dashboardData.platform_deep_dives?.[selectedPlatform]?.overall_score}</div><div className="text-sm fp-text-muted">Overall Score</div></div>
              </div>
            </div>
            <div className="fp-card rounded-3xl p-8">
              <h2 className="text-xl font-bold mb-6">{platformNames[selectedPlatform]} Responses</h2>
              <div className="space-y-6">
                {(dashboardData.question_breakdown || []).map((q, qIndex) => {
                  const platformData = q.platforms[selectedPlatform];
                  if (!platformData) return null;
                  return (
                    <div key={qIndex} className="p-6 rounded-xl fp-card">
                      <div className="flex items-start gap-4 mb-4">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${platformData.mention > 0 ? 'fp-rank-number text-white' : 'fp-rank-number-neutral'}`}>{q.question_number}</span>
                        <div><p className="font-medium text-white/90">{q.question_text}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded text-xs fp-badge-neutral">{q.category}</span>
                            {platformData.mention > 0 ? (<span className="px-2 py-0.5 rounded text-xs fp-badge-success">Mentioned</span>) : (<span className="px-2 py-0.5 rounded text-xs fp-badge">Not Mentioned</span>)}
                            <span className="text-xs fp-text-muted">Score: {platformData.overall}</span>
                          </div>
                        </div>
                      </div>
                      {platformData.notes && (
                        <div className="mb-4 p-3 rounded-xl fp-card-strong">
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--fp-accent-1)' }}>{platformData.notes}</p>
                        </div>
                      )}
                      <div className="p-4 fp-card rounded-xl max-h-96 overflow-y-auto text-sm leading-relaxed"><FormattedResponse text={platformData.full_response || platformData.response_summary} /></div>
                      <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                        <div><span className="fp-text-muted">Mention:</span> <span className="font-medium">{platformData.mention}%</span></div>
                        <div><span className="fp-text-muted">Sentiment:</span> <span className="font-medium">{platformData.sentiment}%</span></div>
                        <div><span className="fp-text-muted">Recommendation:</span> <span className="font-medium">{platformData.recommendation}%</span></div>
                        <div><span className="fp-text-muted">Position:</span> <span className="font-medium">{platformData.position}</span></div>
                      </div>
                      {platformData.competitors_mentioned?.length > 0 && (<div className="mt-3 pt-3 border-t fp-divider text-sm"><span className="fp-text-muted">Competitors: </span><span className="fp-text-muted">{platformData.competitors_mentioned.join(', ')}</span></div>)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="relative border-t border-[rgba(255,107,74,0.15)] mt-16">
        <div className="max-w-6xl mx-auto px-8 py-8 flex items-center justify-between">
          <img src={FUTUREPROOF_LOGO} alt="FutureProof" className="h-6 opacity-40" />
          <div className="text-sm fp-text-subtle">AI Visibility Intelligence Platform</div>
        </div>
      </footer>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.6s ease-out; }`}</style>
    </div>
  );
}
