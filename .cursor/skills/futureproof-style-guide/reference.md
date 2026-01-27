# FutureProof Style Guide — Reference

Full CSS, components, and usage examples. Use when you need detailed snippets beyond the SKILL.md quick reference.

---

## Color Palette

### Primary Gradient (Orange → Pink/Magenta)
```css
--gradient-primary: linear-gradient(135deg, #F5A623 0%, #E88D1F 25%, #D94A8C 75%, #D4145A 100%);
```

### Backgrounds
```css
--bg-dark: #000000;
--bg-dark-elevated: #1A1A2E;
--bg-gradient-warm: linear-gradient(135deg, #F5A623 0%, #D4145A 100%);
--bg-gradient-soft: linear-gradient(180deg, #F5A623 0%, #E88D1F 50%, #D94A8C 100%);
```

### Text
```css
--text-primary: #FFFFFF;
--text-secondary: rgba(255,255,255,0.7);
--text-on-gradient: #FFFFFF;
--text-dark: #1A1A2E;
```

---

## Type Scale

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Hero Headline | Dela Gothic One | 400 | 48–72px |
| Section Title | Dela Gothic One | 400 | 32–40px |
| Score Display | Dela Gothic One | 400 | 64–96px |
| Subheadline | Poppins | 600 | 24–28px |
| Body Large | Poppins | 400 | 18px |
| Body | Poppins | 400 | 16px |
| Body Small | Poppins | 400 | 14px |
| Button | Poppins | 600 | 16px |
| Label | Poppins | 500 | 12–14px |

---

## Design Elements

### Gradient pill
```css
.gradient-pill {
  background: linear-gradient(90deg, #F5A623 0%, #D4145A 100%);
  border-radius: 9999px;
}
```

### Gradient sphere
```css
.gradient-sphere {
  background: radial-gradient(circle at 30% 30%, #F5A623 0%, #D4145A 100%);
  border-radius: 50%;
}
```

### Dot patterns, X elements, circuit lines
- Dots: gradient palette, 30–60% opacity, corners/behind content.
- X marks: white 40–60% opacity, sparingly.
- Circuit lines: 2px, white 50–70% opacity.

---

## Components (CSS)

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

### Section header
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

### Score display
```css
.score-display {
  font-family: 'Dela Gothic One', cursive;
  font-size: 72px;
  background: linear-gradient(135deg, #F5A623, #D4145A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.score-total { font-size: 48px; opacity: 0.7; }
```

### Buttons
```css
/* Primary */
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

/* Secondary */
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
.nav-link:hover { opacity: 1; }
```

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

## Usage Examples (JSX + Tailwind)

### Hero section
```jsx
<section className="bg-black min-h-screen relative overflow-hidden">
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

### Score card
```jsx
<div className="bg-gradient-fp rounded-xl p-6">
  <div className="flex justify-between items-center">
    <h3 className="font-display text-2xl text-white uppercase">Your Industry</h3>
    <span className="font-display text-5xl text-white">
      20<span className="text-3xl opacity-70">/25</span>
    </span>
  </div>
</div>
```

### CTA button
```jsx
<button className="bg-gradient-fp text-white font-body font-semibold px-8 py-4 rounded-lg uppercase tracking-wide hover:shadow-lg hover:shadow-fp-magenta/40 transition-all hover:-translate-y-0.5">
  Subscribe Now
</button>
```

---

## Logo Usage

- Use on dark backgrounds. Clear space ≥ height of “F” icon. Min width 120px.
- Do not stretch, rotate, or alter colors.
