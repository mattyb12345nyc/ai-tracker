# FutureProof Style Guide

## Brand Overview
FutureProof uses a bold, energetic visual identity with vibrant gradients, modern typography, and dynamic geometric elements. The aesthetic is futuristic yet approachable, designed to convey innovation and forward-thinking.

---

## Color Palette

### Primary Gradient (Orange → Pink/Magenta)
Used for backgrounds, CTAs, and key visual elements.
```css
--gradient-primary: linear-gradient(135deg, #F5A623 0%, #E88D1F 25%, #D94A8C 75%, #D4145A 100%);
```

| Color | Hex | Usage |
|-------|-----|-------|
| Sunset Orange | `#F5A623` | Gradient start, accents |
| Deep Orange | `#E88D1F` | Gradient mid, icons |
| Hot Pink | `#D94A8C` | Gradient mid |
| Magenta | `#D4145A` | Gradient end, highlights |
| Electric Pink | `#E91E8C` | Bright accents |

### Secondary Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Deep Purple | `#4A1A6B` | Overlays, shadows |
| Navy Dark | `#1A1A2E` | Dark backgrounds |
| Pure Black | `#000000` | Primary background |
| White | `#FFFFFF` | Text on dark, icons |

### Background Options
```css
/* Dark mode (primary) */
--bg-dark: #000000;
--bg-dark-elevated: #1A1A2E;

/* Gradient backgrounds */
--bg-gradient-warm: linear-gradient(135deg, #F5A623 0%, #D4145A 100%);
--bg-gradient-soft: linear-gradient(180deg, #F5A623 0%, #E88D1F 50%, #D94A8C 100%);
```

---

## Typography

### Fonts
1. **Dela Gothic One** - Display headlines, scores, bold statements
2. **Poppins** - Body text, UI elements, secondary text

### Font Installation
```css
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Poppins:wght@300;400;500;600;700&display=swap');
```

### Type Scale
| Element | Font | Weight | Size | Usage |
|---------|------|--------|------|-------|
| Hero Headline | Dela Gothic One | 400 | 48-72px | Main page titles |
| Section Title | Dela Gothic One | 400 | 32-40px | Section headers like "YOUR INDUSTRY" |
| Score Display | Dela Gothic One | 400 | 64-96px | Large numbers (88, 20/25) |
| Subheadline | Poppins | 600 | 24-28px | Secondary titles |
| Body Large | Poppins | 400 | 18px | Intro paragraphs |
| Body | Poppins | 400 | 16px | Regular text |
| Body Small | Poppins | 400 | 14px | Captions, metadata |
| Button | Poppins | 600 | 16px | CTA buttons |
| Label | Poppins | 500 | 12-14px | Form labels, tags |

### Text Colors
```css
--text-primary: #FFFFFF;          /* On dark backgrounds */
--text-secondary: rgba(255,255,255,0.7);
--text-on-gradient: #FFFFFF;
--text-dark: #1A1A2E;             /* On light backgrounds */
```

---

## Design Elements

### Gradient Shapes
Rounded pill/capsule shapes with the orange-to-pink gradient. Use for:
- Decorative backgrounds
- Progress indicators
- Highlight elements

```css
.gradient-pill {
  background: linear-gradient(90deg, #F5A623 0%, #D4145A 100%);
  border-radius: 9999px;
}
```

### Dot Patterns
Grid of dots forming globe/circular shapes. Colors follow the gradient palette.
- Use as subtle background decoration
- Place in corners or behind content
- Opacity: 30-60% for subtlety

### Gradient Spheres/Circles
Floating orbs with the brand gradient. Use for:
- Corner decorations
- Visual interest
- Depth and dimension

```css
.gradient-sphere {
  background: radial-gradient(circle at 30% 30%, #F5A623 0%, #D4145A 100%);
  border-radius: 50%;
}
```

### X Pattern Elements
Small X marks as decorative grid elements.
- Color: White at 40-60% opacity
- Use sparingly in corners/margins

### Circuit Lines
White line patterns suggesting tech/connectivity.
- Weight: 2px
- Color: White at 50-70% opacity
- Use to connect elements or as border decoration

---

## Components

### Cards
```css
.card {
  background: linear-gradient(135deg, #F5A623 0%, #D4145A 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
}

.card-dark {
  background: #1A1A2E;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 24px;
}
```

### Section Headers
Gradient background with white icon + Dela Gothic One text.
```css
.section-header {
  background: linear-gradient(90deg, #D4145A 0%, #F5A623 100%);
  padding: 16px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-header h2 {
  font-family: 'Dela Gothic One', cursive;
  color: white;
  font-size: 24px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Score Display
Large number with fraction format (20/25).
```css
.score-display {
  font-family: 'Dela Gothic One', cursive;
  font-size: 72px;
  background: linear-gradient(135deg, #F5A623, #D4145A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.score-total {
  font-size: 48px;
  opacity: 0.7;
}
```

### Buttons

#### Primary CTA
```css
.btn-primary {
  background: linear-gradient(90deg, #F5A623 0%, #D4145A 100%);
  color: white;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 16px;
  padding: 14px 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(212, 20, 90, 0.4);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid #F5A623;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  padding: 12px 28px;
  border-radius: 8px;
}
```

### Navigation
```css
.nav {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
}

.nav-link {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  color: white;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.nav-link:hover {
  opacity: 1;
}
```

---

## Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Tight gaps |
| `space-sm` | 8px | Icon gaps, tight padding |
| `space-md` | 16px | Standard padding |
| `space-lg` | 24px | Card padding, section gaps |
| `space-xl` | 32px | Section margins |
| `space-2xl` | 48px | Large section breaks |
| `space-3xl` | 64px | Page section gaps |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Small elements, tags |
| `radius-md` | 8px | Buttons, inputs |
| `radius-lg` | 16px | Cards, modals |
| `radius-xl` | 24px | Large cards, hero elements |
| `radius-full` | 9999px | Pills, circles |

---

## Shadows

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.4);
--shadow-glow: 0 0 40px rgba(212, 20, 90, 0.3);
--shadow-glow-orange: 0 0 40px rgba(245, 166, 35, 0.3);
```

---

## Tailwind Config

Add to `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'fp-orange': '#F5A623',
        'fp-orange-deep': '#E88D1F',
        'fp-pink': '#D94A8C',
        'fp-magenta': '#D4145A',
        'fp-pink-electric': '#E91E8C',
        'fp-purple': '#4A1A6B',
        'fp-dark': '#1A1A2E',
      },
      fontFamily: {
        'display': ['Dela Gothic One', 'cursive'],
        'body': ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-fp': 'linear-gradient(135deg, #F5A623 0%, #D4145A 100%)',
        'gradient-fp-reverse': 'linear-gradient(135deg, #D4145A 0%, #F5A623 100%)',
        'gradient-fp-horizontal': 'linear-gradient(90deg, #F5A623 0%, #D4145A 100%)',
      },
    },
  },
}
```

---

## Usage Examples

### Hero Section
```jsx
<section className="bg-black min-h-screen relative overflow-hidden">
  {/* Decorative spheres */}
  <div className="absolute top-10 left-10 w-24 h-24 rounded-full bg-gradient-fp opacity-60" />
  <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-gradient-fp opacity-40" />
  
  <div className="relative z-10 text-center py-24">
    <h1 className="font-display text-6xl text-white mb-6">
      YOUR AI VISIBILITY SCORE
    </h1>
    <p className="font-body text-xl text-white/70 max-w-2xl mx-auto">
      Track how AI platforms see your brand
    </p>
  </div>
</section>
```

### Score Card
```jsx
<div className="bg-gradient-fp rounded-xl p-6">
  <div className="flex justify-between items-center">
    <h3 className="font-display text-2xl text-white uppercase">
      Your Industry
    </h3>
    <span className="font-display text-5xl text-white">
      20<span className="text-3xl opacity-70">/25</span>
    </span>
  </div>
</div>
```

### CTA Button
```jsx
<button className="bg-gradient-fp text-white font-body font-semibold px-8 py-4 rounded-lg uppercase tracking-wide hover:shadow-lg hover:shadow-fp-magenta/40 transition-all hover:-translate-y-0.5">
  Subscribe Now
</button>
```

---

## Logo Usage

- Primary logo on dark backgrounds (as provided)
- Maintain clear space equal to the height of the "F" icon
- Minimum size: 120px width
- Never stretch, rotate, or alter colors

---

## Do's and Don'ts

### Do's ✓
- Use the gradient liberally for energy and vibrancy
- Maintain high contrast for readability
- Use Dela Gothic One for impact headlines only
- Add subtle decorative elements (dots, spheres, lines)
- Keep dark backgrounds as the primary base

### Don'ts ✗
- Don't use gradients on small text (readability)
- Don't mix other color schemes
- Don't use Dela Gothic One for body text
- Don't overcrowd with decorative elements
- Don't use light/white backgrounds as primary
