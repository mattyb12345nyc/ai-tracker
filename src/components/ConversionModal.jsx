import React from 'react';
import { X, Crown, CheckCircle, ArrowRight, Zap, TrendingUp, BarChart3, Calendar } from 'lucide-react';

export default function ConversionModal({ isOpen, onClose, onUpgrade, context }) {
  if (!isOpen) return null;

  const features = [
    { icon: BarChart3, text: 'Track unlimited brands' },
    { icon: Calendar, text: 'Weekly automated reports' },
    { icon: TrendingUp, text: 'Competitor monitoring' },
    { icon: Zap, text: 'Priority support' }
  ];

  const getTitle = () => {
    if (context?.type === 'trial_limit') {
      return context.message || 'Upgrade to Continue';
    }
    if (context?.type === 'after_report') {
      return 'Keep Your Data & Get More Insights';
    }
    return 'Upgrade to Pro';
  };

  const getSubtitle = () => {
    if (context?.subtitle) {
      return context.subtitle;
    }
    if (context?.type === 'after_report') {
      return 'Upgrade to track unlimited brands, get weekly reports, and never lose your data';
    }
    return 'Get unlimited tracking, weekly reports, and competitor insights';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-[#1a1a2e] via-[#1f1f35] to-[#1a1a2e] rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-lg w-full border border-[#ff7a3d]/30 shadow-2xl animate-fadeIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff7a3d] to-[#ff6b4a] flex items-center justify-center mx-auto mb-6">
          <Crown className="w-8 h-8 text-white" />
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
          {getTitle()}
        </h2>

        {/* Subtitle */}
        <p className="text-center text-white/70 mb-6 text-sm md:text-base">
          {getSubtitle()}
        </p>

        {/* Features */}
        <div className="space-y-3 mb-6">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-lg bg-[#ff7a3d]/20 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-[#ff7a3d]" />
              </div>
              <span className="text-white/90 font-medium">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={onUpgrade}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#ff7a3d] to-[#ff6b4a] text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-lg"
          >
            View Plans
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            Maybe Later
          </button>
        </div>

        {/* Trust indicators */}
        <p className="text-center text-xs text-white/50 mt-4">
          No credit card required • Cancel anytime
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
