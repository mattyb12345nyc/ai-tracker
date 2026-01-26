import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import App from './App.jsx'
import LoginPage from './components/LoginPage.jsx'
import SignUpPage from './components/SignUpPage.jsx'
import Dashboard from './components/Dashboard.jsx'
import './index.css'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
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
            <Route path="/dashboard" element={<ProtectedDashboard />} />
            <Route path="/*" element={<ProtectedApp />} />
          </Routes>
        </BrowserRouter>
      </ClerkProvider>
    </React.StrictMode>,
  )
}
