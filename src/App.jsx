import React, { useState, useEffect, useRef } from 'react';
import { Zap, Loader2, CheckCircle, ArrowRight, RefreshCw, TrendingUp, TrendingDown, AlertCircle, X, Pencil, Check, Plus, ChevronRight, Eye, FileText, BarChart3, Download, Calendar, ChevronDown, Sparkles, Target, Activity, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

// ============================================================
// CONFIGURATION
// ============================================================
const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/2024200/ugpfuqt/';
const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN || '';
const AIRTABLE_BASE_ID = 'appgSZR92pGCMlUOc';
const AIRTABLE_TABLE_ID = 'tblheMjYJzu1f88Ft';
// ============================================================

const STORAGE_KEY = 'ai-tracker-customer-v6';

const platformLogos = {
  chatgpt: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/6e515ad0-76a8-4c99-9c31-4a9ddb82fcb4/301x167.png',
  claude: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/938283a6-6f08-40f3-8312-db242b04df00/866x650.png',
  gemini: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/56d036dd-ee48-48fa-a315-739bd86644f9/1600x900.png',
  perplexity: 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/5b1d8753-3bc5-49eb-880f-ccf62ebcad25/1366x542.png'
};

const platformNames = { chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini', perplexity: 'Perplexity' };
const FUTUREPROOF_LOGO = 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/d19d829c-a9a9-4fad-b0e7-7938012be26c/800x200.png';

const gradeColors = { 
  'A': { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' }, 
  'B': { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' }, 
  'C': { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' }, 
  'D': { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' }, 
  'F': { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' } 
};

const PROGRESS_STAGES = [
  { id: 1, label: 'Querying ChatGPT', icon: 'chatgpt', duration: 12 },
  { id: 2, label: 'Querying Claude', icon: 'claude', duration: 12 },
  { id: 3, label: 'Querying Gemini', icon: 'gemini', duration: 12 },
  { id: 4, label: 'Querying Perplexity', icon: 'perplexity', duration: 12 },
  { id: 5, label: 'Analyzing brand positioning', icon: null, duration: 15 },
  { id: 6, label: 'Calculating visibility scores', icon: null, duration: 12 },
  { id: 7, label: 'Generating strategic insights', icon: null, duration: 10 },
  { id: 8, label: 'Building your report', icon: null, duration: 8 }
];

const MOCK_HISTORY = [
  { date: '2025-10', score: 64 },
  { date: '2025-11', score: 68 },
  { date: '2025-12', score: 71 },
  { date: '2026-01', score: 72.4 }
];

// Generate questions using Claude API via Netlify function
const generateQuestionsWithClaude = async (brandName, competitors, keyMessages, questionCount) => {
  try {
    const response = await fetch('/.netlify/functions/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandName, competitors, keyMessages, questionCount })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.questions.map((q, i) => ({
      id: i + 1,
      text: q.text,
      category: q.category,
      included: true
    }));
  } catch (error) {
    console.error('Claude API error:', error);
    // Fallback to template questions
    return generateTemplateQuestions(brandName, competitors, questionCount);
  }
};

// Fallback template questions (category-focused, no brand names)
const generateTemplateQuestions = (brandName, competitors, count) => {
  const allQuestions = [
    { text: 'What are the best consumer research platforms for enterprises?', category: 'Research' },
    { text: 'How do companies gather real-time customer insights?', category: 'Awareness' },
    { text: 'What tools help with agile market research?', category: 'Awareness' },
    { text: 'Best platforms for online surveys and consumer feedback', category: 'Research' },
    { text: 'How to evaluate market research software vendors?', category: 'Evaluation' },
    { text: 'What features matter most in a consumer insights platform?', category: 'Evaluation' },
    { text: 'Leading AI-powered market research tools', category: 'Research' },
    { text: 'How do enterprises run fast consumer research studies?', category: 'Awareness' },
    { text: 'What market research platform is best for CPG brands?', category: 'Consideration' },
    { text: 'How to choose a consumer insights vendor?', category: 'Decision' },
    { text: 'Best alternatives to traditional market research agencies', category: 'Research' },
    { text: 'What is the fastest way to get consumer feedback?', category: 'Awareness' },
    { text: 'Top survey platforms for brand tracking', category: 'Research' },
    { text: 'How to run concept testing with consumers?', category: 'Consideration' },
    { text: 'What should I look for in a DIY research platform?', category: 'Decision' },
    { text: 'Best tools for ad testing and creative research', category: 'Research' },
    { text: 'How do marketing teams validate ideas with consumers?', category: 'Awareness' },
    { text: 'Enterprise solutions for consumer panel research', category: 'Consideration' },
    { text: 'What platforms offer real-time consumer insights?', category: 'Research' },
    { text: 'How to select the right market research technology?', category: 'Decision' },
  ];
  
  return allQuestions.slice(0, count).map((q, i) => ({
    id: i + 1,
    text: q.text,
    category: q.category,
    included: true
  }));
};

export default function App() {
  const [step, setStep] = useState('setup');
  const [config, setConfig] = useState({
    brandName: '',
    email: '',
    keyMessages: ['', '', '', '', ''],
    competitors: ['', '', ''],
    questionCount: 15,
    otherConsiderations: ''
  });
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
  const pollingRef = useRef(null);

  const toggleResponseExpand = (questionIndex, platform) => {
    const key = `${questionIndex}-${platform}`;
    setExpandedResponses(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchAllReports = async () => {
    try {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?sort%5B0%5D%5Bfield%5D=created_at&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=20`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } });
      const json = await res.json();
      if (json.records) {
        setAllReports(json.records.map(r => ({
          id: r.id,
          session_id: r.fields.session_id,
          brand_name: r.fields.brand_name,
          report_date: r.fields.report_date,
          visibility_score: r.fields.visibility_score,
          grade: r.fields.grade
        })));
      }
    } catch (e) {
      console.error('Error fetching reports:', e);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.config) setConfig(data.config);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (config.brandName) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ config }));
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [config]);

  const pollForResults = async (targetSessionId) => {
    try {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula={session_id}="${targetSessionId}"`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } });
      const json = await res.json();
      
      if (json.records && json.records.length > 0) {
        const r = json.records[0].fields;
        const data = parseReportData(r);
        setDashboardData(data);
        clearInterval(pollingRef.current);
        await fetchAllReports();
        setStep('complete');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Polling error:', e);
      return false;
    }
  };

  const parseReportData = (r) => {
    const platforms = JSON.parse(r.platforms_json || '{}');
    const questionBreakdown = JSON.parse(r.question_breakdown_json || '[]');
    const insights = JSON.parse(r.insights_json || '[]');
    const alerts = JSON.parse(r.alerts_json || '[]');
    
    // Calculate optimization metrics
    const platformValues = Object.values(platforms);
    const avgMention = platformValues.length ? platformValues.reduce((sum, p) => sum + (p.mention || 0), 0) / platformValues.length : 0;
    const avgRecommendation = platformValues.length ? platformValues.reduce((sum, p) => sum + (p.recommendation || 0), 0) / platformValues.length : 0;
    const avgSentiment = platformValues.length ? platformValues.reduce((sum, p) => sum + (p.sentiment || 0), 0) / platformValues.length : 0;
    
    // Optimization gaps
    const mentionRecommendationGap = avgMention - avgRecommendation;
    const platformConsistency = platformValues.length ? 100 - (Math.max(...platformValues.map(p => p.score || 0)) - Math.min(...platformValues.map(p => p.score || 0))) : 0;
    
    // Count critical issues
    const criticalAlerts = alerts.filter(a => a.type === 'critical').length;
    const zeroRecommendPlatforms = platformValues.filter(p => p.recommendation === 0).length;
    
    // Calculate Optimization Score (different from visibility score)
    // Factors: recommendation rate (40%), consistency (20%), sentiment (20%), mention-rec gap penalty (20%)
    const recommendationScore = avgRecommendation;
    const consistencyScore = platformConsistency;
    const sentimentScore = avgSentiment;
    const gapPenalty = Math.max(0, 100 - mentionRecommendationGap);
    
    const optimizationScore = Math.round(
      (recommendationScore * 0.4) + 
      (consistencyScore * 0.2) + 
      (sentimentScore * 0.2) + 
      (gapPenalty * 0.2)
    );
    
    // Optimization Grade (A-F based on optimization potential, not raw visibility)
    let optimizationGrade;
    if (optimizationScore >= 80 && zeroRecommendPlatforms === 0) optimizationGrade = 'A';
    else if (optimizationScore >= 65 && zeroRecommendPlatforms <= 1) optimizationGrade = 'B';
    else if (optimizationScore >= 50 && zeroRecommendPlatforms <= 2) optimizationGrade = 'C';
    else if (optimizationScore >= 35) optimizationGrade = 'D';
    else optimizationGrade = 'F';
    
    // Extract topic associations from responses
    const topicCounts = {};
    questionBreakdown.forEach(q => {
      Object.values(q.platforms || {}).forEach(p => {
        const text = (p.commentary || '') + ' ' + (p.response_summary || '');
        const topics = ['value', 'quality', 'price', 'innovation', 'reliability', 'speed', 'support', 'ease of use', 'features', 'integration', 'enterprise', 'small business'];
        topics.forEach(topic => {
          if (text.toLowerCase().includes(topic)) {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          }
        });
      });
    });
    const topicAssociations = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([topic, count]) => ({ topic, count, strength: Math.min(100, count * 20) }));
    
    // Generate executive summary
    const executiveSummary = {
      headline: avgRecommendation < 30 
        ? `${r.brand_name || 'Brand'} is recognized but rarely recommended by AI platforms`
        : avgRecommendation >= 70
        ? `${r.brand_name || 'Brand'} has strong AI visibility with consistent recommendations`
        : `${r.brand_name || 'Brand'} has moderate AI presence with optimization opportunities`,
      keyFindings: [
        {
          metric: 'Query Coverage',
          value: `${Math.round(avgMention)}%`,
          status: avgMention >= 80 ? 'strong' : avgMention >= 50 ? 'moderate' : 'weak',
          insight: avgMention >= 80 
            ? 'Brand is consistently mentioned across AI platforms'
            : `Brand is missing from ${Math.round(100 - avgMention)}% of relevant AI responses`
        },
        {
          metric: 'Recommendation Rate',
          value: `${Math.round(avgRecommendation)}%`,
          status: avgRecommendation >= 60 ? 'strong' : avgRecommendation >= 30 ? 'moderate' : 'weak',
          insight: avgRecommendation >= 60
            ? 'AI platforms actively recommend this brand'
            : `${Math.round(mentionRecommendationGap)}% gap between awareness and recommendation - major optimization opportunity`
        },
        {
          metric: 'Platform Consistency',
          value: `${Math.round(platformConsistency)}%`,
          status: platformConsistency >= 80 ? 'strong' : platformConsistency >= 60 ? 'moderate' : 'weak',
          insight: platformConsistency >= 80
            ? 'Consistent performance across all AI platforms'
            : 'Significant variance between platforms suggests targeting gaps'
        },
        {
          metric: 'Sentiment Score',
          value: `${Math.round(avgSentiment)}%`,
          status: avgSentiment >= 70 ? 'strong' : avgSentiment >= 50 ? 'moderate' : 'weak',
          insight: avgSentiment >= 70
            ? 'Positive brand perception in AI responses'
            : 'Mixed or neutral sentiment indicates messaging opportunities'
        }
      ],
      criticalGaps: zeroRecommendPlatforms > 0 
        ? `${zeroRecommendPlatforms} platform(s) never recommend the brand despite mentioning it`
        : null,
      topOpportunity: mentionRecommendationGap > 30
        ? 'Close the awareness-to-recommendation gap through optimized content'
        : platformConsistency < 70
        ? 'Improve consistency across platforms with unified content strategy'
        : 'Maintain and protect current strong positioning'
    };
    
    return {
      session_id: r.session_id || '',
      brand_name: r.brand_name || 'Unknown',
      brand_logo: r.brand_logo || '',
      report_date: r.report_date || new Date().toLocaleDateString(),
      deck_url: r.deck_url || '',
      visibility_score: r.visibility_score || 0,
      grade: r.grade || 'F',
      optimization_score: optimizationScore,
      optimization_grade: optimizationGrade,
      previous_score: r.previous_score || 0,
      best_model: r.best_model || '',
      worst_model: r.worst_model || '',
      platforms,
      share_of_voice: JSON.parse(r.share_of_voice_json || '{"brand":0,"competitors":[]}'),
      message_alignment: JSON.parse(r.message_alignment_json || '[]'),
      alerts,
      competitor_context: JSON.parse(r.competitor_context_json || '[]'),
      actions: JSON.parse(r.actions_json || '[]'),
      history: JSON.parse(r.history_json || '[]'),
      question_breakdown: questionBreakdown,
      insights,
      // New metrics
      avg_mention: avgMention,
      avg_recommendation: avgRecommendation,
      avg_sentiment: avgSentiment,
      mention_recommendation_gap: mentionRecommendationGap,
      platform_consistency: platformConsistency,
      topic_associations: topicAssociations,
      executive_summary: executiveSummary
    };
  };

  const loadReport = async (recordId) => {
    try {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${recordId}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } });
      const json = await res.json();
      if (json.fields) {
        setDashboardData(parseReportData(json.fields));
        setSelectedReportId(recordId);
        setShowReportDropdown(false);
      }
    } catch (e) {
      console.error('Error loading report:', e);
    }
  };

  useEffect(() => {
    if (step !== 'processing') return;
    
    const totalDuration = PROGRESS_STAGES.reduce((sum, s) => sum + s.duration, 0);
    let elapsed = 0;
    
    const interval = setInterval(() => {
      elapsed += 0.5;
      
      let accumulated = 0;
      for (let i = 0; i < PROGRESS_STAGES.length; i++) {
        accumulated += PROGRESS_STAGES[i].duration;
        if (elapsed <= accumulated) {
          setCurrentStage(i);
          const stageStart = accumulated - PROGRESS_STAGES[i].duration;
          const stageElapsed = elapsed - stageStart;
          setStageProgress((stageElapsed / PROGRESS_STAGES[i].duration) * 100);
          break;
        }
      }
      
      if (elapsed >= totalDuration) {
        setCurrentStage(PROGRESS_STAGES.length - 1);
        setStageProgress(100);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step === 'processing' && sessionId) {
      pollingRef.current = setInterval(() => pollForResults(sessionId), 8000);
      return () => clearInterval(pollingRef.current);
    }
  }, [step, sessionId]);

  const updateKeyMessage = (index, value) => {
    const updated = [...config.keyMessages];
    updated[index] = value;
    setConfig({ ...config, keyMessages: updated });
  };

  const updateCompetitor = (index, value) => {
    const updated = [...config.competitors];
    updated[index] = value;
    setConfig({ ...config, competitors: updated });
  };

  // Generate questions using Claude API
  const generateQuestions = async () => {
    setIsGenerating(true);
    setGenerateError('');
    
    try {
      const competitors = config.competitors.filter(c => c.trim());
      const keyMessages = config.keyMessages.filter(m => m.trim());
      const questions = await generateQuestionsWithClaude(config.brandName, competitors, keyMessages, config.questionCount);
      setGeneratedQuestions(questions);
      setStep('review');
    } catch (error) {
      console.error('Error generating questions:', error);
      setGenerateError('Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQuestion = (id) => {
    setGeneratedQuestions(questions => questions.map(q => q.id === id ? { ...q, included: !q.included } : q));
  };

  const startEditing = (question) => {
    setEditingId(question.id);
    setEditText(question.text);
  };

  const saveEdit = (id) => {
    setGeneratedQuestions(questions => questions.map(q => q.id === id ? { ...q, text: editText } : q));
    setEditingId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const addCustomQuestion = () => {
    const newId = Math.max(...generatedQuestions.map(q => q.id), 0) + 1;
    setGeneratedQuestions([...generatedQuestions, { id: newId, text: 'New custom question', category: 'Custom', included: true }]);
    setEditingId(newId);
    setEditText('New custom question');
  };

  const runTracker = async () => {
    const newSessionId = `SES_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15)}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setSessionId(newSessionId);
    setStep('processing');
    setCurrentStage(0);
    setStageProgress(0);

    const activeQuestions = generatedQuestions.filter(q => q.included);

    const payload = {
      session_id: newSessionId,
      email: config.email,
      brand_name: config.brandName,
      key_messages: config.keyMessages.filter(m => m.trim()).join(','),
      competitors: config.competitors.filter(c => c.trim()).join(','),
      question_count: activeQuestions.length,
      questions: activeQuestions.map(q => ({ text: q.text, category: q.category })),
      timestamp: new Date().toISOString()
    };

    try {
      await fetch(ZAPIER_WEBHOOK_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (error) {
      console.error('Error running tracker:', error);
    }
  };

  const activeQuestionCount = generatedQuestions.filter(q => q.included).length;
  const blockedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'ymail.com', 'live.com', 'msn.com'];
  const isValidCorporateEmail = (email) => {
    if (!email || !email.includes('@')) return false;
    const domain = email.split('@')[1]?.toLowerCase();
    return domain && !blockedDomains.includes(domain);
  };
  const isConfigValid = config.brandName.trim() && config.keyMessages.some(m => m.trim()) && isValidCorporateEmail(config.email);

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <ArrowUpRight className="w-4 h-4 text-emerald-400" />;
    if (trend === 'down') return <ArrowDownRight className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-white/30" />;
  };

  const getScoreChange = () => {
    if (!dashboardData || MOCK_HISTORY.length < 2) return 0;
    return (dashboardData.visibility_score - MOCK_HISTORY[MOCK_HISTORY.length - 2].score).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-[#08080c] text-white antialiased">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[100px]" />
      </div>
      
      <header className="relative border-b border-white/[0.06] bg-[#08080c]/90 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <img src={FUTUREPROOF_LOGO} alt="FutureProof" className="h-8" />
              {(step === 'dashboard' || step === 'complete') && (
                <nav className="flex items-center gap-1">
                  <button onClick={() => setStep('setup')} className="px-4 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all">New Analysis</button>
                  <button onClick={() => { fetchAllReports(); setStep('dashboard'); }} className="px-4 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all">Dashboard</button>
                </nav>
              )}
            </div>
            <div className="flex items-center gap-4">
              {saved && (
                <span className="text-xs text-white/30 flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle className="w-3 h-3" /> Auto-saved
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-8 py-16">
        
        {/* SETUP STEP */}
        {step === 'setup' && (
          <div className="max-w-3xl mx-auto space-y-16 animate-fadeIn">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">AI-Powered Brand Intelligence</span>
              </div>
              
              <h1 className="text-6xl font-bold tracking-tight leading-[1.1]">
                <span className="text-white">Measure your </span>
                <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">AI Visibility</span>
              </h1>
              
              <p className="text-xl text-white/40 max-w-xl mx-auto leading-relaxed">
                Discover how the world's leading AI assistants perceive, position, and recommend your brand.
              </p>
              
              <div className="flex items-center justify-center gap-4 pt-4">
                {Object.entries(platformLogos).map(([name, url], i) => (
                  <div 
                    key={name} 
                    className="group relative w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:border-orange-500/30 hover:bg-white/[0.05] transition-all duration-300"
                  >
                    <img src={url} alt={name} className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
                    <div className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-white/40">{platformNames[name]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Brand to Analyze</h3>
                    <p className="text-sm text-white/40 mt-0.5">Enter the brand name exactly as you want AI to recognize it</p>
                  </div>
                </div>
                <input
                  type="text"
                  value={config.brandName}
                  onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
                  placeholder="e.g., Xbox Game Pass, Nike, Salesforce"
                  className="w-full px-6 py-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white text-lg placeholder-white/20 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.05] transition-all"
                />
              </div>

              {/* Email Field */}
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Your Email</h3>
                    <p className="text-sm text-white/40 mt-0.5">Corporate email addresses only</p>
                  </div>
                </div>
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  placeholder="you@company.com"
                  className={`w-full px-6 py-5 bg-white/[0.03] border rounded-2xl text-white text-lg placeholder-white/20 focus:outline-none focus:bg-white/[0.05] transition-all ${
                    config.email && !isValidCorporateEmail(config.email) 
                      ? 'border-red-500/50 focus:border-red-500/50' 
                      : 'border-white/[0.08] focus:border-orange-500/40'
                  }`}
                />
                {config.email && !isValidCorporateEmail(config.email) && (
                  <p className="text-red-400 text-sm mt-3">Please use a corporate email address</p>
                )}
              </div>

              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Key Brand Messages</h3>
                    <p className="text-sm text-white/40 mt-0.5">What do you want AI to communicate about your brand?</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {config.keyMessages.slice(0, 3).map((msg, i) => (
                    <div key={i} className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center text-xs text-white/40">{i + 1}</span>
                      <input
                        type="text"
                        value={msg}
                        onChange={(e) => updateKeyMessage(i, e.target.value)}
                        placeholder={`Key message ${i + 1}`}
                        className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.05] transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
                  <h3 className="text-lg font-semibold mb-2">Competitors</h3>
                  <p className="text-sm text-white/40 mb-6">Who should we compare against?</p>
                  <div className="space-y-3">
                    {config.competitors.map((comp, i) => (
                      <input
                        key={i}
                        type="text"
                        value={comp}
                        onChange={(e) => updateCompetitor(i, e.target.value)}
                        placeholder={`Competitor ${i + 1}`}
                        className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.05] transition-all text-sm"
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
                  <h3 className="text-lg font-semibold mb-2"># of Category Queries</h3>
                  <p className="text-sm text-white/40 mb-6">More queries = deeper organic visibility analysis</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[10, 15, 20].map(num => (
                      <button
                        key={num}
                        onClick={() => setConfig({ ...config, questionCount: num })}
                        className={`relative py-5 rounded-2xl font-semibold text-lg transition-all ${
                          config.questionCount === num
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25'
                            : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.06] border border-white/[0.08]'
                        }`}
                      >
                        {num}
                        {config.questionCount === num && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-orange-500" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {generateError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-red-400">{generateError}</p>
              </div>
            )}

            <button
              onClick={generateQuestions}
              disabled={!isConfigValid || isGenerating}
              className={`group w-full flex items-center justify-center gap-4 px-8 py-6 rounded-2xl font-semibold text-lg transition-all ${
                isConfigValid && !isGenerating
                  ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.01]'
                  : 'bg-white/[0.05] text-white/30 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> 
                  <span>Generating questions...</span>
                </>
              ) : (
                <>
                  <span>Generate Questions</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}

        {/* REVIEW STEP */}
        {step === 'review' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-white/40 mb-2">Step 2 of 3</p>
                <h2 className="text-4xl font-bold">Review Category Queries</h2>
                <p className="text-white/40 mt-2">These buyer-journey questions measure organic visibility (no brand names)</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">{activeQuestionCount}</div>
                <div className="text-sm text-white/40 mt-1">category queries</div>
              </div>
            </div>

            <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-3xl border border-white/[0.06] overflow-hidden">
              <div className="divide-y divide-white/[0.04]">
                {generatedQuestions.map((q, i) => (
                  <div key={q.id} className={`p-6 transition-all ${!q.included ? 'opacity-40 bg-white/[0.01]' : 'hover:bg-white/[0.02]'}`}>
                    {editingId === q.id ? (
                      <div className="flex items-start gap-4">
                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</span>
                        <div className="flex-1">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-5 py-4 bg-white/[0.05] border border-orange-500/40 rounded-xl text-white focus:outline-none resize-none text-lg"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-3 mt-4">
                            <button onClick={() => saveEdit(q.id)} disabled={!editText.trim()} className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl text-sm font-medium disabled:opacity-50">Save Changes</button>
                            <button onClick={cancelEdit} className="px-5 py-2.5 bg-white/10 rounded-xl text-sm hover:bg-white/15">Cancel</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${q.included ? 'bg-white/[0.08] text-white/70' : 'bg-white/[0.03] text-white/30'}`}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-lg ${q.included ? 'text-white/90' : 'text-white/40'}`}>{q.text}</p>
                          <span className={`inline-block mt-3 px-3 py-1 rounded-lg text-xs font-medium ${q.included ? 'bg-orange-500/10 text-orange-400' : 'bg-white/[0.03] text-white/30'}`}>{q.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEditing(q)} className="p-3 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => toggleQuestion(q.id)} className={`p-3 rounded-xl transition-all ${q.included ? 'text-white/40 hover:text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}>
                            {q.included ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addCustomQuestion} className="w-full py-5 text-white/40 hover:text-orange-400 hover:bg-white/[0.03] transition-all flex items-center justify-center gap-2 border-t border-white/[0.04]">
                <Plus className="w-4 h-4" /> Add custom question
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {Object.entries(platformLogos).map(([name, url]) => (
                <div key={name} className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-2xl p-6 border border-white/[0.06] text-center">
                  <img src={url} alt={name} className="w-10 h-10 object-contain mx-auto mb-3" />
                  <div className="text-sm text-white/60">{platformNames[name]}</div>
                  <div className="text-xs text-white/30 mt-1">{activeQuestionCount} queries</div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep('setup')} className="px-6 py-4 text-white/50 hover:text-white transition-all flex items-center gap-2">
                <ChevronRight className="w-4 h-4 rotate-180" /> Back
              </button>
              <button
                onClick={runTracker}
                disabled={activeQuestionCount === 0}
                className={`group flex items-center gap-4 px-10 py-5 rounded-2xl font-semibold text-lg transition-all ${
                  activeQuestionCount > 0
                    ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.01]'
                    : 'bg-white/[0.05] text-white/30 cursor-not-allowed'
                }`}
              >
                <Zap className="w-5 h-5" /> 
                <span>Run Analysis</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* PROCESSING STEP */}
        {step === 'processing' && (
          <div className="max-w-2xl mx-auto space-y-12 animate-fadeIn">
            <div className="relative flex items-center justify-center py-12">
              <div className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-orange-500/30 to-pink-500/30 blur-[80px] animate-pulse" />
              <div className="absolute w-48 h-48 rounded-full bg-gradient-to-r from-orange-500/20 to-pink-500/20 blur-[40px] animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-orange-500/40">
                <Loader2 className="w-14 h-14 text-white animate-spin" />
              </div>
            </div>

            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold">{PROGRESS_STAGES[currentStage]?.label || 'Finalizing...'}</h2>
              <p className="text-white/40">Analyzing <span className="text-white font-medium">{config.brandName}</span> across AI platforms</p>
            </div>

            <div className="space-y-2">
              {PROGRESS_STAGES.map((stage, i) => (
                <div 
                  key={stage.id} 
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 ${
                    i < currentStage 
                      ? 'bg-white/[0.03]' 
                      : i === currentStage 
                        ? 'bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20' 
                        : 'opacity-30'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    i < currentStage 
                      ? 'bg-gradient-to-br from-orange-500 to-pink-500' 
                      : i === currentStage 
                        ? 'bg-white/10' 
                        : 'bg-white/[0.03]'
                  }`}>
                    {i < currentStage ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : stage.icon ? (
                      <img src={platformLogos[stage.icon]} alt="" className="w-6 h-6 object-contain" />
                    ) : (
                      <BarChart3 className="w-5 h-5 text-white/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{stage.label}</div>
                    {i === currentStage && (
                      <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-300 rounded-full" style={{ width: `${stageProgress}%` }} />
                      </div>
                    )}
                  </div>
                  {i < currentStage && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
              ))}
            </div>

            <p className="text-center text-white/30 text-sm">This typically takes 2-3 minutes</p>
          </div>
        )}

        {/* COMPLETE STEP */}
        {step === 'complete' && dashboardData && (
          <div className="max-w-2xl mx-auto space-y-10 animate-fadeIn">
            <div className="relative flex items-center justify-center py-12">
              <div className="absolute w-64 h-64 rounded-full bg-emerald-500/20 blur-[80px]" />
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
            </div>

            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">Analysis Complete</h2>
              <p className="text-xl text-white/40">Your AI visibility report for <span className="text-white font-medium">{dashboardData.brand_name}</span> is ready</p>
            </div>

            <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-3xl p-10 border border-white/[0.08] text-center">
              <div className="text-sm text-white/40 uppercase tracking-wider mb-4">AI Visibility Score</div>
              <div className="flex items-center justify-center gap-6">
                <span className="text-8xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">{dashboardData.visibility_score}</span>
                <div className={`text-5xl font-bold px-4 py-2 rounded-xl ${gradeColors[dashboardData.grade]?.bg} ${gradeColors[dashboardData.grade]?.text}`}>{dashboardData.grade}</div>
              </div>
              <div className="flex items-center justify-center gap-8 mt-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-emerald-400" /></div>
                  <span className="text-white/50">Best:</span>
                  <span className="text-white font-medium">{dashboardData.best_model}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"><AlertCircle className="w-4 h-4 text-amber-400" /></div>
                  <span className="text-white/50">Needs work:</span>
                  <span className="text-white font-medium">{dashboardData.worst_model}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => { fetchAllReports(); setStep('dashboard'); }}
              className="group w-full flex items-center justify-center gap-4 px-8 py-6 rounded-2xl font-semibold text-lg bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.01] transition-all"
            >
              <Eye className="w-5 h-5" /> 
              <span>View Full Dashboard</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button onClick={() => { setStep('setup'); setGeneratedQuestions([]); setDashboardData(null); setSessionId(null); }} className="w-full py-4 text-white/40 hover:text-white transition-all">
              Run Another Analysis
            </button>
          </div>
        )}

        {/* DASHBOARD STEP */}
        {step === 'dashboard' && dashboardData && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{dashboardData.brand_name}</h1>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${gradeColors[dashboardData.optimization_grade || dashboardData.grade]?.bg} ${gradeColors[dashboardData.optimization_grade || dashboardData.grade]?.text}`}>
                    Optimization Grade {dashboardData.optimization_grade || dashboardData.grade}
                  </span>
                </div>
                <p className="text-white/40">AI Visibility Report • {dashboardData.report_date}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button 
                    onClick={() => { fetchAllReports(); setShowReportDropdown(!showReportDropdown); }}
                    className="flex items-center gap-2 px-5 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm hover:bg-white/[0.08] transition-all"
                  >
                    <Calendar className="w-4 h-4 text-white/50" />
                    <span>View Past Reports</span>
                    <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${showReportDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showReportDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-[#12121a] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                      <div className="p-3 border-b border-white/[0.06]">
                        <div className="text-xs text-white/40 uppercase tracking-wider">Recent Reports</div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {allReports.map(report => (
                          <button
                            key={report.id}
                            onClick={() => loadReport(report.id)}
                            className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.05] transition-all ${selectedReportId === report.id ? 'bg-orange-500/10' : ''}`}
                          >
                            <div className="text-left">
                              <div className="font-medium text-sm">{report.brand_name}</div>
                              <div className="text-xs text-white/40">{report.report_date}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold">{report.visibility_score}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${gradeColors[report.grade]?.bg} ${gradeColors[report.grade]?.text}`}>{report.grade}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => dashboardData.deck_url && window.open(dashboardData.deck_url, '_blank')}
                  disabled={!dashboardData.deck_url}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                    dashboardData.deck_url 
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg hover:shadow-orange-500/25' 
                      : 'bg-white/[0.05] text-white/30 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>Download Deck</span>
                </button>
              </div>
            </div>

            {/* EXECUTIVE SUMMARY */}
            {dashboardData.executive_summary && (
              <div className="bg-gradient-to-br from-orange-500/5 via-transparent to-pink-500/5 rounded-3xl p-8 border border-orange-500/20">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-2">Executive Summary</h2>
                    <p className="text-lg text-white/70 leading-relaxed mb-6">{dashboardData.executive_summary.headline}</p>
                    
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      {dashboardData.executive_summary.keyFindings.map((finding, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${
                          finding.status === 'strong' ? 'bg-emerald-500/10 border-emerald-500/20' :
                          finding.status === 'moderate' ? 'bg-amber-500/10 border-amber-500/20' :
                          'bg-red-500/10 border-red-500/20'
                        }`}>
                          <div className="text-xs text-white/40 uppercase tracking-wider mb-1">{finding.metric}</div>
                          <div className={`text-2xl font-bold mb-2 ${
                            finding.status === 'strong' ? 'text-emerald-400' :
                            finding.status === 'moderate' ? 'text-amber-400' :
                            'text-red-400'
                          }`}>{finding.value}</div>
                          <p className="text-xs text-white/50 leading-relaxed">{finding.insight}</p>
                        </div>
                      ))}
                    </div>

                    {dashboardData.executive_summary.criticalGaps && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-bold text-red-400 uppercase">Critical Gap</span>
                        </div>
                        <p className="text-sm text-white/70">{dashboardData.executive_summary.criticalGaps}</p>
                      </div>
                    )}

                    <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-bold text-orange-400 uppercase">Top Optimization Opportunity</span>
                      </div>
                      <p className="text-sm text-white/70">{dashboardData.executive_summary.topOpportunity}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Score Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-orange-500/10 via-transparent to-pink-500/10 rounded-2xl p-6 border border-orange-500/20">
                <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Visibility Score</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">{dashboardData.visibility_score}</div>
                <div className="text-xs text-white/40 mt-2">Raw AI presence</div>
              </div>
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-2xl p-6 border border-white/[0.06]">
                <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Query Coverage</div>
                <div className="text-4xl font-bold">{Math.round(dashboardData.avg_mention || 0)}%</div>
                <div className="text-xs text-white/40 mt-2">Mentioned in AI responses</div>
              </div>
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-2xl p-6 border border-white/[0.06]">
                <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Recommendation Rate</div>
                <div className={`text-4xl font-bold ${(dashboardData.avg_recommendation || 0) < 30 ? 'text-red-400' : (dashboardData.avg_recommendation || 0) >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {Math.round(dashboardData.avg_recommendation || 0)}%
                </div>
                <div className="text-xs text-white/40 mt-2">Actively recommended</div>
              </div>
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-2xl p-6 border border-white/[0.06]">
                <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Awareness→Rec Gap</div>
                <div className={`text-4xl font-bold ${(dashboardData.mention_recommendation_gap || 0) > 30 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {Math.round(dashboardData.mention_recommendation_gap || 0)}%
                </div>
                <div className="text-xs text-white/40 mt-2">Optimization potential</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {Object.entries(dashboardData.platforms).map(([platform, data]) => (
                <div key={platform} className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-2xl p-6 border border-white/[0.06] hover:border-white/[0.12] transition-all">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                        <img src={platformLogos[platform]} alt={platform} className="w-6 h-6 object-contain" />
                      </div>
                      <span className="font-semibold">{platformNames[platform]}</span>
                    </div>
                    {getTrendIcon(data.trend)}
                  </div>
                  <div className="text-4xl font-bold mb-5">{data.score}</div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">Mention Rate</span>
                      <span className="font-medium">{data.mention}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">Sentiment</span>
                      <span className="font-medium">{data.sentiment}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">Recommend</span>
                      <span className={`font-medium ${data.recommendation === 0 ? 'text-red-400' : data.recommendation >= 70 ? 'text-emerald-400' : ''}`}>{data.recommendation}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Priority Alerts</h3>
                    <p className="text-sm text-white/40">{dashboardData.alerts.length} items need attention</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {dashboardData.alerts.map((alert, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${
                      alert.type === 'critical' ? 'bg-red-500/10 border-red-500/20' :
                      alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                      'bg-emerald-500/10 border-emerald-500/20'
                    }`}>
                      <div className="flex items-start gap-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          alert.type === 'critical' ? 'bg-red-500/20 text-red-400' :
                          alert.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>{alert.type}</span>
                        <span className="text-sm text-white/80 leading-relaxed">{alert.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Recommended Actions</h3>
                    <p className="text-sm text-white/40">Prioritized by impact</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {dashboardData.actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        action.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        action.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-white/10 text-white/50'
                      }`}>{i + 1}</span>
                      <div>
                        <div className="font-medium text-white/90">{action.action}</div>
                        <div className="text-sm text-white/40 mt-1">{action.impact}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
                <h3 className="text-lg font-semibold mb-6">Share of Voice in AI Responses</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{dashboardData.brand_name}</span>
                        <span className="text-orange-400 font-bold">{dashboardData.share_of_voice.brand}%</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full" style={{ width: `${dashboardData.share_of_voice.brand}%` }} />
                      </div>
                    </div>
                  </div>
                  {dashboardData.share_of_voice.competitors.map((c, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/60">{c.name}</span>
                          <span className="text-white/40">{c.share}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-white/30 rounded-full" style={{ width: `${c.share}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
                <h3 className="text-lg font-semibold mb-6">Competitor Intelligence</h3>
                <div className="space-y-4">
                  {dashboardData.competitor_context.length > 0 ? dashboardData.competitor_context.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl">
                      <div>
                        <div className="font-medium">{c.competitor}</div>
                        <div className="text-sm text-white/40 mt-1">{c.context}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{c.mentions}</div>
                        <div className="text-xs text-white/40">mentions</div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-white/40">No competitor data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Key Insights */}
            {dashboardData.insights && dashboardData.insights.length > 0 && (
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Key Insights</h3>
                    <p className="text-sm text-white/40">Patterns detected across AI platforms</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {dashboardData.insights.map((insight, i) => (
                    <div key={i} className={`p-5 rounded-xl border ${
                      insight.type === 'gap' ? 'bg-amber-500/10 border-amber-500/20' :
                      insight.type === 'strength' ? 'bg-emerald-500/10 border-emerald-500/20' :
                      'bg-white/[0.03] border-white/[0.06]'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        insight.type === 'gap' ? 'bg-amber-500/20 text-amber-400' :
                        insight.type === 'strength' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-white/10 text-white/50'
                      }`}>{insight.type}</span>
                      <p className="text-sm text-white/80 mt-3 leading-relaxed">{insight.insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Topic Associations */}
            {dashboardData.topic_associations && dashboardData.topic_associations.length > 0 && (
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Topic & Context Associations</h3>
                    <p className="text-sm text-white/40">Themes AI most frequently associates with your brand</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {dashboardData.topic_associations.map((topic, i) => (
                    <div key={i} className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{topic.topic}</span>
                        <span className="text-xs text-white/40">{topic.count} mentions</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all"
                          style={{ width: `${topic.strength}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Question-by-Question Breakdown */}
            {dashboardData.question_breakdown && dashboardData.question_breakdown.length > 0 && (
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] rounded-3xl p-8 border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Question-by-Question Analysis</h3>
                    <p className="text-sm text-white/40">How each AI platform responded to your tracked questions</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {dashboardData.question_breakdown.map((q, qIndex) => (
                    <div key={qIndex} className="border border-white/[0.06] rounded-2xl overflow-hidden">
                      {/* Question Header */}
                      <div className="bg-white/[0.03] px-6 py-4 flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-sm font-bold shrink-0">{q.question_number}</span>
                          <div>
                            <p className="font-medium text-white/90">{q.question_text}</p>
                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs bg-white/10 text-white/50">{q.category}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-white/40">Best:</span>
                            <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-medium">{q.best_platform}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white/40">Worst:</span>
                            <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 font-medium">{q.worst_platform}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Platform Responses */}
                      <div className="divide-y divide-white/[0.04]">
                        {Object.entries(q.platforms).map(([platform, data]) => {
                          const isExpanded = expandedResponses[`${qIndex}-${platform}`];
                          return (
                            <div key={platform} className={`px-6 py-5 ${platform === q.best_platform ? 'bg-emerald-500/5' : platform === q.worst_platform ? 'bg-red-500/5' : ''}`}>
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                                  <img src={platformLogos[platform]} alt={platform} className="w-6 h-6 object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="font-medium">{platformNames[platform]}</span>
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-xs">
                                          <span className="text-white/40">Score</span>
                                          <span className={`font-bold ${data.overall >= 80 ? 'text-emerald-400' : data.overall >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{data.overall}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs">
                                          <span className="text-white/40">Mention</span>
                                          <span className="font-medium">{data.mention}%</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs">
                                          <span className="text-white/40">Sentiment</span>
                                          <span className="font-medium">{data.sentiment}%</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs">
                                          <span className="text-white/40">Rec</span>
                                          <span className={`font-medium ${data.recommendation >= 70 ? 'text-emerald-400' : data.recommendation === 0 ? 'text-red-400' : ''}`}>{data.recommendation}%</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Expandable Response */}
                                  {data.full_response && (
                                    <div className="mb-3">
                                      <button
                                        onClick={() => toggleResponseExpand(qIndex, platform)}
                                        className="w-full text-left"
                                      >
                                        <div className={`bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] hover:border-white/[0.12] transition-all ${isExpanded ? 'border-orange-500/30' : ''}`}>
                                          <div className="flex items-start justify-between gap-4">
                                            <p className={`text-sm text-white/60 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                                              {isExpanded ? data.full_response : data.response_summary}
                                            </p>
                                            <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                          </div>
                                          {!isExpanded && data.full_response && data.full_response.length > 200 && (
                                            <span className="text-xs text-orange-400 mt-2 inline-block">Click to expand full response</span>
                                          )}
                                        </div>
                                      </button>
                                    </div>
                                  )}
                                  
                                  {/* Commentary */}
                                  {data.commentary && (
                                    <div className="flex items-start gap-2 p-3 bg-orange-500/5 rounded-lg border border-orange-500/10">
                                      <Sparkles className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
                                      <div>
                                        <span className="text-xs text-orange-400 font-medium">AI Analysis:</span>
                                        <p className="text-xs text-white/60 leading-relaxed mt-1">{data.commentary}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Competitors Mentioned */}
                                  {data.competitors_mentioned && (
                                    <div className="flex items-center gap-2 mt-3">
                                      <span className="text-xs text-white/30">Competitors mentioned:</span>
                                      <div className="flex gap-1">
                                        {data.competitors_mentioned.split(',').map((comp, i) => (
                                          <span key={i} className="text-xs px-2 py-0.5 bg-white/[0.05] rounded text-white/50">{comp.trim()}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center pt-8">
              <button
                onClick={() => { setStep('setup'); setGeneratedQuestions([]); setDashboardData(null); setSessionId(null); }}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
              >
                <RefreshCw className="w-5 h-5" /> Run New Analysis
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="relative border-t border-white/[0.04] mt-16">
        <div className="max-w-6xl mx-auto px-8 py-8 flex items-center justify-between">
          <img src={FUTUREPROOF_LOGO} alt="FutureProof" className="h-6 opacity-40" />
          <div className="text-sm text-white/30">AI Visibility Intelligence Platform</div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
      `}</style>
    </div>
  );
}
