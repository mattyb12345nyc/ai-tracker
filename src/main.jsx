import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import AppContent, { AppWithClerk } from './App.jsx'
import LoginPage from './components/LoginPage.jsx'
import SignUpPage from './components/SignUpPage.jsx'
import Dashboard from './components/Dashboard.jsx'
import PricingPage from './components/PricingPage.jsx'
import OnboardingFlow from './components/onboarding/OnboardingFlow.jsx'
import PaidOnboarding from './components/onboarding/PaidOnboarding.jsx'
import './index.css'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const HAS_CLERK = Boolean(CLERK_PUBLISHABLE_KEY)

function ProtectedRoute({ children }) {
  const location = useLocation()
  const returnUrl = location.pathname + location.search

  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl={returnUrl} />
      </SignedOut>
    </>
  )
}

function ProtectedApp() {
  return (
    <ProtectedRoute>
      <AppWithClerk />
    </ProtectedRoute>
  )
}

function ProtectedVipApp() {
  return (
    <ProtectedRoute>
      <AppWithClerk vipMode={true} />
    </ProtectedRoute>
  )
}

function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}

function ProtectedPaidOnboarding() {
  return (
    <ProtectedRoute>
      <PaidOnboarding />
    </ProtectedRoute>
  )
}

// When Clerk is not configured: no auth, main app and dashboard are public
function NoAuthRoutes() {
  return (
    <Routes>
      <Route path="/login/*" element={<LoginPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/onboarding" element={<OnboardingFlow onComplete={(d) => { console.log('Onboarding data:', d); alert(JSON.stringify(d, null, 2)); }} />} />
      <Route path="/onboarding/paid" element={<PaidOnboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/vip/*" element={<AppContent user={null} vipMode={true} />} />
      <Route path="/*" element={<AppContent user={null} />} />
    </Routes>
  )
}

const AppRouter = () => (
  <BrowserRouter>
    {HAS_CLERK ? (
      <Routes>
        <Route path="/login/*" element={<LoginPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/onboarding" element={<OnboardingFlow onComplete={(d) => { console.log('Onboarding data:', d); alert(JSON.stringify(d, null, 2)); }} />} />
        <Route path="/onboarding/paid" element={<ProtectedPaidOnboarding />} />
        <Route path="/dashboard" element={<ProtectedDashboard />} />
        <Route path="/vip/*" element={<ProtectedVipApp />} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    ) : (
      <NoAuthRoutes />
    )}
  </BrowserRouter>
)

if (HAS_CLERK) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <AppRouter />
      </ClerkProvider>
    </React.StrictMode>,
  )
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>,
  )
}
