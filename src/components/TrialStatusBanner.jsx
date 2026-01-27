import React from 'react';
import { Clock, AlertCircle, Crown } from 'lucide-react';

export default function TrialStatusBanner({ trialStatus, onUpgrade, isSticky = false }) {
  if (!trialStatus || !trialStatus.isActive) return null;

  const { daysRemaining, analysesUsed, maxAnalyses, isExpired } = trialStatus;
  
  // Calculate progress percentage
  const progress = Math.min(100, (daysRemaining / 14) * 100);
  
  // Determine urgency level
  const isUrgent = daysRemaining <= 3;
  const isWarning = daysRemaining <= 7;

  if (isExpired) {
    return (
      <div className={`${isSticky ? 'fixed top-0 left-0 right-0 z-40' : ''} bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/30 backdrop-blur-xl`}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="font-semibold text-white">Your free trial has expired</p>
              <p className="text-sm text-white/70">Upgrade now to keep your data and continue tracking</p>
            </div>
          </div>
          <button
            onClick={onUpgrade}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff7a3d] to-[#ff6b4a] text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
          >
            <Crown className="w-4 h-4" />
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isSticky ? 'fixed top-0 left-0 right-0 z-40' : ''} ${
      isUrgent 
        ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/30' 
        : isWarning 
        ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-b border-orange-500/30'
        : 'bg-gradient-to-r from-[#ff7a3d]/20 to-[#ff6b4a]/20 border-b border-[#ff7a3d]/30'
    } backdrop-blur-xl`}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Clock className={`w-5 h-5 shrink-0 ${isUrgent ? 'text-red-400' : isWarning ? 'text-orange-400' : 'text-[#ff7a3d]'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className={`font-semibold text-sm ${isUrgent ? 'text-red-200' : 'text-white'}`}>
                {isUrgent 
                  ? `⚠️ Your trial ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
                  : isWarning
                  ? `Your trial ends in ${daysRemaining} days`
                  : `Free Trial - ${daysRemaining} days remaining`
                }
              </p>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  isUrgent ? 'bg-red-400' : isWarning ? 'bg-orange-400' : 'bg-[#ff7a3d]'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:block text-xs text-white/60">
            {analysesUsed}/{maxAnalyses} analyses used
          </div>
          <button
            onClick={onUpgrade}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff7a3d] to-[#ff6b4a] text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <Crown className="w-4 h-4" />
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}
