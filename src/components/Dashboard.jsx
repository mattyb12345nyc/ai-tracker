import React, { useState, useEffect, useRef } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Globe, Link, ArrowRight, Loader2, CheckCircle, Check, Calendar,
  BarChart3, TrendingUp, FileText, Zap, Settings, CreditCard,
  ChevronRight, Play, Clock, Target, Sparkles, AlertCircle, X, Pencil
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const FUTUREPROOF_LOGO = 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/d19d829c-a9a9-4fad-b0e7-7938012be26c/800x200.png';
const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN || '';
const AIRTABLE_BASE_ID = 'appgSZR92pGCMlUOc';
const AIRTABLE_DASHBOARD_TABLE_ID = 'tblheMjYJzu1f88Ft';

const frequencyOptions = [
  { value: 'weekly', label: 'Weekly', description: 'Track changes every 7 days' },
  { value: 'biweekly', label: 'Bi-weekly', description: 'Track changes every 14 days' },
  { value: 'monthly', label: 'Monthly', description: 'Track changes every 30 days' },
];

function getFrequencyLabel(frequency) {
  return frequencyOptions.find(o => o.value === frequency)?.label || (frequency ? String(frequency).charAt(0).toUpperCase() + String(frequency).slice(1) : '');
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const checkoutSuccess = searchParams.get('checkout') === 'success';
  const reportParam = searchParams.get('report');
  const reportCardRef = useRef(null);

  // Setup wizard state
  const [setupStep, setSetupStep] = useState('brand'); // brand, frequency, ready
  const [brandUrl, setBrandUrl] = useState('');
  const [brandData, setBrandData] = useState(null);
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);
  const [frequency, setFrequency] = useState('weekly');
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Dashboard state
  const [reports, setReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [error, setError] = useState('');

  // Run Tracker Study modal: review tracked questions before running
  const [showRunStudyModal, setShowRunStudyModal] = useState(false);
  const [trackedQuestionsForRun, setTrackedQuestionsForRun] = useState([]);
  const [isLoadingTrackedQuestions, setIsLoadingTrackedQuestions] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editQuestionText, setEditQuestionText] = useState('');

  // Get subscription from Clerk user metadata (must have status + questionLot for "active")
  const subscription = user?.publicMetadata?.subscription;
  const hasActiveSubscription =
    (subscription?.status === 'active' || subscription?.status === 'trialing') &&
    (subscription?.questionLot ?? 0) > 0;

  // Question allotment from subscription or default free tier; only paid runs count against it.
  const questionAllotment = hasActiveSubscription ? subscription.questionLot : 5; // Free tier: 5 questions
  const questionsUsed = reports
    .filter((r) => r.is_trial !== true)
    .reduce((sum, r) => sum + (r.question_count ?? 5), 0);
  const questionsRemaining = Math.max(0, questionAllotment - questionsUsed);

  // Only show paid reports (exclude trial) in list and chart — trial reports used different questions
  const paidOnlyReports = reports.filter((r) => r.is_trial !== true);

  // Load user's reports from Airtable (filtered by current user's Clerk ID)
  useEffect(() => {
    if (user?.id) {
      loadUserReports();
      checkSetupStatus();
    }
  }, [user?.id]);

  // After checkout success: redirect to paid onboarding (don't show trial/dashboard)
  useEffect(() => {
    if (checkoutSuccess) {
      navigate('/onboarding/paid?checkout=success', { replace: true });
    }
  }, [checkoutSuccess, navigate]);

  // Paid user with no reports yet: redirect to paid onboarding (setup required)
  // Skip redirect if user just completed onboarding (so they land on dashboard, not loop back)
  useEffect(() => {
    const justCompleted = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('onboarding_just_completed');
    if (justCompleted) sessionStorage.removeItem('onboarding_just_completed');
    if (!isLoadingReports && hasActiveSubscription && reports.length === 0 && !justCompleted) {
      navigate('/onboarding/paid', { replace: true });
    }
  }, [isLoadingReports, hasActiveSubscription, reports.length, navigate]);

  // When ?report= is present, scroll to and highlight that report card
  useEffect(() => {
    if (!reportParam || reports.length === 0) return;
    const timer = setTimeout(() => {
      reportCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    return () => clearTimeout(timer);
  }, [reportParam, reports]);

  const checkSetupStatus = () => {
    // Check localStorage for setup status
    const savedSetup = localStorage.getItem(`dashboard-setup-${user?.id}`);
    if (savedSetup) {
      const setup = JSON.parse(savedSetup);
      setBrandUrl(setup.brandUrl || '');
      setBrandData(setup.brandData || null);
      setFrequency(setup.frequency || 'weekly');
      setIsSetupComplete(true);
    }
  };

  const loadUserReports = async () => {
    setIsLoadingReports(true);
    try {
      const clerkUserId = user?.id;
      if (!clerkUserId) return;

      // Only fetch reports that belong to the current user (clerk_user_id)
      const formula = `{clerk_user_id}="${String(clerkUserId).replace(/"/g, '\\"')}"`;
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DASHBOARD_TABLE_ID}?filterByFormula=${encodeURIComponent(formula)}&sort%5B0%5D%5Bfield%5D=report_date&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=20`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
      });
      const json = await res.json();

      if (json.records) {
        const formattedReports = json.records.map(record => ({
          id: record.id,
          session_id: record.fields.session_id,
          brand_name: record.fields.brand_name,
          report_date: record.fields.report_date,
          visibility_score: parseFloat(record.fields.visibility_score) || 0,
          brand_logo: record.fields.brand_logo || '',
          is_trial: record.fields.is_trial === true,
          question_count: record.fields.question_count != null ? Number(record.fields.question_count) : undefined,
        }));
        setReports(formattedReports);

        // If user has reports, mark setup as complete
        if (formattedReports.length > 0 && !isSetupComplete) {
          const latestReport = formattedReports[0];
          setBrandData({ brand_name: latestReport.brand_name });
          setIsSetupComplete(true);
        }
      }
    } catch (err) {
      console.error('Error loading reports:', err);
    }
    setIsLoadingReports(false);
  };

  const normalizeUrl = (input) => {
    let normalized = input.trim().toLowerCase();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    return normalized;
  };

  const analyzeBrandUrl = async () => {
    if (!brandUrl.trim()) return;
    setIsAnalyzingBrand(true);
    setError('');

    try {
      const response = await fetch('/.netlify/functions/analyze-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizeUrl(brandUrl) })
      });

      if (!response.ok) throw new Error('Failed to analyze brand');
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      setBrandData(data.brandData);
      setSetupStep('frequency');
    } catch (err) {
      setError('Failed to analyze URL. Please check the URL and try again.');
      console.error(err);
    }
    setIsAnalyzingBrand(false);
  };

  const completeSetup = () => {
    // Save setup to localStorage
    localStorage.setItem(`dashboard-setup-${user?.id}`, JSON.stringify({
      brandUrl,
      brandData,
      frequency,
      completedAt: new Date().toISOString()
    }));
    setIsSetupComplete(true);
  };

  const openRunStudyModal = async () => {
    console.log('[Dashboard] Run Tracker Study clicked');
    setError('');
    setShowRunStudyModal(true);
    if (!user?.id) return;
    setIsLoadingTrackedQuestions(true);
    try {
      const res = await fetch('/.netlify/functions/get-tracked-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkUserId: user.id })
      });
      const data = await res.json().catch(() => ({}));
      console.log('[Dashboard] get-tracked-questions response:', { status: res.status, ok: res.ok, data });
      if (!res.ok) throw new Error(data.error || 'Failed to load tracked questions');
      const list = (data.questions || []).map((q) => ({ ...q, included: true }));
      setTrackedQuestionsForRun(list);
    } catch (err) {
      console.error('[Dashboard] get-tracked-questions error:', err);
      setError(err.message || 'Failed to load tracked questions.');
      setTrackedQuestionsForRun([]);
    }
    setIsLoadingTrackedQuestions(false);
  };

  const runAnalysisWithQuestions = async (questionItems) => {
    const activeQuestions = questionItems.filter((q) => q.included);
    const questionTexts = activeQuestions.map((q) => (q.editedText !== undefined ? q.editedText : q.question_text)).filter(Boolean);
    if (!brandData || questionTexts.length === 0) {
      console.warn('[Dashboard] runAnalysisWithQuestions: missing brandData or no questions', { hasBrandData: !!brandData, count: questionTexts.length });
      setError('Select at least one question and ensure brand is set.');
      return;
    }
    console.log('[Dashboard] runAnalysisWithQuestions: starting', { brandName: brandData.brand_name, questionCount: questionTexts.length });
    setIsRunningAnalysis(true);
    setError('');
    setShowRunStudyModal(false);

    try {
      const sessionId = `SES_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const runId = `RUN_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const payload = {
        session_id: sessionId,
        run_id: runId,
        brand_name: brandData.brand_name,
        brand_url: normalizeUrl(brandUrl),
        logo_url: brandData.logo_url || '',
        brand_assets: brandData.brand_assets || {},
        email: user?.primaryEmailAddress?.emailAddress || '',
        clerk_user_id: user?.id || '',
        is_trial: false,
        industry: brandData.industry,
        category: brandData.category,
        key_messages: brandData.key_benefits,
        competitors: brandData.competitors,
        questions: questionTexts.map((text) => ({ text, category: 'Custom' })),
        question_count: questionTexts.length,
        timestamp: new Date().toISOString()
      };
      console.log('[Dashboard] process-analysis-background payload (no questions list):', { ...payload, questions: payload.questions?.length });

      const analysisRes = await fetch('/.netlify/functions/process-analysis-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseText = await analysisRes.text();
      console.log('[Dashboard] process-analysis-background response:', { status: analysisRes.status, body: responseText.slice(0, 200) });

      if (!analysisRes.ok) throw new Error(responseText || 'Failed to start analysis');

      navigate(`/?report=${sessionId}`);
    } catch (err) {
      console.error('[Dashboard] runAnalysisWithQuestions error:', err);
      setError(err.message || 'Failed to run analysis. Please try again.');
    }
    setIsRunningAnalysis(false);
  };

  const runAnalysis = async () => {
    if (!brandData) return;
    setIsRunningAnalysis(true);

    try {
      // Generate questions first
      const questionsRes = await fetch('/.netlify/functions/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandData, questionCount: 5 })
      });

      if (!questionsRes.ok) throw new Error('Failed to generate questions');
      const questionsData = await questionsRes.json();

      // Create session and run analysis
      const sessionId = `SES_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const runId = `RUN_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const analysisRes = await fetch('/.netlify/functions/process-analysis-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          run_id: runId,
          brand_name: brandData.brand_name,
          brand_url: normalizeUrl(brandUrl),
          logo_url: brandData.logo_url || '',
          brand_assets: brandData.brand_assets || {},
          email: user?.primaryEmailAddress?.emailAddress || '',
          clerk_user_id: user?.id || '',
          is_trial: !hasActiveSubscription,
          industry: brandData.industry,
          category: brandData.category,
          key_messages: brandData.key_benefits,
          competitors: brandData.competitors,
          questions: questionsData.questions.map(q => ({ text: q.text, category: q.category })),
          question_count: questionsData.questions.length,
          timestamp: new Date().toISOString()
        })
      });

      if (!analysisRes.ok) throw new Error('Failed to start analysis');

      // Redirect to the report page or show success
      navigate(`/?report=${sessionId}`);
    } catch (err) {
      setError('Failed to run analysis. Please try again.');
      console.error('[Dashboard] runAnalysis error:', err);
    }
    setIsRunningAnalysis(false);
  };

  const viewReport = (sessionId) => {
    navigate(`/?report=${sessionId}`);
  };

  const toggleTrackedQuestion = (index) => {
    setTrackedQuestionsForRun((prev) =>
      prev.map((q, i) => (i === index ? { ...q, included: !q.included } : q))
    );
  };

  const startEditQuestion = (index) => {
    const q = trackedQuestionsForRun[index];
    setEditingQuestionId(q.id);
    setEditQuestionText(q.editedText !== undefined ? q.editedText : q.question_text);
  };

  const saveEditQuestion = (index) => {
    setTrackedQuestionsForRun((prev) =>
      prev.map((q, i) => (i === index ? { ...q, editedText: editQuestionText } : q))
    );
    setEditingQuestionId(null);
    setEditQuestionText('');
  };

  // Chart data from paid reports only (exclude trial)
  const chartData = [...paidOnlyReports].reverse().map(report => ({
    date: new Date(report.report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: report.visibility_score,
  }));

  if (!isLoaded) {
    return (
      <div className="min-h-screen fp-shell flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white fp-shell">
      {/* Header */}
      <header className="fp-header sticky top-0 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <img src={FUTUREPROOF_LOGO} alt="FutureProof" className="h-6 md:h-8" />
            <span className="text-white/20 hidden sm:inline">|</span>
            <span className="font-semibold text-sm md:text-base hidden sm:inline">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-sm fp-text-muted hover:text-white transition-colors"
            >
              New Analysis
            </button>
            <UserButton afterSignOutUrl="/login" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="fp-text-muted">Manage your AI visibility tracking and view your reports.</p>
        </div>

        {/* Setup Wizard - Show if setup not complete */}
        {!isSetupComplete && (
          <div className="fp-card-strong rounded-2xl md:rounded-3xl p-6 md:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl fp-icon-gradient flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Setup Your Brand Tracking</h2>
                <p className="text-sm fp-text-muted">Configure your brand for AI visibility monitoring</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mb-8">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${setupStep === 'brand' ? 'fp-button-primary' : 'fp-chip'}`}>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>
                Brand
              </div>
              <ChevronRight className="w-4 h-4 fp-text-muted" />
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${setupStep === 'frequency' ? 'fp-button-primary' : 'fp-chip'}`}>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span>
                Frequency
              </div>
              <ChevronRight className="w-4 h-4 fp-text-muted" />
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${setupStep === 'ready' ? 'fp-button-primary' : 'fp-chip'}`}>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">3</span>
                Ready
              </div>
            </div>

            {/* Step 1: Brand URL */}
            {setupStep === 'brand' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Enter your brand website</label>
                  <div className="relative">
                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 fp-text-subtle" />
                    <input
                      type="text"
                      value={brandUrl}
                      onChange={e => setBrandUrl(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl fp-input outline-none transition-all text-lg"
                      placeholder="yourbrand.com"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl fp-error text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <button
                  onClick={analyzeBrandUrl}
                  disabled={!brandUrl.trim() || isAnalyzingBrand}
                  className="w-full py-4 rounded-xl fp-button-primary disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-3"
                >
                  {isAnalyzingBrand ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing brand...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 2: Frequency */}
            {setupStep === 'frequency' && (
              <div className="space-y-4">
                {brandData && (
                  <div className="p-4 rounded-xl fp-card flex items-center gap-4 mb-6">
                    {brandData.logo_url && (
                      <img src={brandData.logo_url} alt={brandData.brand_name} className="h-10 object-contain" />
                    )}
                    <div>
                      <p className="font-semibold">{brandData.brand_name}</p>
                      <p className="text-sm fp-text-muted">{brandData.category}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-3">How often should we track your visibility?</label>
                  <div className="space-y-3">
                    {frequencyOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setFrequency(option.value)}
                        className={`w-full p-4 rounded-xl text-left transition-all ${
                          frequency === option.value
                            ? 'fp-stage-active border-2'
                            : 'fp-card hover:border-white/20'
                        }`}
                        style={frequency === option.value ? { borderColor: 'var(--fp-accent-1)' } : {}}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{option.label}</p>
                            <p className="text-sm fp-text-muted">{option.description}</p>
                          </div>
                          {frequency === option.value && (
                            <CheckCircle className="w-5 h-5" style={{ color: 'var(--fp-accent-1)' }} />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSetupStep('brand')}
                    className="px-6 py-3 rounded-xl fp-card hover:bg-white/10 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setSetupStep('ready')}
                    className="flex-1 py-3 rounded-xl fp-button-primary font-semibold flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Ready */}
            {setupStep === 'ready' && (
              <div className="space-y-6">
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full fp-icon-gradient flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">You're all set!</h3>
                  <p className="fp-text-muted">Your brand tracking is configured and ready to go.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl fp-card text-center">
                    <Globe className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--fp-accent-1)' }} />
                    <p className="font-semibold">{brandData?.brand_name}</p>
                    <p className="text-xs fp-text-muted">Brand</p>
                  </div>
                  <div className="p-4 rounded-xl fp-card text-center">
                    <Clock className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--fp-accent-2)' }} />
                    <p className="font-semibold capitalize">{frequency}</p>
                    <p className="text-xs fp-text-muted">Tracking Frequency</p>
                  </div>
                  <div className="p-4 rounded-xl fp-card text-center">
                    <Target className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--fp-accent-3)' }} />
                    <p className="font-semibold">{questionAllotment}</p>
                    <p className="text-xs fp-text-muted">Questions/Month</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSetupStep('frequency')}
                    className="px-6 py-3 rounded-xl fp-card hover:bg-white/10 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    onClick={completeSetup}
                    className="flex-1 py-3 rounded-xl fp-button-primary font-semibold flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Complete Setup
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Dashboard Content - Show if setup complete */}
        {isSetupComplete && (
          <>
            {/* Subscription Banner - Show if no active subscription */}
            {!hasActiveSubscription && (
              <div className="fp-card-strong rounded-2xl p-6 mb-8 border border-[#ff7a3d]/30 bg-gradient-to-r from-[#ff7a3d]/10 to-transparent">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#ff7a3d]/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-[#ff7a3d]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Upgrade to Track More</h3>
                      <p className="fp-text-muted text-sm">You're on the free tier with {questionAllotment} questions. Upgrade for more tracking power.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="px-6 py-3 rounded-xl fp-button-primary font-semibold flex items-center gap-2 whitespace-nowrap"
                  >
                    View Plans
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="fp-card rounded-2xl p-4 md:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4" style={{ color: 'var(--fp-accent-1)' }} />
                  <span className="text-xs fp-text-muted">Questions</span>
                </div>
                <p className="text-2xl font-bold">{questionsRemaining}</p>
                <p className="text-xs fp-text-muted">of {questionAllotment} remaining</p>
              </div>

              <div className="fp-card rounded-2xl p-4 md:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" style={{ color: 'var(--fp-accent-2)' }} />
                  <span className="text-xs fp-text-muted">Reports</span>
                </div>
                <p className="text-2xl font-bold">{paidOnlyReports.length}</p>
                <p className="text-xs fp-text-muted">total generated</p>
              </div>

              <div className="fp-card rounded-2xl p-4 md:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" style={{ color: 'var(--fp-accent-3)' }} />
                  <span className="text-xs fp-text-muted">Latest Score</span>
                </div>
                <p className="text-2xl font-bold">{paidOnlyReports[0]?.visibility_score || '-'}</p>
                <p className="text-xs fp-text-muted">visibility score</p>
              </div>

              <div className="fp-card rounded-2xl p-4 md:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" style={{ color: 'var(--fp-accent-1)' }} />
                  <span className="text-xs fp-text-muted">Plan</span>
                </div>
                <p className="text-2xl font-bold">
                  {hasActiveSubscription
                    ? `${subscription.questionLot || 0} Questions ${getFrequencyLabel(subscription.frequency) || subscription.frequency || ''}`
                    : 'Free'}
                </p>
                <p className="text-xs fp-text-muted">
                  {hasActiveSubscription ? 'Your plan' : 'Limited tier'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={openRunStudyModal}
                disabled={isRunningAnalysis || questionsRemaining < 5}
                className="flex-1 py-4 rounded-xl fp-button-primary disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-3"
              >
                {isRunningAnalysis ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Running Analysis...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Run {paidOnlyReports.length === 0 ? 'First' : 'New'} Tracker Study
                  </>
                )}
              </button>

              <button
                onClick={() => navigate('/pricing')}
                className="px-6 py-4 rounded-xl fp-card hover:bg-white/10 font-semibold flex items-center justify-center gap-2 border border-white/10"
              >
                <CreditCard className="w-5 h-5" />
                {hasActiveSubscription ? 'Manage Plan' : 'Upgrade Plan'}
              </button>
            </div>

            {error && (
              <div className="p-4 rounded-xl fp-error text-sm flex items-center gap-2 mb-8">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            {/* Score History Chart */}
            {chartData.length > 1 && (
              <div className="fp-card rounded-2xl md:rounded-3xl p-4 md:p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl fp-icon-gradient flex items-center justify-center">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Score History</h2>
                    <p className="text-sm fp-text-muted">Track your visibility score over time</p>
                  </div>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff7a3d" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ff7a3d" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={12}
                        tickLine={false}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(26, 26, 46, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                        labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#ff7a3d"
                        strokeWidth={2}
                        fill="url(#scoreGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Reports List */}
            <div className="fp-card rounded-2xl md:rounded-3xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl fp-icon-gradient flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Your Reports</h2>
                    <p className="text-sm fp-text-muted">View and download your visibility reports</p>
                  </div>
                </div>
              </div>

              {isLoadingReports ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 fp-text-muted" />
                  <p className="fp-text-muted">Loading reports...</p>
                </div>
              ) : paidOnlyReports.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 fp-text-muted" />
                  <p className="text-lg font-semibold mb-2">No reports yet</p>
                  <p className="fp-text-muted mb-6">Run your first tracker study to generate a visibility report</p>
                  <button
                    onClick={openRunStudyModal}
                    disabled={isRunningAnalysis}
                    className="px-6 py-3 rounded-xl fp-button-primary font-semibold inline-flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Run First Tracker Study
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {paidOnlyReports.map((report, index) => (
                    <div
                      key={report.id}
                      ref={reportParam === report.session_id ? reportCardRef : undefined}
                      className={`flex items-center gap-4 p-4 rounded-xl fp-card hover:bg-white/5 transition-all cursor-pointer ${reportParam === report.session_id ? 'ring-2 ring-[#ff7a3d] ring-offset-2 ring-offset-[#0f0f14]' : ''}`}
                      onClick={() => viewReport(report.session_id)}
                    >
                      {report.brand_logo ? (
                        <img
                          src={report.brand_logo}
                          alt={report.brand_name}
                          className="w-10 h-10 object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <Globe className="w-5 h-5 fp-text-muted" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{report.brand_name}</p>
                        <p className="text-sm fp-text-muted">
                          {new Date(report.report_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold">{report.visibility_score}</p>
                        <p className="text-sm fp-text-muted">Score</p>
                      </div>

                      <ChevronRight className="w-5 h-5 fp-text-muted" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Run Tracker Study modal: review tracked questions before running */}
      {showRunStudyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="fp-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
              <h2 className="text-lg font-bold">Run Tracker Study</h2>
              <button
                type="button"
                onClick={() => { setShowRunStudyModal(false); setEditingQuestionId(null); setEditQuestionText(''); }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              <p className="text-sm fp-text-muted mb-4">Review your tracked questions. Select which to include and edit if needed, then run the study.</p>
              {isLoadingTrackedQuestions ? (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Loading tracked questions…</span>
                </div>
              ) : trackedQuestionsForRun.length === 0 ? (
                <div className="py-8 text-center fp-text-muted">
                  <p className="mb-2">No tracked questions found.</p>
                  <p className="text-sm">Complete paid onboarding to save your questions, then run a tracker study from here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trackedQuestionsForRun.map((q, index) => (
                    <div
                      key={q.id || index}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <button
                        type="button"
                        onClick={() => toggleTrackedQuestion(index)}
                        className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${q.included ? 'bg-fp-orange border-fp-orange' : 'border-white/40'}`}
                      >
                        {q.included && <Check className="w-3 h-3 text-white" />}
                      </button>
                      {editingQuestionId === q.id ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editQuestionText}
                            onChange={(e) => setEditQuestionText(e.target.value)}
                            className="fp-input flex-1 px-3 py-2 rounded-lg text-sm"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => saveEditQuestion(index)}
                            className="px-3 py-2 rounded-lg fp-button-primary text-sm"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="flex-1 min-w-0 text-sm text-white/90">{q.editedText !== undefined ? q.editedText : q.question_text}</p>
                          <button
                            type="button"
                            onClick={() => startEditQuestion(index)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            aria-label="Edit question"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {trackedQuestionsForRun.length > 0 && (
              <div className="p-4 md:p-6 border-t border-white/10 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowRunStudyModal(false); setEditingQuestionId(null); setEditQuestionText(''); }}
                  className="flex-1 py-3 rounded-xl fp-card hover:bg-white/10 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => runAnalysisWithQuestions(trackedQuestionsForRun)}
                  disabled={trackedQuestionsForRun.filter((q) => q.included).length === 0}
                  className="flex-1 py-3 rounded-xl fp-button-primary font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  Run Study
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Styles */}
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
