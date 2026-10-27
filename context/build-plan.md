<!-- Build plan: features broken into phases with clear done criteria -->

# Build Plan

## Core Principle

UI first, with mock data, verified visually before any logic is written. Then each capability is wired in thin vertical slices: DB → auth → geocoding → media → cache. Every feature must be visible and testable before the next begins. No invisible backend phases. Each feature ends with a **Done when** checklist; do not mark it complete until every box is true, and `pnpm lint && pnpm typecheck && pnpm build` pass.

Dependencies between phases are strict: do not begin a phase until the previous one is complete.

---

## Phase 0 — Foundation

### 01 Project scaffold

Create the Next.js project with all tooling and folder structure.

**Logic:**

- Scaffold with `pnpm create vinext-app@latest` (Cloudflare target; TypeScript, App Router, Tailwind). Requires Node.js ≥ 22.18. It should produce `vite.config.ts` and `cloudflare.config.ts` (the `cf` flow). If it produces `wrangler.jsonc` instead, stop and either run `cf migrate` or re-scaffold: this project does not use Wrangler. For an existing Next.js app, `cf init .` does the same setup. Use `pnpm`, no `src/`, `@/*` alias, add ESLint, set `"type": "module"`.
- Enable `strict` and `noUncheckedIndexedAccess` in tsconfig.
- Create every folder from `architecture.md` (with `.gitkeep` where empty).
- Install only approved dependencies. Add scripts listed in `code-standards.md`.
- Add `.gitignore` entries: `.dev.vars*`, `.env*.local`, `.cloudflare/`, `.secrets*`.
- Add `AGENTS.md` and `/context`.

**Done when:**

- [ ] `pnpm dev` (`cf dev`) serves a blank page
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` pass
- [ ] Folder tree matches `architecture.md`

---

### 02 Cloudflare CLI, bindings, and stack spike

Run the app on Workers with `cf`, declare D1/KV/R2, deploy a hello-world, and prove the stack works with Clerk before building on it.

**Setup (human, once):**

- `npm install --global cf`, then `cf auth login`. Node.js ≥ 22.18.

**Logic:**

- Confirm `vite.config.ts` (vinext + Cloudflare Vite plugin) and `cloudflare.config.ts` exist from feature 01. If any `wrangler.*`, `open-next.config.ts`, or `.open-next/` exists, stop (see Invariants in `architecture.md`).
- In `cloudflare.config.ts` declare `DB` (`bindings.d1`), `KV` (`bindings.kv`), `MEDIA` (`bindings.r2`), and `compatibilityFlags: ["nodejs_compat"]`. Confirm builder option names with TypeScript completion or `cf docs search`; don't guess. Let `cf deploy` provision the resources.
- `lib/cloudflare.ts` exporting `getEnv()` (see `library-docs.md`). Add `.cloudflare/types` to tsconfig `include`; run `cf workers types` if needed.
- Package scripts per `code-standards.md`.
- Temporary `/api/health` route using `getEnv()`: reads one KV key, runs `SELECT 1` on D1, and lists one R2 object; returns JSON status for each.
- Create `.dev.vars.example` and `.env.example`.
- **Go/no-go spike (Clerk):** install `@clerk/nextjs` (keyless mode is fine; no keys needed yet). Add a throwaway `proxy.ts` with `clerkMiddleware()`, wrap the layout in `<ClerkProvider>`, and call `auth()` in a server component and a Server Action. Run under `cf dev` (apply the workaround in `library-docs.md` if it hits `require is not defined`) and under `cf build`. Record the result in `progress-tracker.md`. If it cannot be made to work, **stop and ask the user**. Do not switch to OpenNext or Wrangler on your own. Remove the spike code afterward; feature 10 does the real integration.

**Done when:**

- [ ] `cf dev` serves the app in workerd; `/api/health` reports D1, KV, R2 all `ok` locally
- [ ] `cf build` and `cf deploy --dry-run` succeed without credentials
- [ ] After `cf auth login`, `cf deploy` publishes to a `*.workers.dev` URL and `/api/health` passes there
- [ ] The Clerk spike result (works / needs workaround / blocked) is recorded in the tracker
- [ ] No `wrangler.*`, `open-next.config.ts`, or `.open-next/` exists in the repo
- [ ] `/api/health` is removed or restricted before Phase 7 ends

---

### 03 Design tokens and app shell

Apply the design system and build the global layout.

**UI:**

- `globals.css` with the full `@theme` block from `ui-tokens.md`; map shadcn variables to tokens.
- Inter via `next/font/google` in `app/layout.tsx`.
- `Navbar` (logged-out state, with static placeholder links), `PageShell`, footer.
- Install shadcn: `button input label select textarea card badge dialog alert-dialog sheet skeleton table dropdown-menu sonner`.

**Done when:**

- [ ] A scratch page shows buttons, inputs, badges in correct token colors
- [ ] No hex values or raw color classes in any component
- [ ] Navbar and footer render on every page and are responsive
- [ ] Components added to `ui-registry.md`

---

## Phase 1 — Full UI with Mock Data

All screens built against a typed mock module `lib/mock-data.ts` (12+ properties, mixed statuses, with placeholder images). The mock module is deleted in Phase 2.

### 04 Public browsing UI

**UI:**

- `/` landing: hero, search box (submits to `/properties?q=`), featured grid (first 6 mock active).
- `/properties`: `SearchFilters` (q, min/max price, min beds, min baths), sort select, `PropertyGrid` of `PropertyCard`, `Pagination`, empty state, loading skeleton.
- `/properties/[id]`: `PropertyGallery`, price, `StatusBadge`, address block, facts (beds, baths), coordinates line with external map link, `not-found.tsx`.
- Filters live in the URL query string and are parsed with the Zod search schema.

**Done when:**

- [ ] Filtering and pagination work against the mock list, driven by URL params
- [ ] Mobile layout moves filters into a `Sheet`
- [ ] Empty, loading, and not-found states all render
- [ ] `PropertyCard`, `PropertyGrid`, `SearchFilters`, `Pagination`, `StatusBadge`, `PropertyGallery`, `PropertyFacts`, `EmptyState` are in `ui-registry.md`

---

### 05 Agent UI: form and dashboard

**UI:**

- `PropertyForm` with sections Address / Details / Status, using `react-hook-form` + Zod resolver (schema from `validations/property.ts`). Submit is a no-op toast for now.
- `/properties/new` and `/properties/[id]/edit` (edit pre-fills from mock) using the same form.
- `MediaUploader` placeholder block on the edit page (non-functional).
- `/dashboard`: `DashboardTable` with Edit link and Delete (`ConfirmDialog`, no-op), empty state.

**Done when:**

- [ ] Validation errors show inline for every required field
- [ ] Bathrooms accept 0.5 steps; price takes whole dollars
- [ ] Delete shows a confirmation dialog naming the property

---

### 06 Auth page shells and navbar states

Layout and navigation states only. The real Clerk components are wired in feature 10.

**UI:**

- `AuthPageLayout` and placeholder pages at `/sign-in/[[...sign-in]]` and `/sign-up/[[...sign-up]]` (a labelled placeholder card where Clerk's component will go).
- `NavbarAuth` with four mock states toggled by a dev-only flag: signed out, viewer, agent, admin. Signed out shows **Sign in** / **Sign up**; signed in shows a user-menu placeholder; **Add property** is visible for agent and admin only.

**Done when:**

- [ ] Both auth pages render within the page shell on mobile and desktop
- [ ] Navbar renders correctly in all four mock states
- [ ] `AuthPageLayout` and `NavbarAuth` are in `ui-registry.md`

---

## Phase 2 — Database and CRUD

### 07 Schema, migrations, seed

**Logic:**

- `lib/db/schema.ts` for `properties` and `property_media` exactly as in `architecture.md`, with indexes and FKs. There is **no `users` table**: `owner_id` stores the Clerk user ID as plain text.
- `drizzle.config.ts` for D1; `pnpm db:generate`; apply locally with `cf d1 migrations apply <DATABASE_ID> --local` (find the ID with `cf d1 list --local`). Confirm the running `cf dev` server sees the tables (see the local-state note in `library-docs.md`).
- `scripts/seed.sql` (or TS script) inserting ~15 properties across two fake owner IDs (`seed_agent_a`, `seed_agent_b`) in all four statuses. Swap one owner ID for your own Clerk user ID after feature 10 if you want seeded rows on your dashboard.
- Export inferred types in `types/`.

**Done when:**

- [ ] Migrations apply cleanly to a fresh local D1
- [ ] Tables created by the migrations are visible to the running `cf dev` server (Local Explorer shows them)
- [ ] Seed loads; row counts verified via `cf d1 raw <DATABASE_ID> --sql "SELECT COUNT(*) FROM properties" --local`
- [ ] Deleting a property cascades to `property_media` rows

---

### 08 Read path

Wire public pages to D1 and add the JSON read API.

**Logic:**

- `services/properties.ts`: `search(filters, viewer)`, `getById(id, viewer)`, `listByOwner(ownerId)`.
- Public viewer sees `status = 'active'` only; owner/admin see their own regardless.
- `LIKE` search with escaped wildcards across address, city, postal code; sorting (newest, price asc/desc); page size ≤ 50.
- Wire `/`, `/properties`, `/properties/[id]`, and `/dashboard` (temporary: hard-coded seed owner ID) to services.
- `GET /api/properties` and `GET /api/properties/[id]` using the response envelope; non-visible → 404.
- Delete `lib/mock-data.ts`.

**Done when:**

- [ ] All filters work against D1 data
- [ ] A draft property's URL returns 404 to an anonymous request, both page and API
- [ ] No component imports from `services/` or `lib/db`

---

### 09 Write path (temporary identity)

Create, update, and delete through Server Actions.

**Logic:**

- `actions/properties.ts`: `createProperty`, `updateProperty`, `deleteProperty` following the Server Action convention.
- `services/properties.ts`: `create`, `update`, `remove`; dollars → cents; `updated_at` maintained; owner check inside the service.
- Use a stubbed `getCurrentUser()` returning a hard-coded seed owner ID until Phase 3. Mark with `// TODO(phase-3)`.
- Wire `PropertyForm`, delete dialog, toasts, redirect after create.

**Done when:**

- [ ] Create → appears in dashboard and (if active) in public search
- [ ] Edit persists; delete removes the row
- [ ] Server-side validation errors surface as field errors
- [ ] `updated_at` changes on edit

---

## Phase 3 — Authentication and Authorization

### 10 Clerk integration

Replace the stubs and placeholders with real authentication using the Clerk CLI.

**Setup (human, once):**

- Have a Clerk account and the `clerk` CLI installed. Have `cf` signed in (`cf auth login`).

**Logic:**

- Run `clerk init` in the project root. Let it detect Next.js, install `@clerk/nextjs`, and scaffold the provider, proxy, and auth pages. Accept the prompt to install Clerk skills (or run `clerk skill install`).
- **Review everything it generated** and conform it to `architecture.md`: `proxy.ts` at the repo root, `ClerkProvider` in `app/layout.tsx` (keep Inter and token classes), auth pages under `app/(auth)/`. Remove any demo UI.
- Put keys where `code-standards.md` says (publishable key in `.env.local`, secret in `.dev.vars`). Add `.env.example` and update `.dev.vars.example`.
- In the Clerk Dashboard: enable email + password (social optional), customize the session token with `{ "metadata": "{{user.public_metadata}}" }`, and set `publicMetadata.role` on a test user (`clerk open` can jump to dashboard pages).
- Add `types/globals.d.ts` and `lib/auth/guards.ts` (`getOptionalUser`, `requireUser`, `requirePageUser`, `getFreshRole`, `AuthError`).
- Add `lib/clerk-appearance.ts` and pass it to `ClerkProvider`.
- Replace the feature-06 placeholders with `<SignIn />` and `<SignUp />`, and replace the mock navbar flag with the real Clerk state.
- `cf dev` already runs in workerd. Before calling the feature done, also run `cf build && cf deploy --dry-run` and deploy a preview (`cf previews deploy`, or `cf deploy` to `workers.dev`). If `cf dev` crashes with `require is not defined` from `@clerk/nextjs`, use the workaround in `library-docs.md`. Clerk plus `proxy.ts` on vinext is the riskiest integration in the project.

**Done when:**

- [ ] Sign up, sign in, and sign out work under `pnpm dev` **and** on a deployed preview
- [ ] `getOptionalUser()` returns `{ id, role }` inside a Server Action; a new user with no metadata resolves to `agent`
- [ ] Setting `publicMetadata.role` to `viewer` or `admin` takes effect after the session token refreshes
- [ ] Navbar shows the correct state for signed out / viewer / agent / admin
- [ ] The repo contains no password, session, or auth-cookie code and no `users` table

---

### 11 Route protection and ownership

**Logic:**

- `proxy.ts`: `clerkMiddleware` with `createRouteMatcher`, calling `auth.protect()` for `/dashboard`, `/properties/new`, and `/properties/*/edit`. Signed-out users are sent to `/sign-in` and returned to the original page afterward.
- Replace the stubbed identity from feature 09 with `requireUser`. Remove all `TODO(phase-3)`.
- Enforce: only `agent`/`admin` create; only the owner or `admin` can update/delete. Delete re-reads the role with `getFreshRole`.
- Dashboard lists the current user's properties (admin: all).
- Do not pass user-supplied URLs to `redirect()`. Confirm Clerk's `redirect_url` handling does not allow off-site redirects.

**Done when:**

- [ ] Agent A cannot edit or delete Agent B's property via UI **or** by calling the action directly (test)
- [ ] `viewer` cannot reach create or edit
- [ ] Anonymous user is redirected to sign-in, then returned to the intended page
- [ ] An off-site `redirect_url` (e.g. `https://evil.example`) does not leave the site after sign-in

---

## Phase 4 — Geocoding

### 12 Geocoder with KV cache

**Logic:**

- `lib/geocoder/types.ts`, `lib/geocoder/mapbox.ts`, `lib/geocoder/index.ts` (provider selection by `GEOCODER_PROVIDER`).
- `services/geocoding.ts`: normalize → hash → KV `geocode:{hash}` (30 d) → provider (4 s timeout) → cache → return.
- On create, and on update when address fields changed, geocode and store `latitude`, `longitude` (and normalized address fields if returned).
- On failure: save with null coordinates, show "Location not verified".
- Rate limit geocode calls per user (KV counter).
- Detail page shows coordinates and an "Open in maps" link when present.

**Done when:**

- [ ] Valid address stores coordinates; second identical request is served from KV (no provider call)
- [ ] Simulated provider failure still saves the property
- [ ] Editing a non-address field does not call the geocoder
- [ ] API key appears nowhere in client bundles or logs

---

## Phase 5 — Media (R2)

### 13 Upload and serve

**Logic:**

- `lib/r2.ts`, `services/media.ts`, `actions/media.ts`: `uploadMedia`, `updateMediaAlt`, `setCover`, `deleteMedia`.
- Validate mime allow-list, ≤ 10 MB, ≤ 20 files per property. Key `properties/{propertyId}/media/{mediaId}`.
- Insert DB row after R2 put; delete R2 object if insert fails.
- `app/media/[id]/route.ts` streams from R2 with access checks (active parent → public cache; otherwise owner/admin, `private, no-store`).
- Make `MediaUploader` functional: multi-file select/drag-drop, per-file errors, alt text.

**Done when:**

- [ ] Uploaded images appear in the edit page and are stored in R2 under the correct key
- [ ] Wrong type or oversize file is rejected with a readable message
- [ ] Draft property media returns 404 to anonymous and to other agents
- [ ] No page markup contains an R2 key or bucket URL

---

### 14 Gallery wiring and deletion cascade

**Logic:**

- Property cards and detail gallery use the cover image (`is_cover`, else first by `uploaded_at`) via `/media/{id}`; placeholder when none.
- PDFs/floor plans shown as downloadable document rows.
- Deleting a property removes all R2 objects under its prefix, then DB rows (log and continue on R2 failure).
- Deleting the cover promotes the next image.

**Done when:**

- [ ] Public detail page shows gallery and documents
- [ ] After deleting a property, the R2 prefix is empty
- [ ] Listings still render if R2 is unavailable (simulate by unbinding locally)

---

## Phase 6 — Caching and Events

### 15 KV cache and event-driven invalidation

**Logic:**

- `lib/events.ts`: `emitPropertyEvent(name, payload)` implementing the table in `code-standards.md`.
- Call emitters from every property and media mutation.
- `services/properties.search` (public viewer only) uses `properties:list:{version}:{queryHash}` (TTL 60 s); `getById` uses `properties:{id}` (TTL 300 s) for public-visible properties.
- Owner/admin and draft views bypass cache.
- Cache helpers swallow KV errors (miss).

**Done when:**

- [ ] Second identical public search is a KV hit (verify via log or debug header in dev)
- [ ] Creating, editing, or deleting a property makes the next public search reflect it immediately
- [ ] With KV unavailable, public pages still render from D1
- [ ] Cached values contain no data that is non-public

---

## Phase 7 — Hardening and Release

### 16 Security pass

**Logic:**

- KV rate limits on geocode and media-upload actions, keyed by Clerk user ID. Sign-in and sign-up abuse protection is Clerk's: enable bot protection in the Clerk Dashboard.
- Security headers via `next.config` or `proxy.ts`: `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and a `Content-Security-Policy` that allows Clerk's script, frame, connect, and image origins (follow Clerk's CSP guide; also allow `fonts.googleapis.com` and `fonts.gstatic.com` because vinext loads `next/font/google` at runtime; include Cloudflare Turnstile if bot protection is on).
- Audit: every Server Action has `requireUser` and an ownership check; every service read applies the viewer filter; no secret in client code; logs contain no PII.
- Remove or auth-protect `/api/health`.
- Document Cloudflare WAF managed rules in `progress-tracker.md` (dashboard config, not code).

**Done when:**

- [ ] Checklist above verified and recorded in the tracker
- [ ] Clerk bot protection is on; geocode and upload rate limits return a readable error when exceeded

---

### 17 Tests

**Logic:**

- `vitest` unit tests: Zod schemas, `formatPrice`, query hashing, role resolution from session claims (missing role → `agent`), search filter builder, viewer visibility rules.
- Service-level tests against a local D1 (Miniflare) for ownership and visibility.
- Mock `@clerk/nextjs/server` (`auth`, `clerkClient`) in unit and service tests.
- One end-to-end smoke checklist documented (manual or scripted): sign up → create → upload → public view → delete.

**Done when:**

- [ ] `pnpm test` passes
- [ ] IDOR tests for update, delete, and media cover all three roles

---

### 18 Failure-mode review

**Logic:**

- Walk the table in `architecture.md → Failure Behavior`, simulating each outage locally, and fix gaps.
- Verify every route group has `error.tsx`, `/properties/[id]` has `not-found.tsx`.
- Log a list of known orphan-cleanup cases (R2 delete failure) in the tracker.

**Done when:**

- [ ] Each row in the failure table has been exercised and behaves as documented

---

### 19 Production deploy

**Logic:**

- Provision production D1/KV/R2: `cf deploy` provisions missing resources for bindings that omit IDs, or find the create commands with `cf cli search "create D1 database"` and run them with `--dry-run` first. Apply migrations to the **remote** database with `cf d1 migrations apply <DATABASE_ID>` (no `--local`; remote is the default).
- Create the Clerk **production** instance in the Clerk Dashboard. Add the DNS records Clerk lists to Cloudflare DNS as **DNS only** (grey cloud, not proxied). `cf dns records create --zone <ZONE_ID> --body '{...,"proxied":false}' --dry-run` previews the request first. Use `clerk deploy --mode agent` for a read-only snapshot of production configuration status.
- Swap to production keys (`pk_live_...`, `sk_live_...`); set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` at build time and include `CLERK_SECRET_KEY` in the secrets file passed to `cf deploy --secrets-file`.
- Recreate the session-token customization and role metadata in the production instance. Dev and prod do not share users or config.
- Put secrets (`GEOCODER_API_KEY`, `CLERK_SECRET_KEY`) in a git-ignored JSON or `.env` secrets file and pass it with `cf deploy --secrets-file <path>`. Production plain values are `bindings.text()` entries in `cloudflare.config.ts`.
- `cf deploy` (via `pnpm deploy`); attach the custom domain with `worker.domains` in `cloudflare.config.ts` and redeploy; confirm Cloudflare proxy (CDN + WAF) is enabled.
- Set Cache-Control so public pages are edge-cacheable only when no Clerk session cookie (`__session`) is present; authenticated responses are `private, no-store`.
- Promote the first admin in the Clerk production Dashboard (`publicMetadata.role = "admin"`).

**Done when:**

- [ ] Smoke checklist passes on production
- [ ] Authenticated pages are never edge-cached
- [ ] Tracker marked complete

---

## Feature Count

| Phase     | Name                         | Features |
| --------- | ---------------------------- | -------- |
| 0         | Foundation                   | 3        |
| 1         | Full UI with Mock Data       | 3        |
| 2         | Database and CRUD            | 3        |
| 3         | Authentication & Authorization | 2      |
| 4         | Geocoding                    | 1        |
| 5         | Media (R2)                   | 2        |
| 6         | Caching and Events           | 1        |
| 7         | Hardening and Release        | 4        |
| **Total** |                              | **19**   |
