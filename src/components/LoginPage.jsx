import { SignIn } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const FUTUREPROOF_LOGO = 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/d19d829c-a9a9-4fad-b0e7-7938012be26c/800x200.png';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  // Get redirect URL from query params, default to home
  const redirectUrl = searchParams.get('redirect_url') || '/';

  return (
    <div className="min-h-screen text-white fp-shell">
      <header className="fp-header sticky top-0 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center gap-4">
          <img src={FUTUREPROOF_LOGO} alt="FutureProof" className="h-8" />
          <span className="text-white/20">|</span>
          <span className="font-semibold">AI Visibility Tracker</span>
        </div>
      </header>
      <main className="max-w-md mx-auto px-8 py-16 animate-fadeIn">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full fp-chip text-sm mb-6">
            <Sparkles className="w-4 h-4" /> Sign In to Continue
          </div>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="fp-text-muted">
            Sign in to access your AI visibility dashboard
          </p>
        </div>
        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/sign-up"
            afterSignInUrl={redirectUrl}
            fallbackRedirectUrl={redirectUrl}
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-transparent shadow-none',
                headerTitle: 'text-white',
                headerSubtitle: 'text-white/60',
                socialButtonsBlockButton: 'bg-white/10 border-white/20 text-white hover:bg-white/20',
                formFieldLabel: 'text-white/80',
                formFieldInput: 'bg-white/10 border-white/20 text-white placeholder:text-white/40',
                footerActionLink: 'text-[#ff7a3d] hover:text-[#ff8a80]',
                formButtonPrimary: 'bg-gradient-to-r from-[#ff7a3d] to-[#ff6b4a] hover:opacity-90',
                identityPreviewEditButton: 'text-[#ff7a3d]',
                footer: 'hidden',
                footerAction: 'hidden',
                dividerRow: 'hidden',
                badge: 'hidden',
                internal: 'hidden',
              },
              variables: {
                colorPrimary: '#ff7a3d',
                colorBackground: 'transparent',
                colorText: 'white',
                colorTextSecondary: 'rgba(255, 255, 255, 0.6)',
              }
            }}
          />
        </div>
      </main>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
      `}</style>
    </div>
  );
}
