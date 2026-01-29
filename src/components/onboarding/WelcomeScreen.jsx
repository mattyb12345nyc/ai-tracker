import { useState } from 'react';
import { CheckCircle, ChevronDown } from 'lucide-react';

const INDUSTRIES = [
  'Select industry…',
  'Technology / SaaS',
  'E‑commerce / Retail',
  'Finance / Fintech',
  'Healthcare',
  'Marketing / Agency',
  'Professional Services',
  'Media / Entertainment',
  'Manufacturing',
  'Education',
  'Travel / Hospitality',
  'Other',
];

export default function WelcomeScreen({ onContinue }) {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [primaryBrand, setPrimaryBrand] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onContinue?.({
      companyName: companyName.trim(),
      industry: industry === INDUSTRIES[0] ? '' : industry,
      primaryBrand: primaryBrand.trim(),
    });
  };

  const canSubmit = companyName.trim() && primaryBrand.trim();

  return (
    <div className="min-h-screen fp-shell text-white relative overflow-hidden">
      {/* Decorative gradient spheres */}
      <div className="fp-sphere fp-sphere-1" aria-hidden="true" />
      <div className="fp-sphere fp-sphere-2" aria-hidden="true" />

      <div className="relative z-10 max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        {/* Welcome header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full fp-chip text-sm mb-4 sm:mb-6">
            <CheckCircle className="w-4 h-4 text-fp-orange" />
            <span className="font-body font-medium">Purchase complete</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide mb-3 sm:mb-4 fp-gradient-text">
            Welcome aboard
          </h1>
          <p className="font-body text-white/70 text-sm sm:text-base max-w-md mx-auto">
            Congrats on your purchase. Tell us a bit about your company so we can personalize your AI visibility tracking.
          </p>
        </div>

        {/* Form card */}
        <div className="fp-card rounded-xl p-6 sm:p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Company Name */}
            <div>
              <label htmlFor="company-name" className="block font-body font-medium text-white/90 mb-2 text-sm sm:text-base">
                Company Name
              </label>
              <input
                id="company-name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
                className="fp-input w-full px-4 py-3 rounded-lg font-body text-base placeholder:text-white/40"
                autoComplete="organization"
                required
              />
            </div>

            {/* Industry */}
            <div>
              <label htmlFor="industry" className="block font-body font-medium text-white/90 mb-2 text-sm sm:text-base">
                Industry
              </label>
              <div className="relative">
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="fp-input w-full px-4 py-3 pr-11 rounded-lg font-body text-base appearance-none cursor-pointer"
                >
                  {INDUSTRIES.map((opt) => (
                    <option key={opt} value={opt} className="bg-fp-dark text-white">
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fp-orange pointer-events-none" aria-hidden />
              </div>
            </div>

            {/* Primary Brand to Track */}
            <div>
              <label htmlFor="primary-brand" className="block font-body font-medium text-white/90 mb-2 text-sm sm:text-base">
                Primary Brand to Track
              </label>
              <input
                id="primary-brand"
                type="text"
                value={primaryBrand}
                onChange={(e) => setPrimaryBrand(e.target.value)}
                placeholder="Your brand or product name"
                className="fp-input w-full px-4 py-3 rounded-lg font-body text-base placeholder:text-white/40"
                autoComplete="off"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!canSubmit}
                className="fp-button-primary w-full py-4 rounded-lg font-body font-semibold text-base uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none transition-all"
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
