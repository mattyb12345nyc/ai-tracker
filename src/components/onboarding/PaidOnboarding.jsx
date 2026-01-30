import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Zap, Globe, Loader2, ChevronRight, Check, Sparkles, Play
} from 'lucide-react';
import { hasActiveSubscription } from '../../utils/trialTracking';

const FREQUENCY_LABELS = { weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly' };

function normalizeUrl(input) {
  let normalized = (input || '').trim().toLowerCase();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  return normalized;
}

export default function PaidOnboarding() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromCheckout = searchParams.get('checkout') === 'success';
  const refetchCountRef = useRef(0);

  const [step, setStep] = useState(1);
  const [waitingForSubscription, setWaitingForSubscription] = useState(false);

  // Step 1
  const [brandName, setBrandName] = useState('');
  const [brandUrl, setBrandUrl] = useState('');

  // Step 2: Business Goals
  const [businessGoals, setBusinessGoals] = useState('');

  // Step 3: Recommended questions (from new API)
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isGeneratingRecommended, setIsGeneratingRecommended] = useState(false);

  // Step 4 (launch)
  const [brandData, setBrandData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // Step 4
  const [isLaunching, setIsLaunching] = useState(false);

  const subscription = user?.publicMetadata?.subscription;
  const hasSubscription =
    (subscription?.status === 'active' || subscription?.status === 'trialing') &&
    (subscription?.questionLot ?? 0) > 0;
  const questionLot = Math.min(subscription?.questionLot ?? 10, 50);
  const frequencyLabel = FREQUENCY_LABELS[subscription?.frequency] || subscription?.frequency || 'Weekly';

  // If we came from checkout but metadata isn't ready yet, poll for subscription
  useEffect(() => {
    if (!isLoaded || !user?.reload || hasSubscription || !fromCheckout) return;
    setWaitingForSubscription(true);
    const maxTries = 8;
    let cancelled = false;
    const interval = setInterval(async () => {
      refetchCountRef.current += 1;
      await user.reload();
      if (refetchCountRef.current >= maxTries && !cancelled) {
        clearInterval(interval);
        setWaitingForSubscription(false);
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isLoaded, user?.id, user?.reload, fromCheckout, hasSubscription]);

  // Redirect non-paid users who aren't coming from checkout
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (!fromCheckout && !hasSubscription) {
      navigate('/dashboard');
    }
  }, [isLoaded, user, fromCheckout, hasSubscription, navigate]);

  const analyzeBrand = async () => {
    const url = normalizeUrl(brandUrl);
    if (!url) {
      setError('Please enter a valid brand URL.');
      return;
    }
    setError('');
    setIsAnalyzing(true);
    try {
      const res = await fetch('/.netlify/functions/analyze-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!res.ok) throw new Error('Failed to analyze URL');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const dataWithName = { ...data.brandData, brand_name: brandName.trim() || data.brandData.brand_name };
      setBrandData(dataWithName);
      setStep(2);
    } catch (e) {
      setError(e.message || 'Failed to analyze URL. Please try again.');
    }
    setIsAnalyzing(false);
  };

  const fetchRecommendedQuestions = async () => {
    setIsGeneratingRecommended(true);
    setError('');
    try {
      const res = await fetch('/.netlify/functions/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandData?.brand_name || brandName,
          brandUrl: normalizeUrl(brandUrl),
          industry: brandData?.industry || '',
          businessGoals: businessGoals.trim()
        })
      });
      if (!res.ok) throw new Error('Failed to generate questions');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const list = (data.questions || []).map((text) => ({ text, included: true }));
      setSelectedQuestions(list);
    } catch (e) {
      setError(e.message || 'Failed to generate recommended questions. Please try again.');
      setSelectedQuestions([]);
    }
    setIsGeneratingRecommended(false);
  };

  const toggleSelectedQuestion = (index) => {
    setSelectedQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, included: !q.included } : q))
    );
  };

  const launchTracking = async () => {
    if (!brandData || !user?.id) return;
    const activeQuestions = selectedQuestions.filter((q) => q.included);
    if (activeQuestions.length === 0) {
      setError('Please include at least one question.');
      return;
    }
    setError('');
    setIsLaunching(true);
    try {
      const sessionId = `SES_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const runId = `RUN_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const res = await fetch('/.netlify/functions/process-analysis-background', {
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
          clerk_user_id: user.id,
          is_trial: false,
          industry: brandData.industry,
          category: brandData.category,
          key_messages: brandData.key_benefits,
          competitors: brandData.competitors,
          questions: activeQuestions.map((q) => ({ text: q.text, category: 'Consideration' })),
          question_count: activeQuestions.length,
          business_goals: businessGoals.trim() || undefined,
          timestamp: new Date().toISOString()
        })
      });
      if (!res.ok) throw new Error('Failed to start tracking');
      navigate(`/?report=${sessionId}`);
    } catch (e) {
      setError(e.message || 'Failed to launch tracking. Please try again.');
    }
    setIsLaunching(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen fp-shell text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (fromCheckout && !hasSubscription && waitingForSubscription) {
    return (
      <div className="min-h-screen fp-shell text-white flex flex-col items-center justify-center gap-4 px-4">
        <Loader2 className="w-10 h-10 animate-spin text-white/60" />
        <p className="text-white/80 text-center">Setting up your account…</p>
        <p className="text-white/50 text-sm text-center">Your subscription is being activated. This usually takes a few seconds.</p>
      </div>
    );
  }

  if (!user) return null;

  // Came from checkout but subscription still not in Clerk after polling
  if (fromCheckout && !hasSubscription && !waitingForSubscription) {
    return (
      <div className="min-h-screen fp-shell text-white flex flex-col items-center justify-center gap-6 px-4">
        <p className="text-white/80 text-center max-w-md">
          Your subscription is being activated. This can take a minute. Check your email for confirmation, or try the dashboard in a moment.
        </p>
        <button type="button" onClick={() => navigate('/dashboard')} className="fp-button-primary px-6 py-3 rounded-lg font-semibold">
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (!fromCheckout && !hasSubscription) return null;

  return (
    <div className="min-h-screen fp-shell text-white relative overflow-hidden">
      <div className="fp-sphere fp-sphere-1" aria-hidden="true" />
      <div className="fp-sphere fp-sphere-2" aria-hidden="true" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Step 1: Welcome + plan + brand name & URL */}
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full fp-chip text-sm mb-4">
                <Sparkles className="w-4 h-4 text-fp-orange" />
                <span>Welcome to FutureProof Pro!</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide mb-3 fp-gradient-text">
                Welcome to FutureProof Pro!
              </h1>
              <p className="text-white/70 text-sm sm:text-base mb-4">
                Your plan: <strong>{questionLot} questions</strong>, <strong>{frequencyLabel}</strong>
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full fp-chip text-sm">
                <Zap className="w-4 h-4 text-fp-orange" />
                <span>{questionLot} Questions {frequencyLabel}</span>
              </div>
            </div>

            <div className="fp-card rounded-xl p-6 sm:p-8 border border-white/10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium mb-6">
                <span>Step 1 of 4</span>
              </div>
              <h2 className="text-lg font-semibold mb-4">Enter your brand</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Brand name</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Acme Inc."
                    className="fp-input w-full px-4 py-3 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Brand website URL</label>
                  <input
                    type="url"
                    value={brandUrl}
                    onChange={(e) => setBrandUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="fp-input w-full px-4 py-3 rounded-lg"
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  type="button"
                  onClick={analyzeBrand}
                  disabled={isAnalyzing || !brandUrl.trim()}
                  className="fp-button-primary w-full py-4 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                  {isAnalyzing ? 'Analyzing…' : 'Continue'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Business Goals */}
        {step === 2 && (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium mb-4">
                Step 2 of 4
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold mb-2">Business Goals</h1>
              <p className="text-white/70 text-sm">This helps us personalize your tracking questions.</p>
            </div>

            <div className="fp-card rounded-xl p-6 sm:p-8 border border-white/10">
              <label htmlFor="business-goals" className="block text-sm font-medium text-white/80 mb-2">
                What are your main business goals for AI visibility tracking?
              </label>
              <textarea
                id="business-goals"
                value={businessGoals}
                onChange={(e) => setBusinessGoals(e.target.value)}
                placeholder="e.g., Increase brand awareness, track competitor mentions, monitor product recommendations, improve AI search rankings..."
                rows={5}
                className="fp-input w-full px-4 py-3 rounded-lg min-h-[120px] resize-y placeholder:text-white/40"
              />
              <p className="text-white/50 text-xs mt-2">
                {businessGoals.trim().length} characters (minimum 20 required)
              </p>
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setStep(1)} className="fp-button-secondary flex-1 py-3 rounded-lg font-semibold">
                  Back
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setError('');
                    if (businessGoals.trim().length < 20) {
                      setError('Please enter at least 20 characters so we can tailor your questions.');
                      return;
                    }
                    setStep(3);
                    await fetchRecommendedQuestions();
                  }}
                  disabled={businessGoals.trim().length < 20}
                  className="fp-button-primary flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                  Continue
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Recommended Questions */}
        {step === 3 && (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium mb-4">
                Step 3 of 4
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold mb-2">Recommended Questions</h1>
              <p className="text-white/70 text-sm">We generated these based on your brand and goals. Select which to track.</p>
            </div>

            <div className="fp-card rounded-xl p-6 sm:p-8 border border-white/10 space-y-4">
              {isGeneratingRecommended && selectedQuestions.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Generating recommended questions…</span>
                </div>
              ) : (
                <>
                  {selectedQuestions.map((q, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSelectedQuestion(index)}
                        className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${q.included ? 'bg-fp-orange border-fp-orange' : 'border-white/40'}`}
                      >
                        {q.included && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <p className="flex-1 min-w-0 text-sm text-white/90">{q.text}</p>
                    </div>
                  ))}
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setStep(2)} className="fp-button-secondary flex-1 py-3 rounded-lg font-semibold">
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      disabled={selectedQuestions.filter((q) => q.included).length === 0}
                      className="fp-button-primary flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Step 4: Confirm and launch */}
        {step === 4 && (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium mb-4">
                Step 4 of 4
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold mb-2">Ready to launch</h1>
              <p className="text-white/70 text-sm">We’ll run your first AI visibility track for <strong>{brandData?.brand_name}</strong>.</p>
            </div>

            <div className="fp-card rounded-xl p-6 sm:p-8 border border-white/10 space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                {brandData?.logo_url ? (
                  <img src={brandData.logo_url} alt="" className="w-12 h-12 object-contain rounded" />
                ) : (
                  <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center"><Globe className="w-6 h-6 text-white/50" /></div>
                )}
                <div>
                  <p className="font-semibold">{brandData?.brand_name}</p>
                  <p className="text-sm text-white/60">{selectedQuestions.filter((q) => q.included).length} questions</p>
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(3)} className="fp-button-secondary flex-1 py-4 rounded-lg font-semibold">
                  Back
                </button>
                <button
                  type="button"
                  onClick={launchTracking}
                  disabled={isLaunching}
                  className="fp-button-primary flex-1 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLaunching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                  {isLaunching ? 'Launching…' : 'Launch Tracking'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
