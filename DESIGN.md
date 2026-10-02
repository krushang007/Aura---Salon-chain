# Aura Minimalist Design System Specification

A clean, modern salon marketplace scheduling interface anchored on a pure white canvas (`#FFFFFF`) with solid black primary CTAs (`#111111`), hairline borders (`#E5E7EB`), and Inter / Outfit display typography. The system reads as confident, minimal modern luxury SaaS — generous whitespace, soft-rounded cards (`12px`), live scheduling UI fragments embedded in cards, and zero distracting clutter.

---

## 1. Design Philosophy

1. **Radical Clarity & Functional Minimalism**:
   - Every UI element serves an explicit purpose.
   - Clean `#FFFFFF` base canvas with subtle micro-textures on hero and authentication surfaces.
   - High-contrast typography for maximum legibility under all ambient lighting conditions.

2. **Luxury Customer-Centric Copywriting**:
   - Zero internal developer terminology: No "5-minute sanitization buffer", "Postgres GiST exclusion", "bcrypt encryption", or "ISO approved" labels.
   - Replaced with customer-friendly luxury copy: *"Dedicated Station & Prep Included"*, *"Guaranteed Chair Reservation"*, and *"Contactless Digital Pass"*.
   - Honest brand presentation: No fake hardcoded ratings (e.g. "4.9 (142 reviews)").

3. **Responsive Viewport Architecture**:
   - Modals and drawers must adhere to strict viewport ceilings (`max-h-[90vh]`) with inner scrollable containers (`overflow-y-auto`). Action buttons ("Confirm", "Cancel", "Reschedule") must remain pinned and reachable on mobile and small laptop screens.
   - Salon discovery cards must maintain uniform flexbox height (`flex flex-col justify-between h-full min-h-[380px]`) so action CTAs align symmetrically across grid columns.

4. **Modern Toast Notification System**:
   - Complete removal of native `window.alert()`.
   - Replaced with non-blocking, auto-dismissing animated toast notifications positioned with high z-index and clear semantic icons (success, error, info).

---

## 2. Design Tokens

### Color Palette

```
Canvas & Surfaces:
  --canvas:                  #FFFFFF
  --surface-soft:            #F8F9FA
  --surface-card:            #FAFAFA
  --surface-elevated:        #FFFFFF
  --surface-dark:            #101010
  --surface-dark-elevated:   #1A1A1A

Borders & Dividers:
  --border-hairline:         #E5E7EB
  --border-subtle:           #F3F4F6
  --border-focus:            #111111

Typography & Ink:
  --ink-primary:             #111111
  --ink-body:                #374151
  --ink-muted:               #6B7280
  --ink-subtle:              #9CA3AF

Semantic Accents:
  --success:                 #10B981
  --success-bg:              #ECFDF5
  --success-text:            #065F46
  --warning:                 #F59E0B
  --warning-bg:              #FFFBEB
  --error:                   #EF4444
  --error-bg:                #FEF2F2
```

### Typography

| Token | Family | Weight | Fallback |
| :--- | :--- | :--- | :--- |
| **Display Headings** | Plus Jakarta Sans / Outfit | 600, 700, 800 | sans-serif |
| **Interface Body** | Inter | 400, 500, 600 | -apple-system, BlinkMacSystemFont |
| **Monospace / Codes** | JetBrains Mono | 400, 500 | monospace |

### Spacing & Layout Grid

- **Base Unit**: 8px baseline grid (`8px`, `16px`, `24px`, `32px`, `48px`, `64px`).
- **Container Max-Widths**:
  - Global Marketplace: `1280px` (`max-w-7xl`)
  - Admin Operations: `1400px`
  - Auth Cards & Single Forms: `480px` (`max-w-md`)
- **Touch Targets**: Minimum `44px` height on all buttons, select inputs, and date pills.

### Border Radii & Elevation

- **Buttons & Inputs**: `8px` (`rounded-lg`)
- **Cards & Modals**: `12px` (`rounded-xl`) to `16px` (`rounded-2xl`)
- **Status Pills & Chips**: `9999px` (`rounded-full`)
- **Shadows**:
  - `shadow-xs`: `0 1px 2px rgba(0, 0, 0, 0.05)`
  - `shadow-sm`: `0 4px 6px -1px rgba(0, 0, 0, 0.05)`
  - `shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.08)`

---

## 3. Component Architecture & Patterns

### 1. Interactive Modals (`Modal.tsx`)
```tsx
<div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl">
  <div className="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0">
    <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
    <button onClick={onClose} aria-label="Close modal">✕</button>
  </div>
  <div className="overflow-y-auto p-6 flex-1 space-y-4">
    {children}
  </div>
  {footer && (
    <div className="p-4 border-t border-neutral-100 bg-neutral-50 shrink-0">
      {footer}
    </div>
  )}
</div>
```

### 2. Toast System (`Toast.tsx`)
- Centralized `ToastProvider` mounted at root layout (`src/app/layout.tsx`).
- Consumed via `const toast = useToast()`.
- Supports `toast.success()`, `toast.error()`, `toast.info()` with automated 4-second dismiss timers and animated exit transitions.

### 3. Salon Marketplace Cards (`SalonCard.tsx`)
- Standardized `min-h-[380px]` with flex-col layout.
- Card header with branch name and neighborhood badge.
- Middle body flexes to absorb variable service counts with fallback tags for outlets awaiting service synchronization.
- Pinned bottom CTA ("Book Appointment") aligning uniformly across rows.

### 4. Digital Appointment Pass (`DigitalPassCard.tsx`)
- Clean geometric QR code container with high contrast.
- 4-step delivery-style visual status tracker (`BOOKED` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED`).
- Prominent 2-hour self-service cancellation window warning.
- Physical station callout (e.g. `Assigned Chair 03 — Wash Bay A`).

---

## 4. Accessibility & Web Standards

- **Color Contrast**: All text pairings achieve WCAG 2.1 AA ratio (`4.5:1` for normal text, `3:1` for large headings).
- **Keyboard Navigation**: Full focus trap on modals, interactive slot buttons with tab indexing, and clear focus rings (`ring-2 ring-neutral-900`).
- **Heading Structure**: Single `<h1>` per page, following standard hierarchy (`<h1>` $\to$ `<h2>` $\to$ `<h3>`).
- **Touch Ergonomics**: All interactive elements satisfy minimum 44×44px tap targets for mobile usability.
