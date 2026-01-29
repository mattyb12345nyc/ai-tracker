import { useState } from 'react';
import { Tag, Zap } from 'lucide-react';

const FREQUENCY_LABELS = {
  weekly: 'Weekly',
  'bi-weekly': 'Bi‑weekly',
  biweekly: 'Bi‑weekly',
  monthly: 'Monthly',
};

const OBJECTIVE_OPTIONS = [
  { id: 'visibility', label: 'Track brand visibility vs competitors' },
  { id: 'sentiment', label: 'Monitor sentiment across AI platforms' },
  { id: 'optimization', label: 'Identify optimization opportunities' },
  { id: 'sov', label: 'Track share of voice over time' },
];

export default function BrandConfigScreen({
  welcomeData = {},
  onBack,
  onContinue,
  onUpgradePlan,
  questionsCount = 10,
  frequency = 'weekly',
}) {
  const [brandAliases, setBrandAliases] = useState('');
  const [objectives, setObjectives] = useState([]);
  const [objectiveOther, setObjectiveOther] = useState('');

  const freqLabel = FREQUENCY_LABELS[frequency] ?? frequency;

  const toggleObjective = (id) => {
    setObjectives((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const aliases = brandAliases
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onContinue?.({
      ...welcomeData,
      brandAliases: aliases,
      objectives: [...objectives],
      objectiveOther: objectives.includes('other') ? objectiveOther.trim() : '',
    });
  };

  return (
    <div className="min-h-screen fp-shell text-white relative overflow-hidden">
      <div className="fp-sphere fp-sphere-1" aria-hidden="true" />
      <div className="fp-sphere fp-sphere-2" aria-hidden="true" />

      <div className="relative z-10 max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        {/* Top banner: Package + Upgrade */}
        <div className="flex flex-wrap items-center justify-end gap-3 mb-8 sm:mb-10">
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
            Add aliases and objectives so we can personalize your AI visibility tracking. Competitors are auto-detected by AI based on your industry.
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
              <span className="block font-body font-medium text-white/90 mb-3 text-sm sm:text-base">
                Objectives
              </span>
              <div className="space-y-2">
                {OBJECTIVE_OPTIONS.map(({ id, label }) => (
                  <label
                    key={id}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={objectives.includes(id)}
                      onChange={() => toggleObjective(id)}
                      className="w-4 h-4 rounded border border-white/30 bg-white/5 text-fp-orange focus:ring-2 focus:ring-fp-orange focus:ring-offset-0 focus:ring-offset-transparent"
                    />
                    <span className="font-body text-sm sm:text-base text-white/90 group-hover:text-white">
                      {label}
                    </span>
                  </label>
                ))}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={objectives.includes('other')}
                    onChange={() => toggleObjective('other')}
                    className="w-4 h-4 rounded border border-white/30 bg-white/5 text-fp-orange focus:ring-2 focus:ring-fp-orange focus:ring-offset-0 focus:ring-offset-transparent mt-1 shrink-0"
                  />
                  <span className="font-body text-sm sm:text-base text-white/90 group-hover:text-white flex-1 min-w-0">
                    Other
                    {objectives.includes('other') && (
                      <input
                        type="text"
                        value={objectiveOther}
                        onChange={(e) => setObjectiveOther(e.target.value)}
                        placeholder="Describe your objective"
                        className="fp-input w-full mt-2 px-3 py-2 rounded-lg font-body text-sm placeholder:text-white/40"
                        autoComplete="off"
                      />
                    )}
                  </span>
                </label>
              </div>
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
