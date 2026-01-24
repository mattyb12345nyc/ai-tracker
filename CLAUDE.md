# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # Build production bundle to dist/
npm run preview  # Preview production build locally
```

Netlify functions are automatically available at `/.netlify/functions/[name]` during local dev when using `netlify dev`.

## Architecture Overview

AI Visibility Tracker analyzes how brands are mentioned and recommended across four AI platforms (ChatGPT, Claude, Gemini, Perplexity).

### Data Flow

1. **URL Analysis** → User enters brand URL → `analyze-brand.js` calls Claude to extract brand data
2. **Question Generation** → `generate-questions.js` generates 15 buyer-intent questions using Claude
3. **Background Processing** → `process-analysis-background.js` queries all 4 AI platforms in parallel, analyzes responses, saves to Airtable
4. **Email Notification** → SendGrid sends dashboard link to user's email with score/grade preview
5. **Polling & Display** → Frontend polls Airtable every 30 seconds until results appear, or user clicks email link (`?report=SESSION_ID`)

### Key Components

**Frontend (src/App.jsx)**
- Single-file React app with 4-step UI: Setup → Questions → Processing → Complete
- Polls Airtable directly for results using `VITE_AIRTABLE_TOKEN`
- Dark theme with Tailwind CSS

**Netlify Functions (netlify/functions/)**
- `analyze-brand.js` - Sync function, extracts brand info from URL via Claude
- `generate-questions.js` - Sync function, creates buyer-intent questions via Claude
- `process-analysis-background.js` - Background function (15-min timeout), queries 4 AI platforms, scores responses, saves to Airtable

**Database (Airtable)**
- Base ID: `appgSZR92pGCMlUOc`
- Dashboard Table (`tblheMjYJzu1f88Ft`) - Aggregated reports
- Raw Question Data Table (`tblusxWUrocGCwUHb`) - Individual question responses

### API Integrations

| Service | Model | Purpose |
|---------|-------|---------|
| OpenAI | gpt-4o | Query ChatGPT |
| Anthropic | claude-sonnet-4-20250514 | Query Claude + analyze all responses |
| Google | gemini-1.5-flash | Query Gemini |
| Perplexity | llama-3.1-sonar-large-128k-online | Query Perplexity |
| Airtable | REST API | Data storage |

## Environment Variables

Frontend (prefix with `VITE_`):
- `VITE_AIRTABLE_TOKEN` - Read-only Airtable access for frontend

Netlify Functions:
- `CLAUDE_API_KEY` - Anthropic API key
- `OPENAI_API_KEY` - OpenAI API key
- `GEMINI_API_KEY` - Google AI API key
- `PERPLEXITY_API_KEY` - Perplexity API key
- `AIRTABLE_API_KEY` - Airtable read/write access
- `SENDGRID_API_KEY` - SendGrid for dashboard email notifications

## Brand.dev Integration (Future)

When integrating Brand.dev for brand assets (logos, colors, etc.), use the **domain** as the identifier, not the brand name. The domain is extracted from the user-entered URL:

```javascript
// Extract domain: "https://www.example.com/page" → "example.com"
domain = url.replace(/https?:\/\//, '').replace('www.', '').split('/')[0]
```

API endpoint: `https://api.brand.dev/v1/brand/retrieve?domain={domain}`

See `main.py:get_brand_assets()` for reference implementation.

## Scoring System

Each AI response is scored 0-100 on:
- **mention** - Was brand mentioned? (0=no, 100=prominently)
- **position** - Where in response? (100=first, 75=second, 50=mentioned, 0=absent)
- **sentiment** - Tone (0=negative, 50=neutral, 100=positive)
- **recommendation** - Explicitly recommended? (0=no, 100=yes)
- **message_alignment** - Reflects key messages? (0-100)
- **overall** - Weighted average

Visibility Grade: A (90+), B (80-89), C (70-79), D (60-69), F (<60)
