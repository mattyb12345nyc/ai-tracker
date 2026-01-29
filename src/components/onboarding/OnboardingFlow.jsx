import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import WelcomeScreen from './WelcomeScreen';
import BrandConfigScreen from './BrandConfigScreen';

const ONBOARDING_DRAFT_KEY = 'onboarding_draft';

export default function OnboardingFlow({
  onComplete,
  questionsCount: questionsCountProp,
  frequency: frequencyProp,
  planTier: planTierProp,
}) {
  const [step, setStep] = useState(1);
  const [welcomeData, setWelcomeData] = useState(null);
  const [restored, setRestored] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const questionsCount = (questionsCountProp ?? parseInt(searchParams.get('questions'), 10)) || 10;
  const frequency = (frequencyProp ?? searchParams.get('frequency')) || 'weekly';
  const planTier = (planTierProp ?? searchParams.get('tier')) || 'starter';

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (!raw) {
        setRestored(true);
        return;
      }
      const draft = JSON.parse(raw);
      if (draft?.step === 2 && draft?.welcomeData) {
        setStep(2);
        setWelcomeData(draft.welcomeData);
      }
      sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);
    } catch (_) {
      sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);
    } finally {
      setRestored(true);
    }
  }, []);

  const goToPricing = () => {
    try {
      sessionStorage.setItem(
        ONBOARDING_DRAFT_KEY,
        JSON.stringify({ step: 2, welcomeData })
      );
    } catch (_) {}
    navigate('/pricing?from=onboarding');
  };

  if (!restored) return null;

  if (step === 1) {
    return (
      <WelcomeScreen
        onContinue={(data) => {
          setWelcomeData(data);
          setStep(2);
        }}
      />
    );
  }

  return (
    <BrandConfigScreen
      welcomeData={welcomeData}
      onBack={() => setStep(1)}
      onContinue={(data) => onComplete?.(data)}
      onSkipOnboarding={() => {
        onComplete?.({ skipped: true, ...welcomeData });
        navigate('/dashboard');
      }}
      onUpgradePlan={goToPricing}
      questionsCount={questionsCount}
      frequency={frequency}
    />
  );
}
