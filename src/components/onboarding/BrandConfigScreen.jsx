import { useState } from 'react';
import { Tag, Zap } from 'lucide-react';

const FREQUENCY_LABELS = {
  weekly: 'Weekly',
  'bi-weekly': 'Bi‑weekly',
  biweekly: 'Bi‑weekly',
  monthly: 'Monthly',
};

const OBJECTIVES_PLACEHOLDER =
  'e.g., Drive sales, increase visibility, improve AI output consistency, monitor competitor positioning...';

export default function BrandConfigScreen({
  welcomeData = {},
  onBack,
  onContinue,
  onSkipOnboarding,
  onUpgradePlan,
  questionsCount = 10,
  frequency = 'weekly',
}) {
  const [brandAliases, setBrandAliases] = useState('');
  const [objectives, setObjectives] = useState('');

  const freqLabel = FREQUENCY_LABELS[frequency] ?? frequency;

  const handleSubmit = (e) => {
    e.preventDefault();
    const aliases = brandAliases
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onContinue?.({
      ...welcomeData,
      brandAliases: aliases,
      objectives: objectives.trim(),
    });
  };

  return (
    <div className="min-h-screen fp-shell text-white relative overflow-hidden">
      <div className="fp-sphere fp-sphere-1" aria-hidden="true" />
      <div className="fp-sphere fp-sphere-2" aria-hidden="true" />

      <div className="relative z-10 max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        {/* Top banner: Skip top right, Package + Upgrade */}
        <div className="flex flex-wrap items-center justify-end gap-3 mb-8 sm:mb-10">
          {onSkipOnboarding && (
            <button
              type="button"
              onClick={onSkipOnboarding}
              className="font-body text-sm text-white/60 hover:text-white transition-colors mr-auto sm:mr-0 sm:order-last"
            >
              Skip Onboarding
            </button>
          )}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full fp-chip text-sm font-body">
            <Zap className="w-4 h-4 text-fp-orange" />
            <span>
              {questionsCount} questions · {freqLabel}
            </span>
          </div>
          {onUpgradePlan && (
            <button
              type="button"
              onClick={onUpgradePlan}
              className="fp-button-primary px-5 py-2.5 rounded-lg font-body font-semibold text-sm uppercase tracking-wide"
            >
              Upgrade Plan
            </button>
          )}
        </div>

        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full fp-chip text-sm mb-4 sm:mb-6">
            <Tag className="w-4 h-4 text-fp-orange" />
            <span className="font-body font-medium">Step 2 of 2</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide mb-3 sm:mb-4 fp-gradient-text">
            Brand configuration
          </h1>
          <p className="font-body text-white/70 text-sm sm:text-base max-w-md mx-auto">
            Add aliases and objectives so we can personalize your AI visibility tracking.
          </p>
        </div>

        <div className="fp-card rounded-xl p-6 sm:p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Brand Aliases */}
            <div>
              <label
                htmlFor="brand-aliases"
                className="block font-body font-medium text-white/90 mb-2 text-sm sm:text-base"
              >
                Brand Aliases
              </label>
              <input
                id="brand-aliases"
                type="text"
                value={brandAliases}
                onChange={(e) => setBrandAliases(e.target.value)}
                placeholder="Xbox, XBOX, Microsoft Xbox"
                className="fp-input w-full px-4 py-3 rounded-lg font-body text-base placeholder:text-white/40"
                autoComplete="off"
              />
              <p className="font-body text-white/50 text-xs mt-1.5">
                Add variations of your brand name to ensure accurate tracking.
              </p>
            </div>

            {/* Objectives */}
            <div>
              <label
                htmlFor="objectives"
                className="block font-body font-medium text-white/90 mb-2 text-sm sm:text-base"
              >
                Objectives
              </label>
              <textarea
                id="objectives"
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder={OBJECTIVES_PLACEHOLDER}
                rows={4}
                className="fp-input w-full px-4 py-3 rounded-lg font-body text-base placeholder:text-white/40 resize-y min-h-[100px]"
                autoComplete="off"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onBack}
                className="fp-button-secondary flex-1 py-4 rounded-lg font-body font-semibold text-base uppercase tracking-wide transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                className="fp-button-primary flex-1 py-4 rounded-lg font-body font-semibold text-base uppercase tracking-wide transition-all"
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
