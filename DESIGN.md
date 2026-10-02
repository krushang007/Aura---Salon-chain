---
version: 1.0.0
name: aura-design-system
description: A clean, modern salon marketplace scheduling interface anchored on pure white canvas (#FFFFFF) with solid black primary CTAs (#111111), hairline borders (#E5E7EB), and Plus Jakarta Sans / Inter typography. The system reads as confident, minimal modern SaaS — generous whitespace, soft-rounded cards (12px), live scheduling UI fragments embedded in cards, and zero distracting clutter.

colors:
  primary: "#111111"
  primary-active: "#242424"
  primary-disabled: "#E5E7EB"
  ink: "#111111"
  body: "#374151"
  muted: "#6B7280"
  muted-soft: "#9CA3AF"
  hairline: "#E5E7EB"
  hairline-soft: "#F3F4F6"
  canvas: "#FFFFFF"
  surface-soft: "#F8F9FA"
  surface-card: "#FAFAFA"
  surface-strong: "#E5E7EB"
  surface-dark: "#101010"
  surface-dark-elevated: "#1A1A1A"
  on-primary: "#FFFFFF"
  on-dark: "#FFFFFF"
  on-dark-soft: "#A1A1AA"
  brand-accent: "#000000"
  success: "#10B981"
  warning: "#F59E0B"
  error: "#EF4444"
  badge-emerald: "#ECFDF5"
  badge-emerald-text: "#065F46"

typography:
  display-font: "Plus Jakarta Sans, sans-serif"
  body-font: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
  mono-font: "JetBrains Mono, monospace"

radii:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"

shadows:
  subtle: "0 1px 2px rgba(0, 0, 0, 0.05)"
  card: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)"
  elevated: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)"
---

# Aura Minimalist Design System

## 1. Design Philosophy
Aura's design language is built on the principle of **radical clarity and functional minimalism**:
- **Pristine White Canvas**: Clean `#FFFFFF` base with subtle dot-grid texture on hero and authentication surfaces.
- **High-Contrast Monochrome Primitives**: Primary buttons and headings use `#111111` for high legibility, paired with `#E5E7EB` 1px hairline borders.
- **Contextual Visual Artifacts**: Live booking previews, contactless QR cards, and interactive schedule matrices are embedded directly inside content cards.
- **Egalitarian Experience**: No VIP tiers, arbitrary badges, or distracting popups. All users receive a fast, responsive, and seamless experience.

## 2. Core Tokens & Spacing
- **Container Widths**: Max `1280px` for desktop marketplace views; centered `480px` for auth and modals; responsive `390px` viewport optimization for mobile.
- **Spacing Scale**: 8px baseline grid (`8px`, `16px`, `24px`, `32px`, `48px`, `64px`).
- **Touch Targets**: Minimum `44px` height on buttons, inputs, and interactive pills.

## 3. UI Primitives
- **Buttons**:
  - Primary: `#111111` background, `#FFFFFF` text, `rounded-lg`, `h-[44px]`, hover brightness transition.
  - Secondary: `#FFFFFF` background, `1px solid #E5E7EB`, `#111111` text, hover `#F9FAFB`.
  - Google SSO: `#FFFFFF` background, `1px solid #E5E7EB`, official multicolor Google "G" icon, centered text `Continue with Google`.
- **Form Inputs**:
  - `1px solid #E5E7EB` border, `rounded-lg`, `px-3.5 py-2.5`, focus ring `ring-2 ring-black/5 border-black`.
- **Badges & Status Steppers**:
  - Delivery-style 4-step progress: `BOOKED` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED`.
  - Status pill: `#ECFDF5` background with `#065F46` text for confirmed appointments.
