---
name: futureproof-style-guide
description: Apply FutureProof brand styling—orange-to-pink gradients, Dela Gothic One and Poppins typography, Tailwind tokens, and component patterns. Use when styling UI for the AI Visibility Tracker, implementing FutureProof design, or when the user references the style guide, brand, or FutureProof.
---

# FutureProof Style Guide

Apply this visual identity when building or editing UI: bold gradients, display + body fonts, dark backgrounds, and consistent components.

## Quick Reference

### Colors
| Token | Hex | Tailwind |
|-------|-----|----------|
| Sunset Orange | `#F5A623` | `fp-orange` |
| Deep Orange | `#E88D1F` | `fp-orange-deep` |
| Hot Pink | `#D94A8C` | `fp-pink` |
| Magenta | `#D4145A` | `fp-magenta` |
| Electric Pink | `#E91E8C` | `fp-pink-electric` |
| Deep Purple | `#4A1A6B` | `fp-purple` |
| Navy Dark | `#1A1A2E` | `fp-dark` |

**Backgrounds:** Primary `#000000`; elevated `#1A1A2E`. **Text:** White on dark; `rgba(255,255,255,0.7)` for secondary.

### Typography
- **Dela Gothic One** (`font-display`): Headlines, scores, section titles, bold statements. Uppercase + letter-spacing for impact.
- **Poppins** (`font-body`): Body, UI, labels, buttons. Weights 400 (body), 500 (labels), 600 (buttons, subheads).

Add to `index.html` or CSS:
```html
<link href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Tailwind Config
Ensure `tailwind.config.js` extends:

```js
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
```

### Key Patterns (Tailwind)

| Element | Classes |
|---------|---------|
| **Page bg** | `bg-black` |
| **Card (gradient)** | `bg-gradient-fp rounded-xl p-6 text-white` |
| **Card (dark)** | `bg-fp-dark border border-white/10 rounded-xl p-6` |
| **Section header** | `bg-gradient-fp-reverse` (or horizontal) + `font-display uppercase` + white text |
| **Score** | `font-display text-5xl md:text-6xl`; total as `text-3xl opacity-70` |
| **Primary CTA** | `bg-gradient-fp text-white font-body font-semibold px-8 py-4 rounded-lg uppercase tracking-wide hover:shadow-lg hover:shadow-fp-magenta/40 transition-all hover:-translate-y-0.5` |
| **Secondary btn** | `bg-transparent border-2 border-fp-orange text-white font-body font-semibold rounded-lg` |
| **Deco spheres** | `absolute rounded-full bg-gradient-fp opacity-40 md:opacity-60` |

### Spacing & Radius
- **Spacing:** 4px (xs), 8px (sm), 16px (md), 24px (lg), 32px (xl), 48px (2xl), 64px (3xl).
- **Radius:** 4px (sm), 8px (md), 16px (lg), 24px (xl), 9999px (full/pills).

### Do's ✓
- Use the orange→pink gradient for CTAs, headers, score cards, and key visuals.
- Use Dela Gothic One for impact headlines only; Poppins for everything else.
- Keep dark backgrounds (`#000`, `#1A1A2E`) as base; add subtle spheres/dots for depth.
- Maintain high contrast; use white or `text-white/70` on dark.

### Don'ts ✗
- Don't use gradients on small body text (readability).
- Don't use Dela Gothic One for body or labels.
- Don't mix other color schemes (e.g. generic blue/slate) for primary UI.
- Don't use light/white as primary background.
- Don't overcrowd with decorative elements.

## When to Use This Skill

- Styling new pages, components, or modals for the AI Visibility Tracker.
- User says "use the style guide", "FutureProof", "brand", or "match the design".
- Implementing score displays, hero sections, pricing, or dashboards.
- Adding or updating Tailwind/CSS to align with FutureProof.

## Additional Resources

- Full CSS, component snippets, and usage examples: [reference.md](reference.md)
- Project style doc: [STYLE_GUIDE.md](../../../STYLE_GUIDE.md) (project root)
