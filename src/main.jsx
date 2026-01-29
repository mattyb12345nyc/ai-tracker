import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import App from './App.jsx'
import LoginPage from './components/LoginPage.jsx'
import SignUpPage from './components/SignUpPage.jsx'
import Dashboard from './components/Dashboard.jsx'
import PricingPage from './components/PricingPage.jsx'
import OnboardingFlow from './components/onboarding/OnboardingFlow.jsx'
import './index.css'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function ProtectedRoute({ children }) {
  const location = useLocation()
  // Preserve the full URL including query params for redirect after login
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
      <App />
    </ProtectedRoute>
  )
}

function ProtectedVipApp() {
  return (
    <ProtectedRoute>
      <App vipMode={true} />
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

function MissingKeyError() {
  return (
    <div style={{ padding: '2rem', color: 'white', background: '#1a1a2e', minHeight: '100vh' }}>
      <h1>Configuration Error</h1>
      <p>Missing VITE_CLERK_PUBLISHABLE_KEY environment variable.</p>
      <p>Please add your Clerk publishable key to .env file.</p>
    </div>
  )
}

if (!CLERK_PUBLISHABLE_KEY) {
  ReactDOM.createRoot(document.getElementById('root')).render(<MissingKeyError />)
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <BrowserRouter>
          <Routes>
            <Route path="/login/*" element={<LoginPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/onboarding" element={<OnboardingFlow onComplete={(d) => { console.log('Onboarding data:', d); alert(JSON.stringify(d, null, 2)); }} />} />
            <Route path="/dashboard" element={<ProtectedDashboard />} />
            <Route path="/vip/*" element={<ProtectedVipApp />} />
            <Route path="/*" element={<ProtectedApp />} />
          </Routes>
        </BrowserRouter>
      </ClerkProvider>
    </React.StrictMode>,
  )
}
