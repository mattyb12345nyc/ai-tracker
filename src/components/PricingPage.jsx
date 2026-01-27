import { useState } from 'react';
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Sparkles, Zap, TrendingUp, ArrowRight, AlertCircle } from 'lucide-react';

const FUTUREPROOF_LOGO = 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/d19d829c-a9a9-4fad-b0e7-7938012be26c/800x200.png';

// Pricing calculation
function calculatePrice(questionLot, frequency) {
  const frequencyMultiplier = { monthly: 1, biweekly: 2, weekly: 4 };
  const units = questionLot * frequencyMultiplier[frequency];

  let pricePerUnit;
  if (units <= 20) pricePerUnit = 50;
  else if (units <= 50) pricePerUnit = 45;
  else if (units <= 100) pricePerUnit = 40;
  else pricePerUnit = 37.50;

  return {
    units,
    pricePerUnit,
    totalPrice: units * pricePerUnit,
    discount: pricePerUnit < 50 ? Math.round((1 - pricePerUnit / 50) * 100) : 0
  };
}

// Get frequency label
function getFrequencyLabel(frequency) {
  const labels = {
    monthly: 'Monthly',
    biweekly: 'Bi-weekly',
    weekly: 'Weekly'
  };
  return labels[frequency];
}

// Get frequency description
function getFrequencyDescription(frequency) {
  const descriptions = {
    monthly: 'Track once per month',
    biweekly: 'Track twice per month',
    weekly: 'Track every week'
  };
  return descriptions[frequency];
}

function PricingContent() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedQuestions, setSelectedQuestions] = useState(25);
  const [selectedFrequency, setSelectedFrequency] = useState('weekly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cancelled = searchParams.get('checkout') === 'cancelled';

  const questionOptions = [10, 25, 50];
  const frequencyOptions = ['monthly', 'biweekly', 'weekly'];

  const { units, pricePerUnit, totalPrice, discount } = calculatePrice(selectedQuestions, selectedFrequency);

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login?redirect_url=/pricing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionLot: selectedQuestions,
          frequency: selectedFrequency,
          userId: user.id,
          userEmail: user.primaryEmailAddress?.emailAddress
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Pre-calculate all plan prices for the grid
  const allPlans = questionOptions.flatMap(q =>
    frequencyOptions.map(f => ({
      questions: q,
      frequency: f,
      ...calculatePrice(q, f)
    }))
  );

  return (
    <div className="min-h-screen text-white fp-shell">
      <header className="fp-header sticky top-0 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={FUTUREPROOF_LOGO} alt="FutureProof" className="h-8" />
            <span className="text-white/20">|</span>
            <span className="font-semibold">AI Visibility Tracker</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-white/60 hover:text-white transition-colors"
          >
            ← Back to App
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-16 animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full fp-chip text-sm mb-6">
            <Sparkles className="w-4 h-4" /> Choose Your Plan
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            Track Your AI Visibility
          </h1>
          <p className="fp-text-muted text-lg max-w-2xl mx-auto">
            Monitor how AI platforms mention and recommend your brand. Choose the tracking frequency that fits your needs.
          </p>
        </div>

        {cancelled && (
          <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p className="text-yellow-200">Checkout was cancelled. Feel free to try again when you're ready.</p>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Plan Configurator */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="fp-card rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Selectors */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    Questions to Track
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {questionOptions.map(q => (
                      <button
                        key={q}
                        onClick={() => setSelectedQuestions(q)}
                        className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                          selectedQuestions === q
                            ? 'bg-gradient-to-r from-[#ff7a3d] to-[#ff6b4a] text-white'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    Tracking Frequency
                  </label>
                  <div className="space-y-2">
                    {frequencyOptions.map(f => {
                      const planPrice = calculatePrice(selectedQuestions, f);
                      return (
                        <button
                          key={f}
                          onClick={() => setSelectedFrequency(f)}
                          className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-between ${
                            selectedFrequency === f
                              ? 'bg-gradient-to-r from-[#ff7a3d] to-[#ff6b4a] text-white'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-left">
                            <div className="font-semibold">{getFrequencyLabel(f)}</div>
                            <div className={`text-sm ${selectedFrequency === f ? 'text-white/80' : 'text-white/50'}`}>
                              {getFrequencyDescription(f)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">${planPrice.totalPrice.toLocaleString()}</div>
                            {planPrice.discount > 0 && (
                              <div className={`text-xs ${selectedFrequency === f ? 'text-white/80' : 'text-green-400'}`}>
                                {planPrice.discount}% off
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right: Summary */}
              <div className="bg-white/5 rounded-xl p-6 flex flex-col">
                <div className="text-sm text-white/60 mb-2">Your Plan</div>
                <div className="text-2xl font-bold mb-1">
                  {selectedQuestions} Questions • {getFrequencyLabel(selectedFrequency)}
                </div>
                <div className="text-white/60 mb-6">
                  {units} tracking units per month
                </div>

                <div className="flex-1 space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-white/80">
                    <Check className="w-4 h-4 text-green-400" />
                    Track across ChatGPT, Claude, Gemini, Perplexity
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Check className="w-4 h-4 text-green-400" />
                    Detailed visibility scoring & analysis
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Check className="w-4 h-4 text-green-400" />
                    Competitor brand rankings
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Check className="w-4 h-4 text-green-400" />
                    Actionable AI optimization insights
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Check className="w-4 h-4 text-green-400" />
                    Branded PDF reports
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 mb-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-white/60">Price per unit</span>
                    <span className="font-medium">${pricePerUnit}</span>
                  </div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-white/60">Units</span>
                    <span className="font-medium">{units}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-green-400">Volume discount</span>
                      <span className="text-green-400 font-medium">-{discount}%</span>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between text-xl font-bold mt-3">
                    <span>Total</span>
                    <span>${totalPrice.toLocaleString()}/mo</span>
                  </div>
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-[#ff7a3d] to-[#ff6b4a] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating checkout...
                    </>
                  ) : (
                    <>
                      Subscribe Now
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* All Plans Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">All Plan Options</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-left text-white/60 font-medium">Questions</th>
                  <th className="py-3 px-4 text-left text-white/60 font-medium">Frequency</th>
                  <th className="py-3 px-4 text-right text-white/60 font-medium">Units</th>
                  <th className="py-3 px-4 text-right text-white/60 font-medium">Per Unit</th>
                  <th className="py-3 px-4 text-right text-white/60 font-medium">Discount</th>
                  <th className="py-3 px-4 text-right text-white/60 font-medium">Monthly</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {allPlans.map((plan, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                      plan.questions === selectedQuestions && plan.frequency === selectedFrequency
                        ? 'bg-[#ff7a3d]/10'
                        : ''
                    }`}
                  >
                    <td className="py-4 px-4 font-medium">{plan.questions}</td>
                    <td className="py-4 px-4">{getFrequencyLabel(plan.frequency)}</td>
                    <td className="py-4 px-4 text-right">{plan.units}</td>
                    <td className="py-4 px-4 text-right">${plan.pricePerUnit}</td>
                    <td className="py-4 px-4 text-right">
                      {plan.discount > 0 ? (
                        <span className="text-green-400">{plan.discount}% off</span>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-bold">${plan.totalPrice.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedQuestions(plan.questions);
                          setSelectedFrequency(plan.frequency);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-[#ff7a3d] hover:text-[#ff8a80] font-medium"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="fp-card rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#ff7a3d]/20 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-[#ff7a3d]" />
            </div>
            <h3 className="font-semibold mb-2">Real-time Tracking</h3>
            <p className="text-white/60 text-sm">
              Monitor your brand's visibility across ChatGPT, Claude, Gemini, and Perplexity in real-time.
            </p>
          </div>
          <div className="fp-card rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#ff7a3d]/20 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-[#ff7a3d]" />
            </div>
            <h3 className="font-semibold mb-2">Actionable Insights</h3>
            <p className="text-white/60 text-sm">
              Get specific recommendations to improve your AI visibility and outrank competitors.
            </p>
          </div>
          <div className="fp-card rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#ff7a3d]/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-[#ff7a3d]" />
            </div>
            <h3 className="font-semibold mb-2">Branded Reports</h3>
            <p className="text-white/60 text-sm">
              Download professional PDF reports with your brand's logo and colors.
            </p>
          </div>
        </div>
      </main>

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

export default function PricingPage() {
  return (
    <>
      <SignedIn>
        <PricingContent />
      </SignedIn>
      <SignedOut>
        <PricingContent />
      </SignedOut>
    </>
  );
}
