# Padel Tournament Manager — Design System

## Color Architecture

A semantic token system built on OKLCH for perceptually uniform light/dark adaptation.

### Layer Hierarchy (Surface Elevation)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-bg` | oklch(0.98 0.003 264.54) | oklch(0.11 0.028 261.69) | Page canvas |
| `--color-surface` | oklch(1 0 0) | oklch(0.15 0.028 261.69) | Cards, panes |
| `--color-surface-elevated` | oklch(0.97 0.004 264.54) | oklch(0.19 0.028 261.69) | Hovered cards, dropdowns |
| `--color-surface-modal` | oklch(1 0 0) | oklch(0.21 0.028 261.69) | Modals, dialogs |

### Text Hierarchy

| Token | Light | Dark | Ratio (AA) |
|-------|-------|------|-----------|
| `--color-text-primary` | oklch(0.13 0.028 261.69) | oklch(0.97 0.003 264.54) | 15.4:1 |
| `--color-text-secondary` | oklch(0.45 0.021 264.36) | oklch(0.75 0.016 264.36) | 7.2:1 |
| `--color-text-tertiary` | oklch(0.55 0.021 264.36) | oklch(0.6 0.016 264.36) | 4.6:1 |

### Brand Palette

- **Primary**: Violet (#8B5CF6 equivalent) — CTAs, links, active states
- **Accent**: Cyan (#06B6D4 equivalent) — Secondary actions, highlights
- **Semantic**: Emerald (success), Amber (warning), Red (error)

### Gradient System

```css
/* Brand gradient — violet to cyan */
background: linear-gradient(135deg, var(--color-primary), var(--color-accent));

/* Ambient glow — primary at low opacity */
background: radial-gradient(600px at 50% 0%, var(--color-primary-muted), transparent);
```

---

## Typography

- **Font**: Geist Sans (default), monospace fallback for code
- **Scale**: 12px → 72px across 7 levels (h1–h6 + body + caption)

---

## Spacing

- **Grid**: 4px base (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80)
- **Card padding**: 16px (p-4) or 24px (p-6)
- **Section gap**: 24px (space-y-6)

---

## Component Tokens

| Component | Surface | Border | Hover |
|-----------|---------|--------|-------|
| Card | `--color-surface` | `--color-border` | `--color-surface-elevated` |
| Button (primary) | `--color-primary` | — | `--color-primary-hover` |
| Button (outline) | transparent | `--color-border` | `--color-surface-elevated` |
| Input | `--color-surface` | `--color-input` | `--color-ring` |
| Badge | `--color-primary-muted` | — | — |

---

## Dark Mode

- **Strategy**: Class-based (`.dark` on `<html>`)
- **Persistence**: `localStorage` key `padel-theme`
- **Default**: Respects `prefers-color-scheme` media query
- **Transition**: 0.3s ease-out on `background-color` and `color`

---

## RTL Support

- Arabic locale sets `dir="rtl"` on `<html>`
- CSS targets `[dir="rtl"]` for text alignment
- Component wrappers use `dir={dir}` from `useLocale()`

---

## Animations

| Name | Duration | Easing | Use |
|------|----------|--------|-----|
| `fade-in` | 0.4s | ease-out | Page sections |
| `slide-up` | 0.3s | ease-out | Cards, dialogs |
| `scale-in` | 0.2s | ease-out | Modals |
| `pulse-glow` | 2s | ease-in-out | Focus rings |

Framer Motion is used for staggered list animations via `containerVariants` / `itemVariants`.
