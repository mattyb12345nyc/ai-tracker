// Trial tracking utilities
const TRIAL_DURATION_DAYS = 14;
const TRIAL_STORAGE_KEY = 'ai-tracker-trial-v1';

/**
 * Initialize or get trial data for a user
 */
export function initializeTrial(userId) {
  const existingTrial = getTrialData(userId);
  
  if (existingTrial) {
    return existingTrial;
  }
  
  // Create new trial
  const trialData = {
    userId,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    analysesUsed: 0,
    maxAnalyses: 1, // Free tier: 1 analysis
    isActive: true
  };
  
  saveTrialData(userId, trialData);
  return trialData;
}

/**
 * Get trial data for a user
 */
export function getTrialData(userId) {
  if (!userId) return null;
  
  try {
    const stored = localStorage.getItem(`${TRIAL_STORAGE_KEY}-${userId}`);
    if (!stored) return null;
    
    const trialData = JSON.parse(stored);
    
    // Check if trial has expired
    const now = new Date();
    const endDate = new Date(trialData.endDate);
    
    if (now > endDate) {
      trialData.isActive = false;
      trialData.isExpired = true;
      saveTrialData(userId, trialData);
    }
    
    return trialData;
  } catch (e) {
    console.error('Error reading trial data:', e);
    return null;
  }
}

/**
 * Save trial data
 */
function saveTrialData(userId, trialData) {
  if (!userId) return;
  
  try {
    localStorage.setItem(`${TRIAL_STORAGE_KEY}-${userId}`, JSON.stringify(trialData));
  } catch (e) {
    console.error('Error saving trial data:', e);
  }
}

/**
 * Increment analysis count
 */
export function incrementAnalysisCount(userId) {
  const trialData = getTrialData(userId);
  if (!trialData) return null;
  
  trialData.analysesUsed = (trialData.analysesUsed || 0) + 1;
  saveTrialData(userId, trialData);
  
  return trialData;
}

/**
 * Check if user can run another analysis
 */
export function canRunAnalysis(userId) {
  const trialData = getTrialData(userId);
  if (!trialData || !trialData.isActive) return false;
  
  return trialData.analysesUsed < trialData.maxAnalyses;
}

/**
 * Get days remaining in trial
 */
export function getDaysRemaining(userId) {
  const trialData = getTrialData(userId);
  if (!trialData || !trialData.isActive) return 0;
  
  const now = new Date();
  const endDate = new Date(trialData.endDate);
  const diff = endDate - now;
  
  if (diff <= 0) return 0;
  
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get trial status summary
 */
export function getTrialStatus(userId) {
  const trialData = getTrialData(userId);
  if (!trialData) {
    return {
      isActive: false,
      daysRemaining: 0,
      analysesUsed: 0,
      maxAnalyses: 0,
      isExpired: false,
      canRunAnalysis: false
    };
  }
  
  const daysRemaining = getDaysRemaining(userId);
  const isExpired = daysRemaining === 0;
  
  return {
    isActive: trialData.isActive && !isExpired,
    daysRemaining,
    analysesUsed: trialData.analysesUsed || 0,
    maxAnalyses: trialData.maxAnalyses || 1,
    isExpired,
    canRunAnalysis: canRunAnalysis(userId),
    endDate: trialData.endDate
  };
}

/**
 * Check if user has active subscription (from Clerk metadata)
 */
export function hasActiveSubscription(user) {
  const subscription = user?.publicMetadata?.subscription;
  const statusOk = subscription?.status === 'active' || subscription?.status === 'trialing';
  const hasPlan = (subscription?.questionLot ?? 0) > 0;
  return Boolean(statusOk && hasPlan);
}
