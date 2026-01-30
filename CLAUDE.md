---
description: 
alwaysApply: true
---

AI Visibility Tracker - Cursor Rules

You are working on the AI Visibility Tracker, a SaaS platform that analyzes how brands are mentioned and recommended across major AI platforms (ChatGPT, Claude, Gemini, Perplexity).

## Tech Stack
- **Frontend**: React 18 + Vite, Tailwind CSS (dark theme)
- **Backend**: Netlify Functions (serverless)
- **Database**: Airtable (Base ID: appgSZR92pGCMlUOc)
- **Auth**: Clerk (@clerk/clerk-react)
- **Billing**: Stripe (subscriptions with volume pricing)
- **Deployment**: Netlify (auto-deploys from GitHub)

## Project Structure
```
ai-tracker/
├── src/
│   ├── App.jsx              # Main app with routing
│   ├── components/          # Reusable components
│   │   ├── BrandedPDFReport.jsx
│   │   └── ...
│   └── index.css            # Tailwind imports
├── netlify/functions/       # Backend API
│   ├── analyze-brand.js     # Extract brand info from URL
│   ├── generate-questions.js # Create buyer-intent questions
│   ├── process-analysis-background.js # Query AI platforms
│   ├── create-checkout-session.js # Stripe checkout
│   └── stripe-webhook.js    # Handle Stripe events
├── .env                     # Local env vars (not in git)
├── CLAUDE.md               # AI assistant context
└── AIRTABLE_SCHEMA.md      # Database schema reference
```

## Key Patterns

### Environment Variables
- Frontend (Vite): `import.meta.env.VITE_*`
- Backend (Netlify Functions): `process.env.*`

### API Calls from Frontend
```javascript
const response = await fetch('/.netlify/functions/function-name', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### Airtable Operations
- Base ID: `appgSZR92pGCMlUOc`
- Dashboard Table: `tblheMjYJzu1f88Ft`
- Raw Question Data: `tblusxWUrocGCwUHb`
- Always check AIRTABLE_SCHEMA.md for field types before writing

### Clerk Auth
```javascript
import { useUser, SignedIn, SignedOut } from '@clerk/clerk-react';
const { user, isLoaded } = useUser();
// Store plan data in user.publicMetadata
```

### Stripe Integration
- Products have volume-based pricing ($50/unit base)
- After checkout, webhook updates Clerk metadata
- User plan stored as: { questionLot, frequency, units }

## Styling Guidelines
- Dark theme: `bg-slate-900`, `bg-slate-800`, `text-white`
- Accent colors: `blue-500`, `blue-600` for CTAs
- Cards: `bg-slate-800 rounded-xl p-6`
- Buttons: `bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg`

## Scoring System
Each AI response scored 0-100:
- **mention**: Was brand mentioned?
- **position**: Where in response? (first=100, second=75)
- **sentiment**: Tone (negative=0, neutral=50, positive=100)
- **recommendation**: Explicitly recommended?
- **overall**: Weighted average

Visibility is reported as a numeric score (0–100) only; letter grades have been removed.

## Current Pricing Model
- Base: $50 per unit
- 1 unit = 1 question tracked for 1 month
- Question lots: 10, 25, 50
- Frequencies: Weekly (4x), Bi-weekly (2x), Monthly (1x)
- Volume discounts: 10% at 21+ units, 20% at 51+, 25% at 100+

## Commands
```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Production build
netlify dev      # Dev with functions (port 8888)
```

## Do's
- Check AIRTABLE_SCHEMA.md before writing to Airtable
- Use existing component patterns
- Test locally before pushing
- Commit with descriptive messages

## Don'ts
- Don't hardcode API keys
- Don't use `sudo` for npm installs
- Don't create new color schemes (use existing dark theme)
- Don't skip error handling in API calls
