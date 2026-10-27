<!-- UI rules: how the interface behaves — layout, interactions, and component patterns -->

# UI Rules

Concise rules for building Real Estate Tracker UI. Tokens live in `ui-tokens.md`. Check `ui-registry.md` before building any component.

---

## Font

Import Inter via `next/font/google` in the root layout.

```typescript
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
```

Apply `inter.variable` on `<html>`. `--font-sans` is declared in `@theme`.

Under vinext, `next/font/google` loads from Google's CDN at runtime (no self-hosting), so the CSP must allow `fonts.googleapis.com` and `fonts.gstatic.com`.

---

## Layout

- Page max-width: 1200px, centered, horizontal padding `px-4 md:px-6`.
- Main content vertical padding: `py-8`.
- Gap between page sections: `gap-6`.
- Header height: 64px, full width, `bg-surface`, `border-b border-border`, padding `0 24px`.
- Top navbar only. No sidebar.
- Mobile-first: single column under `md`, filters collapse into a `Sheet`.
- Listing grid: 1 column (mobile), 2 (`md`), 3 (`lg`). Gap `gap-6`.

---

## Navbar

Items in order: **Browse**, **Dashboard** (signed-in only). Right side: Clerk-driven auth controls and **Add property** (agent/admin only).

- Active item: `text-accent`, `font-medium`, 14px.
- Inactive item: `text-text-secondary`, `font-medium`, 14px.
- Active indicator: color change only.
- Background: `bg-surface`, full width.

---

## Cards

Every content section lives in a card (see tokens). Never use colored card backgrounds; color goes into badges and text.

**Property card:** cover image (4:3, `rounded-lg`, `object-cover`) → status badge (top-left over image) → price → address line 1 → "city, state" in muted text → row of icon facts: bedrooms, bathrooms. Entire card is a link to `/properties/[id]`.

---

## Typography Hierarchy

- **Section headings**: 18px / 600 / `text-text-primary`
- **Body**: 14px / 400 / `text-text-primary`
- **Muted**: 12px / 400 / `text-text-muted`
- Price is always `text-accent`, formatted with `formatPrice(cents, currency)` (no decimals).

---

## Status Badges

Pill shape, mapping in `ui-tokens.md`. Labels: Draft, Active, Sold, Off market. One `StatusBadge` component, used everywhere.

---

## Buttons

Primary / Secondary / Ghost / Destructive as defined in tokens. One primary button per view. Icon-only buttons need an `aria-label`.

---

## Form Inputs

Use shadcn `Input`, `Select`, `Textarea` styled per tokens. Every field has a visible `Label`. Inline error text under the field in `text-error`, 12px. Bathrooms input is a number with `step=0.5`. Price input shows a `$` prefix and takes whole dollars.

The property form is a single card with grouped sections: **Address**, **Details**, **Status**. Submit button shows a spinner and is disabled while pending (`useActionState` + `pending`).

---

## Table (dashboard)

- No alternating row colors, rows separated by `border-b border-border-light`.
- Column headers: uppercase, 12px, 500, `text-text-secondary`.
- Row text: 14px, `text-text-primary`.
- Hover: `hover:bg-surface-secondary`.
- Columns: Property (address + city), Status, Beds, Baths, Price, Updated, Actions (Edit, Delete).

---

## Media

- Gallery: large cover image plus thumbnail strip; click opens a `Dialog` lightbox.
- Documents (PDF) shown as a file row with icon, name, size, download link.
- Upload area: drag-and-drop zone with file list, per-file progress/error, alt-text input per image.
- Always render `alt` (use `alt_text` or "Photo of {address}").
- Use a plain `<img>`, not `next/image`: media is served from `/media/{id}` and vinext does no build-time image optimization.
- Image failure or R2 outage shows a neutral placeholder block with a home icon.

---

## Empty States

Every list that can be empty has an empty state: short muted text, optional icon, CTA if a next action exists.

- No search results: "No properties match your filters." + **Clear filters**.
- No listings on dashboard: "You haven't added any properties yet." + **Add property**.
- No media: "No photos yet." + **Upload photos** (owner only).

---

## Loading and Error States

- Route-level `loading.tsx` with card skeletons matching final layout.
- Route-level `error.tsx` with human text and a **Try again** button. Never show stack traces or raw messages.
- Toasts (`sonner`) for action success/failure; field errors inline.
- Destructive actions require an `AlertDialog` confirmation naming the item.
- Unverified geocode: small muted note "Location not verified" with an info icon.

---

## Accessibility

- All interactive elements keyboard reachable with visible focus ring (`ring-accent`).
- Color is never the only status signal: badges include text.
- Forms use `aria-invalid` and `aria-describedby` for errors.

---

## Auth Screens (Clerk)

- `/sign-in` and `/sign-up` render Clerk's `<SignIn />` / `<SignUp />` centered on `bg-background` inside the normal page shell (`min-h` fills the viewport below the header). Do not wrap them in an extra card: Clerk renders its own.
- Signed-out navbar: **Sign in** (secondary button) and **Sign up** (primary button). Signed-in navbar: Clerk `UserButton`.
- Role-dependent UI (Add property, Edit, Delete) is hidden for users without permission, but this is cosmetic only. Authorization is enforced on the server.
- Appearance comes from `lib/clerk-appearance.ts` (see `ui-tokens.md`).

---

## Tailwind v4 Note

Tokens are defined in `@theme` in `globals.css`. No `tailwind.config.ts` for colors. Add new tokens to `@theme` and to `ui-tokens.md`.

---

## Do Nots

- Never use Tailwind built-in color classes. Use project tokens.
- Never add gradients to card backgrounds.
- Never use more than one font weight within a single UI element.
- Never show raw error messages to users.
- Never fetch data or call actions' services from inside presentational components.
- Never show non-active properties in any public view.
- Never expose R2 keys or bucket URLs in markup. Media `src` is always `/media/{id}`.
