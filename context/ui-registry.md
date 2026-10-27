# UI Registry

Living document. Updated after every component is built. Read this before building any new component and match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here.
2. If yes, match its exact classes.
3. If no, build it following `ui-rules.md` and `ui-tokens.md`, then add it here.

After building any component, record: name, file path, props, and exact classes used.

### Entry format

```
### ComponentName
- Path: components/<area>/ComponentName.tsx
- Type: server | client
- Props: { ... }
- Classes: <exact key classes>
- Used in: <pages>
```

---

## Components

### Navbar

- Path: `components/layout/Navbar.tsx`
- Type: client (`usePathname` for the active link)
- Props: none
- Classes: `sticky top-0 z-40 w-full border-b border-border bg-surface`; inner `mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-4 md:px-6`; logo `truncate text-base font-semibold text-text-primary`; nav link `text-sm font-medium`, active `text-accent`, inactive `text-text-secondary hover:text-text-primary`
- Used in: every page, through `PageShell`
- State coverage: **logged-out only.** The right side is a static **Sign in** (`variant="secondary"`) and **Sign up** button pair. Feature 06 replaces it with `NavbarAuth` (four mock states) and feature 10 wires real Clerk state. **Dashboard** and **Add property** are intentionally absent: both are signed-in-only.

### PageShell

- Path: `components/layout/PageShell.tsx`
- Type: server
- Props: `{ children: ReactNode }`
- Classes: outer `flex min-h-screen flex-col bg-background`; main `mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 md:px-6`
- Used in: `app/layout.tsx` (wraps every page). Also renders `<Toaster />` from `components/ui/sonner`.

### Footer

- Path: `components/layout/Footer.tsx`
- Type: server
- Props: none
- Classes: `border-t border-border bg-surface`; inner `mx-auto flex w-full max-w-[1200px] flex-col gap-2 px-4 py-6 text-xs text-text-muted md:flex-row md:items-center md:justify-between md:px-6`

### shadcn primitives (`components/ui`)

Installed with the shadcn CLI (style `new-york`, base colour `neutral`, CSS variables, icon library lucide). Each file was then adjusted to the project tokens:

| File | Adjustment |
| ---- | ---------- |
| every `*.tsx` | imports `cn` from `@/lib/utils` — the CLI emitted `import { cn } from "cn"` and added the `cn` npm package, which was removed |
| `button.tsx` | `default` → `bg-accent text-accent-foreground hover:bg-accent-dark`; `secondary` → `border border-border bg-surface text-text-primary hover:bg-surface-secondary`; `ghost` → `text-text-secondary hover:bg-surface-secondary`; `destructive` → `bg-error text-error-foreground` |
| `badge.tsx` | `text-white` → `text-error-foreground`; `[a&]:hover:bg-accent` → `[a&]:hover:bg-surface-secondary` |
| `input.tsx`, `textarea.tsx`, `select.tsx` | `bg-transparent` → `bg-surface`; neutral focus/hover → `bg-surface-secondary focus:text-text-primary` |
| `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx` | `bg-black/50` → `bg-overlay`; content `bg-background` → `border-border bg-surface` |
| `dropdown-menu.tsx`, `select.tsx` | item `focus:bg-accent` → `focus:bg-surface-secondary focus:text-text-primary` |
| `skeleton.tsx` | `bg-accent` → `bg-surface-secondary` |
| `sonner.tsx` | dropped `next-themes` (light-only app) and set `theme="light"` |

`--color-accent`, `--color-background` and `--color-border` are deliberately **not** remapped in `globals.css`: they are project tokens (teal brand, page background, default border). shadcn's neutral hovers were rewritten to `bg-surface-secondary` instead, which is why the table above exists. Do not add a shadcn component without running the same check.

### Status colours

Mapping lives in `ui-tokens.md`: Active `bg-success-light text-success-foreground`, Draft `bg-info-light text-info-foreground`, Off market `bg-warning-light text-warning-foreground`, Sold `bg-neutral-light text-neutral-foreground`. `StatusBadge` (feature 04) is the single component that applies them; the scratch page previews the classes.

---

## Scratch page (temporary)

- Path: `app/(public)/style-guide/page.tsx` (client)
- Purpose: feature 03's "scratch page" — buttons, inputs, badges, status colours, card/table/skeleton and the overlays, all in token colours.
- **Delete it in feature 04** once `/` and `/properties` are real. `app/(public)/page.tsx` is a placeholder that links to it.

---

## Planned Components (build in this order)

| Component        | Path                                   | Phase | Status |
| ---------------- | -------------------------------------- | ----- | ------ |
| Navbar           | `components/layout/Navbar.tsx`         | 1     | done (logged-out state) |
| PageShell        | `components/layout/PageShell.tsx`      | 1     | done |
| Footer           | `components/layout/Footer.tsx`         | 1     | done |
| StatusBadge      | `components/properties/StatusBadge.tsx`| 1     | not built |
| PropertyCard     | `components/properties/PropertyCard.tsx`| 1    | not built |
| PropertyGrid     | `components/properties/PropertyGrid.tsx`| 1    | not built |
| SearchFilters    | `components/properties/SearchFilters.tsx`| 1   | not built |
| Pagination       | `components/ui/Pagination.tsx`         | 1     | not built |
| PropertyGallery  | `components/properties/PropertyGallery.tsx`| 1 | not built |
| PropertyFacts    | `components/properties/PropertyFacts.tsx`| 1   | not built |
| PropertyForm     | `components/properties/PropertyForm.tsx`| 1    | not built |
| DashboardTable   | `components/dashboard/DashboardTable.tsx`| 1   | not built |
| EmptyState       | `components/ui/EmptyState.tsx`         | 1     | not built |
| AuthPageLayout   | `components/auth/AuthPageLayout.tsx`   | 1     | not built |
| NavbarAuth       | `components/layout/NavbarAuth.tsx`     | 1     | not built |
| MediaUploader    | `components/properties/MediaUploader.tsx`| 5   | not built |
| ConfirmDialog    | `components/ui/ConfirmDialog.tsx`      | 2     | not built |
