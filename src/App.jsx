import React, { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle, ArrowRight, RefreshCw, TrendingUp, AlertCircle, X, Pencil, Check, Plus, ChevronRight, FileText, Calendar, ChevronDown, Sparkles, Activity, Award, Search, Lightbulb } from 'lucide-react';

// ============================================================
// CONFIGURATION
// ============================================================
const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/2024200/ugpfuqt/';
const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN || '';
const AIRTABLE_BASE_ID = 'appgSZR92pGCMlUOc';
const AIRTABLE_DASHBOARD_TABLE_ID = 'tblheMjYJzu1f88Ft';
const AIRTABLE_RAW_TABLE_ID = 'tblusxWUrocGCwUHb';

const STORAGE_KEY = 'ai-tracker-v10';

const platformLogos = {
  chatgpt: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/6e515ad0-76a8-4c99-9c31-4a9ddb82fcb4/301x167.png',
  claude: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/938283a6-6f08-40f3-8312-db242b04df00/866x650.png',
  gemini: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/56d036dd-ee48-48fa-a315-739bd86644f9/1600x900.png',
  perplexity: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/5b1d8753-3bc5-49eb-880f-ccf62ebcad25/1366x542.png'
};

const platformNames = { chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini', perplexity: 'Perplexity' };
const FUTUREPROOF_LOGO = 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/d19d829c-a9a9-4fad-b0e7-7938012be26c/800x200.png';

const PROGRESS_STAGES = [
  { id: 1, label: 'Querying ChatGPT', icon: 'chatgpt', duration: 35 },
  { id: 2, label: 'Querying Claude', icon: 'claude', duration: 35 },
  { id: 3, label: 'Querying Gemini', icon: 'gemini', duration: 35 },
  { id: 4, label: 'Querying Perplexity', icon: 'perplexity', duration: 35 },
  { id: 5, label: 'Extracting brand mentions', icon: null, duration: 30 },
  { id: 6, label: 'Analyzing sentiment', icon: null, duration: 30 },
  { id: 7, label: 'Calculating share of voice', icon: null, duration: 25 },
  { id: 8, label: 'Generating insights', icon: null, duration: 30 },
  { id: 9, label: 'Building report', icon: null, duration: 20 }
];

// ============================================================
// BRAND MATCHING UTILITIES
// ============================================================

const findTrackedBrandInRankings = (brandName, rankings) => {
  if (!brandName || !rankings?.length) return null;
  const normalizedInput = cleanBrandName(brandName);
  return rankings.find(r => r.brand === normalizedInput);
};

const getProperBrandName = (storedName, rankings) => {
  return cleanBrandName(storedName);
};

const cleanBrandName = (name) => {
  if (!name) return '';
  // Remove parenthetical content
  let cleaned = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
  // Normalize known brands
  const lower = cleaned.toLowerCase();
  const normalizations = {
    'nvidia geforce now': 'GeForce Now', 'geforce now': 'GeForce Now',
    'playstation plus premium': 'PlayStation Plus', 'playstation plus': 'PlayStation Plus', 'ps plus': 'PlayStation Plus',
    'xbox game pass ultimate': 'Xbox Game Pass', 'xbox game pass': 'Xbox Game Pass', 'xbox gamepass': 'Xbox Game Pass', 'box gamepass': 'Xbox Game Pass',
    'xbox cloud gaming': 'Xbox Cloud Gaming', 'xcloud': 'Xbox Cloud Gaming',
    'amazon luna': 'Amazon Luna', 'luna': 'Amazon Luna',
    'ea play': 'EA Play', 'nintendo switch online': 'Nintendo Switch Online',
    'apple arcade': 'Apple Arcade', 'ubisoft+': 'Ubisoft+'
  };
  for (const [key, val] of Object.entries(normalizations)) {
    if (lower.includes(key) || lower === key) return val;
  }
  return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const capitalizeBrand = (name) => cleanBrandName(name);

const deduplicateBrands = (rankings) => {
  const merged = new Map();
  for (const b of rankings) {
    const key = cleanBrandName(b.brand);
    if (merged.has(key)) {
      const existing = merged.get(key);
      existing.mentions = (existing.mentions || 0) + (b.mentions || 0);
      existing.share_of_voice = (existing.share_of_voice || 0) + (b.share_of_voice || 0);
      if (b.sentiment > (existing.sentiment || 0)) existing.sentiment = b.sentiment;
    } else {
      merged.set(key, { ...b, brand: key });
    }
  }
  return Array.from(merged.values()).sort((a, b) => (b.share_of_voice || 0) - (a.share_of_voice || 0));
};

const isValidBrand = (name) => {
  if (!name || typeof name !== 'string') return false;
  const invalid = ['none', 'n/a', '', 'implicit', 'null', 'undefined'];
  const cleaned = name.toLowerCase().trim();
  return !invalid.includes(cleaned) && cleaned.length >= 2 && !cleaned.includes('mentioned in');
};

const generateQuestionSummary = (brandName, platforms) => {
  const mentioned = Object.entries(platforms).filter(([_, d]) => d.mention > 0).map(([p]) => platformNames[p]);
  if (mentioned.length === 0) return `${brandName} was not mentioned. This represents an optimization opportunity.`;
  if (mentioned.length === 4) return `${brandName} was mentioned across all platforms.`;
  return `${brandName} was mentioned by ${mentioned.join(', ')}.`;
};

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [step, setStep] = useState('setup');
  const [config, setConfig] = useState({ brandName: '', email: '', keyMessages: ['', '', '', '', ''], competitors: ['', '', ''], questionCount: 15, otherConsiderations: '' });
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [saved, setSaved] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [allReports, setAllReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [showReportDropdown, setShowReportDropdown] = useState(false);
  const [expandedResponses, setExpandedResponses] = useState({});
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const pollingRef = useRef(null);

  const toggleResponseExpand = (qIdx, platform) => {
    setExpandedResponses(prev => ({ ...prev, [`${qIdx}-${platform}`]: !prev[`${qIdx}-${platform}`] }));
  };

  // ============================================================
  // DATA FETCHING
  // ============================================================
  const fetchAllReports = async () => {
    try {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DASHBOARD_TABLE_ID}?sort%5B0%5D%5Bfield%5D=created_at&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=20`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
      const json = await res.json();
      if (json.records) setAllReports(json.records.map(r => ({ id: r.id, run_id: r.fields.run_id, brand_name: r.fields.brand_name, report_date: r.fields.report_date, visibility_score: r.fields.visibility_score })));
    } catch (e) { console.error(e); }
  };

  const fetchRawQuestionData = async (runId) => {
    try {
      let all = [], offset = null;
      do {
        let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_RAW_TABLE_ID}?filterByFormula={run_id}="${runId}"&sort%5B0%5D%5Bfield%5D=question_number&sort%5B0%5D%5Bdirection%5D=asc`;
        if (offset) url += `&offset=${offset}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
        const json = await res.json();
        if (json.records) all = all.concat(json.records);
        offset = json.offset;
      } while (offset);
      return all;
    } catch (e) { return []; }
  };

  const buildQuestionBreakdownFromRaw = (rawRecords, brandName) => {
    return rawRecords.map(rec => {
      const f = rec.fields;
      const platforms = {};
      for (const p of ['chatgpt', 'claude', 'gemini', 'perplexity']) {
        platforms[p] = {
          full_response: f[`${p}_response`] || '',
          mention: parseFloat(f[`${p}_mention`]) || 0,
          sentiment: parseFloat(f[`${p}_sentiment`]) || 0,
          recommendation: parseFloat(f[`${p}_recommendation`]) || 0,
          overall: parseFloat(f[`${p}_overall`]) || 0,
          competitors_mentioned: f[`${p}_competitors_mentioned`] || [],
          commentary: f[`${p}_notes`] || ''
        };
      }
      const brandMentioned = Object.values(platforms).some(p => p.mention > 0);
      return {
        question_number: f.question_number,
        question_text: f.question_text || '',
        category: f.question_category || 'General',
        platforms,
        brand_mentioned: brandMentioned,
        executive_summary: generateQuestionSummary(brandName, platforms)
      };
    });
  };

  const parseReportData = async (r) => {
    const runId = r.run_id;
    const storedBrandName = r.brand_name || 'Unknown';
    
    // Parse Zapier pre-calculated data
    let brandRankings = deduplicateBrands(JSON.parse(r.brand_rankings_json || '[]').filter(b => isValidBrand(b.brand)));
    let sentimentRankings = deduplicateBrands(JSON.parse(r.sentiment_rankings_json || '[]').filter(b => isValidBrand(b.brand))).slice(0, 5);
    const platformConsistency = JSON.parse(r.platform_consistency_json || '{}');
    const platformDeepDives = JSON.parse(r.platform_deep_dives_json || '{}');
    const platforms = JSON.parse(r.platforms_json || '{}');
    const recommendations = JSON.parse(r.recommendations_json || '[]');
    const execSummary = JSON.parse(r.executive_summary_json || '{}');
    
    // Get proper brand name and match in rankings
    const properBrandName = getProperBrandName(storedBrandName, brandRankings);
    const trackedMatch = findTrackedBrandInRankings(storedBrandName, brandRankings);
    if (trackedMatch) {
      const idx = brandRankings.findIndex(b => b.brand === trackedMatch.brand);
      if (idx >= 0) brandRankings[idx].is_tracked_brand = true;
    }
    const sentimentMatch = findTrackedBrandInRankings(storedBrandName, sentimentRankings);
    if (sentimentMatch) {
      const idx = sentimentRankings.findIndex(b => b.brand === sentimentMatch.brand);
      if (idx >= 0) sentimentRankings[idx].is_tracked_brand = true;
    }
    
    const brandRank = trackedMatch ? brandRankings.findIndex(b => b.is_tracked_brand) + 1 : null;
    const brandSov = trackedMatch ? trackedMatch.share_of_voice : 0;
    
    // Fetch full responses from raw data
    const rawRecords = await fetchRawQuestionData(runId);
    const questionBreakdown = rawRecords.length > 0 ? buildQuestionBreakdownFromRaw(rawRecords, properBrandName) : JSON.parse(r.question_breakdown_json || '[]');
    
    const questionsWithBrand = questionBreakdown.filter(q => q.brand_mentioned).length;
    const brandCoverage = questionBreakdown.length > 0 ? Math.round((questionsWithBrand / questionBreakdown.length) * 100) : 0;
    
    const pv = Object.values(platforms);
    const avgSentiment = pv.length ? Math.round(pv.reduce((s, p) => s + (p.sentiment || 0), 0) / pv.length) : 0;
    const avgRecommendation = pv.length ? Math.round(pv.reduce((s, p) => s + (p.recommendation || 0), 0) / pv.length) : 0;
    const topCompetitors = brandRankings.filter(b => !b.is_tracked_brand).slice(0, 3).map(b => b.brand).join(', ') || 'None identified';

    // Fix brand name in deep dives
    const fixedDeepDives = {};
    for (const [p, d] of Object.entries(platformDeepDives)) {
      fixedDeepDives[p] = { ...d, executive_summary: (d.executive_summary || '').replace(/Box Gamepass/gi, properBrandName) };
    }

    return {
      run_id: runId, brand_name: properBrandName, report_date: r.report_date || new Date().toLocaleDateString(),
      visibility_score: r.visibility_score || 0,
      executive_summary: {
        headline: (execSummary.headline || `${properBrandName} AI Visibility Analysis`).replace(/Box Gamepass/gi, properBrandName),
        paragraphs: (execSummary.paragraphs || []).map(p => p.replace(/Box Gamepass/gi, properBrandName)),
        bullets: [
          `Share of Voice: ${brandSov}% (Rank #${brandRank || 'N/A'} of ${brandRankings.length} brands)`,
          `Brand Coverage: ${questionsWithBrand} of ${questionBreakdown.length} queries (${brandCoverage}%)`,
          `Best Platform: ${r.best_model || 'N/A'}`,
          `Worst Platform: ${r.worst_model || 'N/A'}`,
          `Average Sentiment: ${avgSentiment}%`,
          `Recommendation Rate: ${avgRecommendation}%`,
          `Top Competitors: ${topCompetitors}`
        ]
      },
      brand_rankings: brandRankings, brand_rank: brandRank, brand_sov: brandSov,
      sentiment_rankings: sentimentRankings,
      platform_consistency: platformConsistency, platform_deep_dives: fixedDeepDives, platforms,
      best_model: r.best_model || '', worst_model: r.worst_model || '',
      question_breakdown: questionBreakdown, brand_coverage: brandCoverage,
      recommendations
    };
  };

  const loadReport = async (recordId) => {
    try {
      const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DASHBOARD_TABLE_ID}/${recordId}`, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
      const json = await res.json();
      if (json.fields) { setDashboardData(await parseReportData(json.fields)); setSelectedReportId(recordId); setShowReportDropdown(false); }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { try { const s = localStorage.getItem(STORAGE_KEY); if (s) { const d = JSON.parse(s); if (d.config) setConfig(d.config); } } catch (e) {} }, []);
  useEffect(() => { const t = setTimeout(() => { if (config.brandName) { localStorage.setItem(STORAGE_KEY, JSON.stringify({ config })); setSaved(true); setTimeout(() => setSaved(false), 1500); } }, 1000); return () => clearTimeout(t); }, [config]);

  const pollForResults = async (sid) => {
    try {
      const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DASHBOARD_TABLE_ID}?filterByFormula={session_id}="${sid}"`, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
      const json = await res.json();
      if (json.records?.length) { setDashboardData(await parseReportData(json.records[0].fields)); clearInterval(pollingRef.current); await fetchAllReports(); setStep('complete'); return true; }
      return false;
    } catch (e) { return false; }
  };

  useEffect(() => {
    if (step !== 'processing') return;
    const total = PROGRESS_STAGES.reduce((s, st) => s + st.duration, 0);
    let elapsed = 0;
    const iv = setInterval(() => {
      elapsed += 0.5;
      let cum = 0;
      for (let i = 0; i < PROGRESS_STAGES.length; i++) { cum += PROGRESS_STAGES[i].duration; if (elapsed < cum) { setCurrentStage(i); setStageProgress(Math.min(100, ((elapsed - (cum - PROGRESS_STAGES[i].duration)) / PROGRESS_STAGES[i].duration) * 100)); break; } }
      if (elapsed >= total) { setCurrentStage(PROGRESS_STAGES.length - 1); setStageProgress(100); }
    }, 500);
    return () => clearInterval(iv);
  }, [step]);

  useEffect(() => {
    if (step === 'processing' && sessionId) {
      setTimeout(() => pollForResults(sessionId), 60000);
      pollingRef.current = setInterval(() => pollForResults(sessionId), 30000);
      return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }
  }, [step, sessionId]);

  const handleGenerate = async () => {
    setIsGenerating(true); setGenerateError('');
    try {
      const res = await fetch('/.netlify/functions/generate-questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brandName: config.brandName, competitors: config.competitors.filter(c => c.trim()), keyMessages: config.keyMessages.filter(m => m.trim()), questionCount: config.questionCount }) });
      const data = await res.json();
      if (data.questions) { setGeneratedQuestions(data.questions.map((q, i) => ({ id: i + 1, text: q.text, category: q.category, included: true }))); setStep('customize'); }
    } catch (e) { setGenerateError('Failed to generate questions.'); }
    finally { setIsGenerating(false); }
  };

  const handleSubmit = async () => {
    const sid = `SES_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setSessionId(sid); setCurrentStage(0); setStageProgress(0); setStep('processing');
    try { await fetch(ZAPIER_WEBHOOK_URL, { method: 'POST', body: JSON.stringify({ session_id: sid, brand_name: config.brandName, email: config.email, key_messages: config.keyMessages.filter(m => m.trim()), competitors: config.competitors.filter(c => c.trim()), questions: generatedQuestions.filter(q => q.included).map(q => ({ text: q.text, category: q.category })), question_count: generatedQuestions.filter(q => q.included).length, timestamp: new Date().toISOString() }) }); } catch (e) {}
  };

  const isValid = config.brandName.trim() && config.email.includes('@') && config.keyMessages.some(m => m.trim());

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/[0.04] sticky top-0 bg-[#0a0a0f]/90 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4"><img src={FUTUREPROOF_LOGO} alt="FutureProof" className="h-8" /><span className="text-white/20">|</span><span className="font-semibold">AI Visibility Tracker</span></div>
          {step === 'complete' && dashboardData && (
            <div className="flex items-center gap-4">
              <div className="relative">
                <button onClick={() => { setShowReportDropdown(!showReportDropdown); if (!showReportDropdown) fetchAllReports(); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-sm"><Calendar className="w-4 h-4" />Past Reports<ChevronDown className="w-4 h-4" /></button>
                {showReportDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-[#16161f] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                    {allReports.map(rpt => (<button key={rpt.id} onClick={() => loadReport(rpt.id)} className={`w-full px-4 py-3 text-left hover:bg-white/[0.05] border-b border-white/[0.04] ${selectedReportId === rpt.id ? 'bg-white/[0.08]' : ''}`}><div className="font-medium">{rpt.brand_name}</div><div className="text-sm text-white/40">{rpt.report_date}</div></button>))}
                    {!allReports.length && <div className="px-4 py-8 text-center text-white/40">No reports found</div>}
                  </div>
                )}
              </div>
              <button onClick={() => { setStep('setup'); setDashboardData(null); setSelectedPlatform(null); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-medium"><RefreshCw className="w-4 h-4" />New Analysis</button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12">
        {/* SETUP */}
        {step === 'setup' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-6"><Sparkles className="w-4 h-4" />AI-Powered Brand Intelligence</div>
              <h1 className="text-4xl font-bold mb-4">Discover Your AI Visibility</h1>
              <p className="text-white/50 text-lg">See how ChatGPT, Claude, Gemini, and Perplexity represent your brand</p>
            </div>
            <div className="space-y-6">
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06]"><label className="block text-sm font-medium text-white/70 mb-2">Brand Name *</label><input type="text" value={config.brandName} onChange={e => setConfig({ ...config, brandName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-cyan-500/50 outline-none" placeholder="e.g., Xbox Game Pass" /></div>
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06]"><label className="block text-sm font-medium text-white/70 mb-2">Email *</label><input type="email" value={config.email} onChange={e => setConfig({ ...config, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-cyan-500/50 outline-none" placeholder="you@company.com" /></div>
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06]"><label className="block text-sm font-medium text-white/70 mb-3">Key Messages</label>{config.keyMessages.map((m, i) => (<input key={i} type="text" value={m} onChange={e => { const n = [...config.keyMessages]; n[i] = e.target.value; setConfig({ ...config, keyMessages: n }); }} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-cyan-500/50 outline-none mb-2" placeholder={`Message ${i + 1}`} />))}</div>
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06]"><label className="block text-sm font-medium text-white/70 mb-3">Competitors</label>{config.competitors.map((c, i) => (<input key={i} type="text" value={c} onChange={e => { const n = [...config.competitors]; n[i] = e.target.value; setConfig({ ...config, competitors: n }); }} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-cyan-500/50 outline-none mb-2" placeholder={`Competitor ${i + 1}`} />))}</div>
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06]"><label className="block text-sm font-medium text-white/70 mb-2">Number of Questions</label><select value={config.questionCount} onChange={e => setConfig({ ...config, questionCount: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] outline-none">{[5, 10, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
              {generateError && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{generateError}</div>}
              <button onClick={handleGenerate} disabled={!isValid || isGenerating} className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-50 font-semibold text-lg flex items-center justify-center gap-3">{isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" />Generating...</> : <>Generate Questions<ArrowRight className="w-5 h-5" /></>}</button>
              {saved && <div className="text-center text-sm text-emerald-400 flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" />Saved</div>}
            </div>
          </div>
        )}

        {/* CUSTOMIZE */}
        {step === 'customize' && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8"><div><h2 className="text-2xl font-bold">Review Questions</h2><p className="text-white/50">{generatedQuestions.filter(q => q.included).length} selected</p></div><button onClick={() => setStep('setup')} className="text-white/50 hover:text-white">← Back</button></div>
            <div className="space-y-3 mb-8">
              {generatedQuestions.map(q => (
                <div key={q.id} className={`p-4 rounded-xl border ${q.included ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-white/[0.01] border-white/[0.04] opacity-50'}`}>
                  <div className="flex items-start gap-4">
                    <button onClick={() => setGeneratedQuestions(qs => qs.map(x => x.id === q.id ? { ...x, included: !x.included } : x))} className="mt-1">{q.included ? <div className="w-5 h-5 rounded bg-cyan-500 flex items-center justify-center"><Check className="w-3 h-3" /></div> : <div className="w-5 h-5 rounded border border-white/20" />}</button>
                    <div className="flex-1">
                      {editingId === q.id ? (
                        <div className="flex items-center gap-2"><input type="text" value={editText} onChange={e => setEditText(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-white/[0.06] border border-cyan-500/50 outline-none" autoFocus /><button onClick={() => { setGeneratedQuestions(qs => qs.map(x => x.id === q.id ? { ...x, text: editText } : x)); setEditingId(null); }} className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400"><Check className="w-4 h-4" /></button><button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-white/[0.06] text-white/50"><X className="w-4 h-4" /></button></div>
                      ) : (
                        <div className="flex items-start justify-between"><div><p className="text-white/90">{q.text}</p><span className="text-xs text-white/40">{q.category}</span></div><button onClick={() => { setEditingId(q.id); setEditText(q.text); }} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40"><Pencil className="w-4 h-4" /></button></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => { const id = Math.max(...generatedQuestions.map(q => q.id), 0) + 1; setGeneratedQuestions([...generatedQuestions, { id, text: 'New question', category: 'Custom', included: true }]); setEditingId(id); setEditText('New question'); }} className="flex-1 py-3 rounded-xl border border-dashed border-white/20 hover:border-white/40 text-white/50 hover:text-white flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Add</button>
              <button onClick={handleSubmit} disabled={!generatedQuestions.some(q => q.included)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-50 font-semibold flex items-center justify-center gap-2">Run Analysis<ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* PROCESSING */}
        {step === 'processing' && (
          <div className="max-w-xl mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6"><Loader2 className="w-10 h-10 animate-spin" /></div>
            <h2 className="text-2xl font-bold mb-2">Analyzing AI Visibility</h2>
            <p className="text-white/50 mb-8">Takes about 5 minutes. You'll get an email when ready.</p>
            <div className="space-y-4">
              {PROGRESS_STAGES.map((s, i) => (
                <div key={s.id} className={`p-4 rounded-xl border ${i < currentStage ? 'bg-emerald-500/10 border-emerald-500/20' : i === currentStage ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/[0.02] border-white/[0.06]'}`}>
                  <div className="flex items-center gap-4">
                    {s.icon ? <img src={platformLogos[s.icon]} alt="" className="w-8 h-8 object-contain" /> : <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i < currentStage ? 'bg-emerald-500' : i === currentStage ? 'bg-cyan-500' : 'bg-white/10'}`}>{i < currentStage ? <Check className="w-4 h-4" /> : <span className="text-sm">{s.id}</span>}</div>}
                    <div className="flex-1 text-left"><p className={i <= currentStage ? 'text-white' : 'text-white/40'}>{s.label}</p>{i === currentStage && <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden"><div className="h-full bg-cyan-500" style={{ width: `${stageProgress}%` }} /></div>}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DASHBOARD */}
        {step === 'complete' && dashboardData && !selectedPlatform && (
          <div className="space-y-8">
            <div><h1 className="text-3xl font-bold">{dashboardData.brand_name} <span className="text-lg font-normal text-white/40">AI Visibility Report</span></h1><p className="text-white/40">{dashboardData.report_date}</p></div>

            {/* Executive Summary */}
            <div className="bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 rounded-3xl p-8 border border-cyan-500/20">
              <div className="flex items-start gap-4 mb-6"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"><Sparkles className="w-6 h-6" /></div><div><h2 className="text-xl font-bold">Executive Summary</h2><p className="text-sm text-white/40">Key findings</p></div></div>
              <h3 className="text-2xl font-semibold mb-4">{dashboardData.executive_summary?.headline}</h3>
              {(dashboardData.executive_summary?.paragraphs || []).map((p, i) => <p key={i} className="text-white/70 mb-2">{p}</p>)}
              <ul className="grid grid-cols-2 gap-3 mt-6">{(dashboardData.executive_summary?.bullets || []).map((b, i) => <li key={i} className="flex items-start gap-2 text-sm text-white/60"><ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />{b}</li>)}</ul>
            </div>

            {/* Brand Rankings */}
            <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
              <div className="flex items-start gap-4 mb-6"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"><Award className="w-6 h-6" /></div><div className="flex-1"><h2 className="text-xl font-bold">Brand Rankings</h2><p className="text-sm text-white/40">Share of voice</p></div>{dashboardData.brand_sov > 0 && <div className="text-right"><div className="text-3xl font-bold text-amber-400">{dashboardData.brand_sov}%</div><div className="text-sm text-white/40">SOV</div></div>}</div>
              <div className="space-y-3">{(dashboardData.brand_rankings || []).slice(0, 10).map((b, i) => (<div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${b.is_tracked_brand ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/[0.02]'}`}><span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${b.is_tracked_brand ? 'bg-amber-500 text-white' : 'bg-white/10 text-white/50'}`}>{i + 1}</span><span className={`flex-1 font-medium ${b.is_tracked_brand ? 'text-amber-400' : 'text-white/70'}`}>{b.brand}</span><span className="text-white/40 text-sm">{b.mentions} mentions</span><span className={b.is_tracked_brand ? 'text-amber-400 font-semibold' : 'text-white/70'}>{b.share_of_voice}%</span></div>))}</div>
            </div>

            {/* Sentiment Rankings */}
            {dashboardData.sentiment_rankings?.length > 0 && (
            <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
              <div className="flex items-start gap-4 mb-6"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div><div><h2 className="text-xl font-bold">Sentiment Rankings</h2><p className="text-sm text-white/40">Top 5 brands by sentiment</p></div></div>
              <div className="space-y-3">{dashboardData.sentiment_rankings.map((b, i) => (<div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${b.is_tracked_brand ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.02]'}`}><span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${b.is_tracked_brand ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/50'}`}>{i + 1}</span><span className={`flex-1 font-medium ${b.is_tracked_brand ? 'text-emerald-400' : 'text-white/70'}`}>{b.brand}</span><span className={`font-semibold ${b.is_tracked_brand ? 'text-emerald-400' : 'text-white/70'}`}>{b.sentiment}%</span></div>))}</div>
            </div>
            )}

            {/* Platform Consistency */}
            <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
              <div className="flex items-start gap-4 mb-6"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center"><Activity className="w-6 h-6" /></div><div className="flex-1"><h2 className="text-xl font-bold">Platform Consistency</h2><p className="text-sm text-white/40">Mention rates across platforms</p></div>{dashboardData.platform_consistency?.variance !== undefined && <div className={`px-3 py-1 rounded-full text-sm ${dashboardData.platform_consistency.is_consistent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{dashboardData.platform_consistency.variance}% variance</div>}</div>
              <div className="grid grid-cols-4 gap-4">{Object.entries(dashboardData.platform_consistency?.rates || {}).map(([p, rate]) => (<div key={p} className={`p-4 rounded-xl text-center ${p === dashboardData.platform_consistency?.strongest ? 'bg-emerald-500/10 border border-emerald-500/20' : p === dashboardData.platform_consistency?.weakest ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/[0.03]'}`}><img src={platformLogos[p]} alt="" className="w-10 h-10 object-contain mx-auto mb-2" /><div className="font-medium text-sm">{platformNames[p]}</div><div className={`text-2xl font-bold ${p === dashboardData.platform_consistency?.strongest ? 'text-emerald-400' : p === dashboardData.platform_consistency?.weakest ? 'text-red-400' : 'text-white/70'}`}>{rate}%</div></div>))}</div>
            </div>

            {/* Platform Deep Dives */}
            <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
              <div className="flex items-start gap-4 mb-6"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><Search className="w-6 h-6" /></div><div><h2 className="text-xl font-bold">Platform Deep Dives</h2><p className="text-sm text-white/40">Per-platform analysis</p></div></div>
              <div className="grid grid-cols-2 gap-4">{Object.entries(dashboardData.platform_deep_dives || {}).map(([p, d]) => (<div key={p} className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]"><div className="flex items-center gap-3 mb-4"><img src={platformLogos[p]} alt="" className="w-8 h-8 object-contain" /><span className="font-semibold">{platformNames[p]}</span><span className={`ml-auto px-2 py-0.5 rounded text-xs ${d.perception === 'positive' ? 'bg-emerald-500/20 text-emerald-400' : d.perception === 'negative' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/50'}`}>{d.perception}</span></div><p className="text-sm text-white/60 mb-4">{d.executive_summary}</p><div className="grid grid-cols-2 gap-3 text-sm"><div><span className="text-white/40">Mention</span><div className="font-semibold">{d.mention_rate}%</div></div><div><span className="text-white/40">Sentiment</span><div className="font-semibold">{d.sentiment}%</div></div><div><span className="text-white/40">Recommend</span><div className="font-semibold">{d.recommendation_rate}%</div></div><div><span className="text-white/40">Score</span><div className="font-semibold">{d.overall_score}</div></div></div><button onClick={() => setSelectedPlatform(p)} className="mt-4 w-full py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-sm font-medium flex items-center justify-center gap-2">Dig Deeper<ChevronRight className="w-4 h-4" /></button></div>))}</div>
            </div>

            {/* Question Breakdown */}
            <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
              <div className="flex items-start gap-4 mb-6"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"><FileText className="w-6 h-6" /></div><div><h2 className="text-xl font-bold">Question Analysis</h2><p className="text-sm text-white/40">{dashboardData.brand_name} in {dashboardData.brand_coverage}% of queries</p></div></div>
              <div className="space-y-4">{(dashboardData.question_breakdown || []).map((q, qi) => (<div key={qi} className="border border-white/[0.06] rounded-2xl overflow-hidden"><div className={`px-6 py-4 ${q.brand_mentioned ? 'bg-emerald-500/5' : 'bg-white/[0.02]'}`}><div className="flex items-start gap-4"><span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${q.brand_mentioned ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/50'}`}>{q.question_number}</span><div className="flex-1"><p className="font-medium text-white/90">{q.question_text}</p><div className="flex items-center gap-2 mt-2"><span className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/50">{q.category}</span>{q.brand_mentioned ? <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">Mentioned</span> : <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">Not Mentioned</span>}</div><p className="text-sm text-white/50 mt-3 italic">{q.executive_summary}</p></div></div></div><div className="divide-y divide-white/[0.04]">{Object.entries(q.platforms).map(([pl, pd]) => { const exp = expandedResponses[`${qi}-${pl}`]; return (<div key={pl} className="px-6 py-4"><button onClick={() => toggleResponseExpand(qi, pl)} className="w-full text-left"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><img src={platformLogos[pl]} alt="" className="w-6 h-6 object-contain" /><span className="font-medium text-sm">{platformNames[pl]}</span>{pd.mention > 0 && <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">✓</span>}</div><div className="flex items-center gap-4"><span className="text-xs text-white/40">Score: {pd.overall}</span><ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${exp ? 'rotate-180' : ''}`} /></div></div></button>{exp && <div className="mt-4 p-4 bg-white/[0.03] rounded-xl"><p className="text-sm text-white/70 whitespace-pre-wrap">{pd.full_response || 'No response'}</p></div>}</div>); })}</div></div>))}</div>
            </div>

            {/* Recommendations */}
            <div className="bg-gradient-to-br from-orange-500/10 via-transparent to-pink-500/10 rounded-3xl p-8 border border-orange-500/20">
              <div className="flex items-start gap-4 mb-6"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center"><Lightbulb className="w-6 h-6" /></div><div><h2 className="text-xl font-bold">Recommendations</h2><p className="text-sm text-white/40">Priority actions</p></div></div>
              <div className="space-y-4">{(dashboardData.recommendations || []).map((r, i) => (<div key={i} className={`p-5 rounded-xl border ${r.priority === 'high' ? 'bg-red-500/10 border-red-500/20' : r.priority === 'medium' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/[0.03] border-white/[0.06]'}`}><div className="flex items-start gap-4"><span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${r.priority === 'high' ? 'bg-red-500/20 text-red-400' : r.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/50'}`}>{i + 1}</span><div><div className={`text-xs font-bold uppercase ${r.priority === 'high' ? 'text-red-400' : r.priority === 'medium' ? 'text-amber-400' : 'text-white/50'}`}>{r.priority} priority</div><div className="font-medium text-white/90 mt-1">{r.action}</div>{r.detail && <p className="text-sm text-white/50 mt-1">{r.detail}</p>}</div></div></div>))}{!dashboardData.recommendations?.length && <div className="text-center py-8 text-white/40">No recommendations</div>}</div>
            </div>

            <div className="text-center pt-8"><button onClick={() => { setStep('setup'); setDashboardData(null); }} className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08]"><RefreshCw className="w-5 h-5" />New Analysis</button></div>
          </div>
        )}

        {/* Platform Deep Dive Page */}
        {step === 'complete' && dashboardData && selectedPlatform && (
          <div className="space-y-8">
            <button onClick={() => setSelectedPlatform(null)} className="text-white/50 hover:text-white">← Back</button>
            <div className="flex items-center gap-6"><img src={platformLogos[selectedPlatform]} alt="" className="w-16 h-16 object-contain" /><div><h1 className="text-3xl font-bold">{platformNames[selectedPlatform]} Deep Dive</h1><p className="text-white/50">{dashboardData.brand_name}</p></div></div>
            <div className="bg-gradient-to-br from-blue-500/10 via-transparent to-indigo-500/10 rounded-3xl p-8 border border-blue-500/20">
              <h2 className="text-xl font-bold mb-4">Summary</h2>
              <p className="text-white/70 text-lg">{dashboardData.platform_deep_dives?.[selectedPlatform]?.executive_summary}</p>
              <div className="grid grid-cols-4 gap-6 mt-8">{[['Mention', dashboardData.platform_deep_dives?.[selectedPlatform]?.mention_rate, 'blue'], ['Sentiment', dashboardData.platform_deep_dives?.[selectedPlatform]?.sentiment, 'emerald'], ['Recommend', dashboardData.platform_deep_dives?.[selectedPlatform]?.recommendation_rate, 'amber'], ['Score', dashboardData.platform_deep_dives?.[selectedPlatform]?.overall_score, 'purple']].map(([l, v, c]) => <div key={l} className="text-center"><div className={`text-3xl font-bold text-${c}-400`}>{v}{typeof v === 'number' && l !== 'Score' ? '%' : ''}</div><div className="text-sm text-white/40">{l}</div></div>)}</div>
            </div>
            <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
              <h2 className="text-xl font-bold mb-6">All Responses</h2>
              <div className="space-y-6">{(dashboardData.question_breakdown || []).map((q, qi) => { const pd = q.platforms[selectedPlatform]; if (!pd) return null; return (<div key={qi} className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]"><div className="flex items-start gap-4 mb-4"><span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${pd.mention > 0 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/50'}`}>{q.question_number}</span><div><p className="font-medium text-white/90">{q.question_text}</p><div className="flex items-center gap-2 mt-2"><span className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/50">{q.category}</span>{pd.mention > 0 ? <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">Mentioned</span> : <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">Not Mentioned</span>}<span className="text-xs text-white/40">Score: {pd.overall}</span></div></div></div><div className="p-4 bg-white/[0.02] rounded-xl"><p className="text-sm text-white/70 whitespace-pre-wrap">{pd.full_response || 'No response'}</p></div></div>); })}</div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/[0.04] mt-16"><div className="max-w-6xl mx-auto px-8 py-8 flex items-center justify-between"><img src={FUTUREPROOF_LOGO} alt="" className="h-6 opacity-40" /><div className="text-sm text-white/30">AI Visibility Intelligence</div></div></footer>
    </div>
  );
}
