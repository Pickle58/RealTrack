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
- State coverage: **all four mock states** (feature 06). Links are **Browse** always plus **Dashboard** whenever the mock state is signed in; the right side is `NavbarAuth`. Feature 10 replaces `getMockAuthState()` with Clerk's `<SignedIn>` / `<SignedOut>` and deletes `lib/mock-auth.ts`.

### NavbarAuth

- Path: `components/layout/NavbarAuth.tsx`
- Type: client (`getMockAuthState()`, dropdown, toast)
- Props: none
- Classes: both states wrap in `flex shrink-0 items-center gap-2`; signed out is **Sign in** (`variant="secondary" size="sm"`) and **Sign up** (`size="sm"`); signed in is **Add property** (`size="sm"`, `Plus` icon, label `sr-only sm:not-sr-only` so it is icon-only on mobile with an accessible name) plus an avatar trigger `Button size="icon-sm" className="rounded-full bg-accent-light text-xs font-medium text-accent"` showing initials with `aria-label="Open user menu for {name}"`; menu `DropdownMenuContent align="end" className="w-56"`, label holds name / email / `Role: {role} (mock)`, then a **Dashboard** item and a **Sign out** item
- Used in: `Navbar`, so every page
- Notes: four states come from `lib/mock-auth.ts` (**signed_out**, **viewer**, **agent**, **admin**). **Add property** renders for `agent` and `admin` only; **Sign out** is a no-op toast until feature 10. The menu is a placeholder, not Clerk's `UserButton`.

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

### StatusBadge

- Path: `components/properties/StatusBadge.tsx`
- Type: server
- Props: `{ status: PropertyStatus; className?: string }`
- Classes: the `Badge` primitive with `variant="ghost"` plus one status pair — active `bg-success-light text-success-foreground`, draft `bg-info-light text-info-foreground`, sold `bg-neutral-light text-neutral-foreground`, off_market `bg-warning-light text-warning-foreground`
- Used in: `PropertyCard` (top-left over the cover image), `/properties/[id]`
- Notes: mapping and labels live in this one file (per `ui-tokens.md`). Public pages filter to `active`, so the badge reads Active there; the feature 05 dashboard shows the other three.

### PropertyCard

- Path: `components/properties/PropertyCard.tsx`
- Type: server
- Props: `{ item: PropertyListItem }`
- Classes: `Card className="gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md"`; the whole card is a `Link` to `/properties/{id}`; cover `aspect-[4/3] w-full object-cover`, `object-cover` on a plain `<img>`; `StatusBadge` at `absolute top-3 left-3`; body `flex flex-1 flex-col gap-2 p-6`; price `text-xl font-bold text-accent`; address `text-sm font-medium text-text-primary`; city line `text-xs text-text-muted`; facts row `mt-auto flex items-center gap-4 pt-2 text-sm text-text-secondary` with `size-4` lucide icons
- Used in: `PropertyGrid` on `/` and `/properties`
- Notes: no cover image renders `PropertyImagePlaceholder` instead of an `<img>`

### PropertyGrid

- Path: `components/properties/PropertyGrid.tsx`
- Type: server
- Props: `{ properties: PropertyListItem[] }`
- Classes: `grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3`
- Used in: `/` (featured) and `/properties`

### PropertyImagePlaceholder

- Path: `components/properties/PropertyImagePlaceholder.tsx`
- Type: server
- Props: `{ className?: string }`
- Classes: `flex items-center justify-center bg-surface-secondary` with a `size-8 text-text-muted` `Home` icon and `sr-only` "No photo available"
- Used in: `PropertyCard` (no cover), `PropertyGallery` (no images)
- Notes: this is the neutral block the R2-outage case will use in feature 13/14; sizing comes from the caller

### PropertyFacts

- Path: `components/properties/PropertyFacts.tsx`
- Type: server
- Props: `{ bedrooms: number; bathrooms: number }`
- Classes: `dl` with `grid grid-cols-2 gap-4`; each fact `flex flex-col gap-1`; label `text-xs font-medium text-text-secondary`; value `inline-flex items-center gap-2 text-sm font-medium text-text-primary` with a `size-4 text-text-muted` icon
- Used in: `/properties/[id]`, inside the details card

### PropertyGallery

- Path: `components/properties/PropertyGallery.tsx`
- Type: client (active image + lightbox state)
- Props: `{ images: PropertyImage[]; address: string }`
- Classes: main image button `w-full overflow-hidden rounded-xl border border-border bg-surface-secondary` around an `aspect-[4/3] object-cover` image; thumbnail strip `flex gap-3 overflow-x-auto`, each thumb `h-16 w-20 shrink-0 rounded-md border`, current `border-accent`, others `border-border`; lightbox `DialogContent className="sm:max-w-4xl"` with `max-h-[70vh] object-contain` and an `sr-only` `DialogTitle`
- Used in: `/properties/[id]`
- Notes: the width override must be `sm:max-w-4xl` — the primitive's own `sm:max-w-lg` outranks an unprefixed `max-w-*` class. `DialogContent` needs `aria-describedby={undefined}` because the lightbox has no description.

### SearchFilters

- Path: `components/properties/SearchFilters.tsx`
- Type: client
- Props: `{ initial: PropertySearchInput }`
- Classes: search row `flex flex-col gap-3 sm:flex-row sm:items-center`; search input `pl-9` with an absolutely positioned `size-4 text-text-muted` icon; sort `SelectTrigger className="w-[190px]"`; mobile trigger `Button className="md:hidden" variant="secondary"`; desktop panel `Card className="hidden gap-4 p-6 md:flex md:flex-row md:items-end"`; fields `grid w-full gap-4 sm:grid-cols-2 md:grid-cols-4`, each field a `Label` (`flex-col items-start gap-2 text-text-secondary`) wrapping its `Input`
- Used in: `/properties`
- Notes: holds the only filter form state and writes every applied value through `propertySearchToParams`, so the URL is the source of truth; the page remounts it with `key={filterKey}` and it resets from the prop when the sheet closes without applying. The same `filterFields` element is rendered in the desktop card and inside the `Sheet` (mounted one at a time), which is why the fields carry no `name` or `id`.

### EmptyState

- Path: `components/ui/EmptyState.tsx`
- Type: server
- Props: `{ title: string; description?: string; icon?: ReactNode; action?: ReactNode }`
- Classes: `flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-6 py-12 text-center`; title `text-sm font-medium text-text-primary`; description `text-xs text-text-muted`
- Used in: `/properties` (no matches), `/properties/[id]/not-found.tsx`. Feature 05 reuses it for the dashboard.

### Pagination

- Path: `components/ui/Pagination.tsx`
- Type: server
- Props: `{ page: number; pageCount: number; basePath: string; query?: Record<string, string> }`
- Classes: `nav aria-label="Pagination"` with `flex flex-wrap items-center justify-center gap-2`; Previous/Next are `size="sm" variant="secondary"` buttons (a disabled button of the same style at either end); page numbers are `variant="ghost" size="sm"` links; the current page is a `span` with `aria-current="page"` and `h-8 min-w-8 items-center justify-center rounded-md border border-border bg-surface-secondary px-3 text-sm font-medium text-text-primary`; page-number row `gap-1`, ellipsis `px-1 text-sm text-text-muted`
- Used in: `/properties`
- Notes: renders nothing when `pageCount <= 1`; hrefs are built from `query`, so filters and sort survive paging, and page 1 drops the `page` param entirely
### FormField

- Path: `components/ui/FormField.tsx`
- Type: server
- Props: `{ id: string; label: string; error?: string; hint?: string; className?: string; children: ReactNode }`
- Classes: wrapper `flex flex-col gap-2`; label `text-text-secondary`; hint `text-xs text-text-muted` (`id="{id}-hint"`); error `text-xs text-error` (`id="{id}-error"`)
- Used in: `PropertyForm`
- Notes: the caller puts `aria-invalid` and `aria-describedby="{id}-error"` on its own input, so the error id contract lives here

### PropertyForm

- Path: `components/properties/PropertyForm.tsx`
- Type: client (`react-hook-form` state)
- Props: `{ initial: PropertyFormValues; mode: "create" | "edit" }`
- Classes: form `flex flex-col gap-6`; one `Card className="gap-6 p-6"`; section heading `text-lg font-semibold text-text-primary`; address/status grid `grid gap-4 sm:grid-cols-2`, details grid `grid gap-4 sm:grid-cols-3`; section dividers `h-px bg-border`; price prefix `$` absolutely at `left-3` in `text-text-muted`, input `pl-7`; footer `border-t border-border pt-6` with ghost Cancel link and one primary submit; pending spinner `Loader2` with `animate-spin`
- Used in: `/properties/new`, `/properties/[id]/edit`
- Notes: resolver is `zodResolver(propertyInputSchema)` from `validations/property.ts` with `mode: "onBlur"`; numeric fields validate as strings and transform to numbers on submit, so `PropertyInput` carries numbers and price stays in dollars. Submit only shows a toast until feature 09 wires the Server Action.

### AuthPageLayout

- Path: `components/auth/AuthPageLayout.tsx`
- Type: server
- Props: `{ mode: "sign-in" | "sign-up" }`
- Classes: outer `flex min-h-[calc(100vh-8rem)] items-center justify-center` (header + main padding subtracted, so the footer starts at the fold); column `flex w-full max-w-md flex-col gap-6`; heading `text-3xl font-bold text-text-primary`; description `text-sm leading-6 text-text-secondary`; placeholder `Card className="items-center gap-2 border-dashed px-6 py-10 text-center"` with a `size-10 rounded-full bg-accent-light` icon circle holding a `size-5 text-accent` `LockKeyhole`, a `text-sm font-medium text-text-primary` label, a `max-w-xs text-xs leading-5 text-text-muted` note, and a centred cross-link (`text-accent hover:text-accent-dark`)
- Used in: `/sign-in`, `/sign-up`
- Notes: built in feature 06. The placeholder card is exactly what feature 10 replaces with Clerk's `<SignIn />` / `<SignUp />`; the page shell, heading and cross-link stay.

### MediaUploader

- Path: `components/properties/MediaUploader.tsx`
- Type: server
- Props: none
- Classes: `Card className="gap-4 p-6"`; heading `text-lg font-semibold text-text-primary`; drop zone `flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-surface-secondary px-6 py-10 text-center`; icon `size-8 text-text-muted`
- Used in: `/properties/[id]/edit`
- Notes: **non-functional placeholder** built in feature 05; feature 13 replaces the body with the real uploader

### ConfirmDialog

- Path: `components/ui/ConfirmDialog.tsx`
- Type: client
- Props: `{ trigger: ReactNode; title: string; description: ReactNode; confirmLabel?: string; onConfirm: () => void }`
- Classes: built on the `AlertDialog` primitive; trigger is cloned with `asChild`; cancel button `variant="secondary"`, confirm `variant="destructive"`
- Used in: `DashboardTable`
- Notes: Radix supplies `aria-labelledby` / `aria-describedby`; callers name the item in `title`

### DashboardTable

- Path: `components/dashboard/DashboardTable.tsx`
- Type: client (delete handler)
- Props: `{ items: PropertyListItem[] }`
- Classes: `Card className="gap-0 overflow-hidden p-0"`; header `TableHead className="h-10 px-4 text-xs font-medium tracking-wide uppercase text-text-secondary"`; header row `border-b border-border hover:bg-transparent`; body rows `border-b border-border-light hover:bg-surface-secondary`; cells `px-4 py-3 text-sm text-text-primary`; property cell is an edit link with address `font-medium` and `text-xs text-text-muted` city line; price `font-medium`; updated `text-xs text-text-muted`; actions right-aligned ghost buttons (delete `text-error hover:bg-error-light`); `Table` scrolls horizontally on mobile
- Used in: `/dashboard`
- Notes: columns are Property, Status, Beds, Baths, Price, Updated, Actions. Delete opens `ConfirmDialog` with the address in the title and only toasts until feature 09.

### Status colours

Mapping lives in `ui-tokens.md`: Active `bg-success-light text-success-foreground`, Draft `bg-info-light text-info-foreground`, Off market `bg-warning-light text-warning-foreground`, Sold `bg-neutral-light text-neutral-foreground`. `StatusBadge` is the single component that applies them; the feature 05 dashboard table reuses it.

---

## Scratch page (removed in feature 04)

- Path: `app/(public)/style-guide/page.tsx` (client)
- **Deleted** on 2026-10-27 together with the placeholder `app/(public)/page.tsx`: the real `/` and `/properties` pages replaced both.
- `/style-guide` no longer exists; `app/(public)/page.tsx` is the real landing page.

---

## Planned Components (build in this order)

| Component        | Path                                   | Phase | Status |
| ---------------- | -------------------------------------- | ----- | ------ |
| Navbar           | `components/layout/Navbar.tsx`         | 1     | done (feature 06: Dashboard link + NavbarAuth) |
| PageShell        | `components/layout/PageShell.tsx`      | 1     | done |
| Footer           | `components/layout/Footer.tsx`         | 1     | done |
| StatusBadge      | `components/properties/StatusBadge.tsx`| 1     | done (feature 04) |
| PropertyCard     | `components/properties/PropertyCard.tsx`| 1    | done (feature 04) |
| PropertyGrid     | `components/properties/PropertyGrid.tsx`| 1    | done (feature 04) |
| PropertyImagePlaceholder | `components/properties/PropertyImagePlaceholder.tsx` | 1 | done (added in feature 04) |
| SearchFilters    | `components/properties/SearchFilters.tsx`| 1   | done (feature 04) |
| Pagination       | `components/ui/Pagination.tsx`         | 1     | done (feature 04) |
| PropertyGallery  | `components/properties/PropertyGallery.tsx`| 1 | done (feature 04) |
| PropertyFacts    | `components/properties/PropertyFacts.tsx`| 1   | done (feature 04) |
| PropertyForm     | `components/properties/PropertyForm.tsx`| 1    | done (feature 05) |
| DashboardTable   | `components/dashboard/DashboardTable.tsx`| 1   | done (feature 05) |
| EmptyState       | `components/ui/EmptyState.tsx`         | 1     | done (feature 04) |
| AuthPageLayout   | `components/auth/AuthPageLayout.tsx`   | 1     | done (feature 06) |
| NavbarAuth       | `components/layout/NavbarAuth.tsx`     | 1     | done (feature 06, four mock states) |
| MediaUploader    | `components/properties/MediaUploader.tsx`| 1   | placeholder (feature 05); real upload in feature 13 |
| ConfirmDialog    | `components/ui/ConfirmDialog.tsx`      | 1   | done (feature 05) |
