import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import WelcomeScreen from './WelcomeScreen';
import BrandConfigScreen from './BrandConfigScreen';

export default function OnboardingFlow({
  onComplete,
  questionsCount: questionsCountProp,
  frequency: frequencyProp,
  planTier: planTierProp,
}) {
  const [step, setStep] = useState(1);
  const [welcomeData, setWelcomeData] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const questionsCount = (questionsCountProp ?? parseInt(searchParams.get('questions'), 10)) || 10;
  const frequency = (frequencyProp ?? searchParams.get('frequency')) || 'weekly';
  const planTier = (planTierProp ?? searchParams.get('tier')) || 'starter';

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
      onUpgradePlan={() => navigate('/pricing')}
      questionsCount={questionsCount}
      frequency={frequency}
    />
  );
}
