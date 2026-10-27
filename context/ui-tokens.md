<!-- UI tokens: the design system values the agent must use for all styling -->

# UI Tokens

Design tokens for Real Estate Tracker. **No design file was provided, so this is a neutral default palette** (slate neutrals, deep teal accent). Replace the values in the `@theme` block if you have a brand; keep the token names so components do not change.

---

## How to Use

Tailwind CSS **v4**. Tokens are defined with `@theme` in `app/globals.css`; utilities are generated automatically (`--color-accent` → `bg-accent`, `text-accent`, `border-accent`).

```tsx
// Correct
className="bg-surface text-text-primary border-border"

// Never — hardcoded hex
className="bg-[#F6F7FB]"

// Never — raw Tailwind color scale
className="bg-teal-600 text-gray-600"
```

When shadcn generates components using its own variables (`bg-primary`, `text-muted-foreground`), map them in `globals.css` to the tokens below instead of rewriting each component.

---

## globals.css — Complete Token Definition

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme {
  /* Font */
  --font-sans: "Inter", sans-serif;

  /* Page and surface backgrounds */
  --color-background: #F7F8FA;
  --color-surface: #FFFFFF;
  --color-surface-secondary: #F1F3F6;

  /* Borders */
  --color-border: #E3E7ED;
  --color-border-light: #EEF1F5;

  /* Text */
  --color-text-primary: #111827;
  --color-text-secondary: #5B6472;
  --color-text-muted: #8A93A3;

  /* Primary accent */
  --color-accent: #0F766E;
  --color-accent-dark: #115E59;
  --color-accent-light: #CCFBF1;
  --color-accent-foreground: #FFFFFF;

  /* Status: success (active) */
  --color-success: #10B981;
  --color-success-light: #D1FAE5;
  --color-success-foreground: #047857;

  /* Status: info (draft) */
  --color-info: #3B82F6;
  --color-info-light: #DBEAFE;
  --color-info-foreground: #1D4ED8;

  /* Status: warning (off market) */
  --color-warning: #F59E0B;
  --color-warning-light: #FEF3C7;
  --color-warning-foreground: #92400E;

  /* Status: neutral (sold) */
  --color-neutral-light: #E5E7EB;
  --color-neutral-foreground: #374151;

  /* Error */
  --color-error: #DC2626;
  --color-error-light: #FEE2E2;
  --color-error-foreground: #FFFFFF;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}
```

---

## Color Usage Guide

### Page Layout

| Element           | Token                  |
| ----------------- | ---------------------- |
| Page background   | `bg-background`        |
| Card / surface    | `bg-surface`           |
| Secondary surface | `bg-surface-secondary` |
| Default border    | `border-border`        |
| Light border      | `border-border-light`  |

### Typography

| Element                | Token                 |
| ---------------------- | --------------------- |
| Headings, primary text | `text-text-primary`   |
| Secondary text, labels | `text-text-secondary` |
| Placeholder, muted     | `text-text-muted`     |

### Accent

Used for: primary buttons, active nav item, focus rings, price emphasis.

| Element                | Token                    |
| ---------------------- | ------------------------ |
| Button background      | `bg-accent`              |
| Button hover           | `hover:bg-accent-dark`   |
| Button text            | `text-accent-foreground` |
| Light badge background | `bg-accent-light`        |

### Property Status Badges

| Status       | Background             | Text                           |
| ------------ | ---------------------- | ------------------------------ |
| `active`     | `bg-success-light`     | `text-success-foreground`      |
| `draft`      | `bg-info-light`        | `text-info-foreground`         |
| `off_market` | `bg-warning-light`     | `text-warning-foreground`      |
| `sold`       | `bg-neutral-light`     | `text-neutral-foreground`      |

---

## Typography

| Element           | Size | Weight | Line height | Color token           |
| ----------------- | ---- | ------ | ----------- | --------------------- |
| Page heading      | 30px | 700    | 36px        | `text-text-primary`   |
| Section heading   | 18px | 600    | 28px        | `text-text-primary`   |
| Body text         | 14px | 400    | 20px        | `text-text-primary`   |
| Label             | 14px | 500    | 20px        | `text-text-secondary` |
| Muted / timestamp | 12px | 400    | 16px        | `text-text-muted`     |
| Price (card)      | 20px | 700    | 28px        | `text-accent`         |
| Price (detail)    | 30px | 700    | 36px        | `text-accent`         |

Font: **Inter** via `next/font/google`. Never use a fallback system font as primary.

---

## Spacing

| Token       | Value  | Usage                 |
| ----------- | ------ | --------------------- |
| `gap-2`     | 8px    | Badge and tag gaps    |
| `gap-4`     | 16px   | Section internal gaps |
| `gap-6`     | 24px   | Between sections      |
| `p-4`       | 16px   | Card padding (compact)|
| `p-6`       | 24px   | Card padding (default)|
| `px-4 py-2` | 16/8px | Button padding        |
| `px-2 py-0.5` | 8/2px | Badge padding        |

---

## Component Tokens

### Cards

```
background:    bg-surface
border:        border border-border
border-radius: rounded-xl
padding:       p-6
shadow:        shadow-sm
```

### Buttons

**Primary:** `bg-accent text-accent-foreground hover:bg-accent-dark rounded-md px-4 py-2 font-medium`

**Secondary:** `bg-surface border border-border text-text-primary rounded-md px-4 py-2 hover:bg-surface-secondary`

**Ghost:** `bg-transparent text-text-secondary hover:bg-surface-secondary rounded-md`

**Destructive:** `bg-error text-error-foreground rounded-md px-4 py-2`

### Input Fields

```
background:   bg-surface
border:       border border-border
radius:       rounded-md
padding:      px-3 py-2
text:         text-text-primary
placeholder:  placeholder:text-text-muted
focus:        focus-visible:ring-1 focus-visible:ring-accent focus-visible:border-accent
error:        border-error
```

### Badges

```
border-radius: rounded-full
padding:       px-2 py-0.5
font-size:     text-xs
font-weight:   font-medium
```

---

## Clerk Appearance

Clerk's components must match the design system. Define one `clerkAppearance` object in `lib/clerk-appearance.ts` and pass it to `<ClerkProvider appearance={...}>`.

```typescript
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--color-accent)",
    colorBackground: "var(--color-surface)",
    colorText: "var(--color-text-primary)",
    colorTextSecondary: "var(--color-text-secondary)",
    colorDanger: "var(--color-error)",
    borderRadius: "var(--radius-md)",
    fontFamily: "var(--font-sans)",
  },
};
```

- Use CSS variables so tokens stay the single source of truth. If the installed Clerk version rejects `var(...)` values, put the resolved hex values in this one file and note it in `progress-tracker.md`. This file is the only permitted exception to the no-hex rule.
- Do not restyle Clerk internals with per-element class overrides unless a layout problem requires it.

---

## Invariants

- Never use hex values directly in components. Use tokens.
- Never use raw Tailwind color classes (`bg-teal-600`, `text-gray-600`, `border-gray-200`).
- Font is Inter, imported via `next/font/google`.
- The accent color is the only brand color. Status colors are used only for status and feedback.
- All borders default to `border-border`.
