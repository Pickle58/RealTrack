<!-- Progress tracker: live build status — update this after every session -->

# Progress Tracker

**Last updated:** 2026-10-27
**Current phase:** Phase 2 — Database and CRUD (features 01–07 complete; feature 08 next)
**Overall status:** Features 01–07 complete. The `cf` + vinext + Clerk stack is proven, the Worker is live at https://real-estate-tracker.pilkington.workers.dev, the UI (design system, public browsing, property form, dashboard, auth shells) runs on typed mock data, and the D1 schema for `properties` and `property_media` is migrated and seeded locally (15 properties, 20 media rows). Feature 08 wires the pages to D1.

---

## Completed
- [x] Technical spec converted into context files
- [x] 01 Project scaffold (2026-10-27) — `pnpm lint`, `pnpm typecheck` and `pnpm build` pass
- [x] 02 Cloudflare CLI, bindings, and stack spike (2026-10-27) — `DB`/`KV`/`MEDIA` declared and provisioned, `/api/health` green locally and on the deployed Worker, Clerk spike passes with the dev-only require shim
- [x] 03 Design tokens and app shell (2026-10-27) — `@theme` tokens + shadcn variable mapping in `globals.css`, Inter loaded, Navbar/PageShell/Footer rendering everywhere, 13 primitives installed and mapped to the tokens, scratch page at `/style-guide`
- [x] 04 Public browsing UI (2026-10-27) — landing hero + featured grid, `/properties` with URL-driven filters, sort and pagination, `/properties/[id]` with gallery, facts, coordinates and map link, plus empty, loading and not-found states; typed mock data in `lib/mock-data.ts` behind `services/properties.ts`
- [x] 05 Agent UI: form and dashboard (2026-10-27) — `PropertyForm` with Address/Details/Status sections on `react-hook-form` + Zod, `/properties/new`, `/properties/[id]/edit` with mock prefill, non-functional `MediaUploader`, and `/dashboard` with `DashboardTable`, `StatusBadge`, `ConfirmDialog` delete and empty state
- [x] 06 Auth page shells and navbar states (2026-10-27) — `AuthPageLayout` behind `/sign-in` and `/sign-up` placeholder pages, `NavbarAuth` with the four mock states from `lib/mock-auth.ts` (signed out / viewer / agent / admin), Dashboard link and role-gated Add property in the navbar
- [x] 07 Schema, migrations, seed (2026-10-27) — `lib/db/schema.ts` (`properties`, `property_media`, 5 + 3 indexes, cascade FK, check constraints, one-cover-per-property unique index), `lib/db/index.ts` (`getDb()`), `drizzle.config.ts`, generated `migrations/0000_slimy_doctor_spectrum.sql` + snapshot, `scripts/seed.sql` (15 properties / 20 media rows across `seed_agent_a` / `seed_agent_b`, all four statuses) and `types/database.ts`; migration applied to the dev server's local D1, cascade and cover constraints verified

- [x] 09 Write path (temporary identity) (2026-10-27) — `actions/properties.ts` exposes `createProperty`, `updateProperty` (returns the id) and `deleteProperty`, all using `lib/action-result.ts`; `services/properties.ts` adds `create`, `update`, `remove` with dollars → cents, `updated_at` set on edit and an owner check inside the service. `getCurrentUser()` is stubbed to `seed_agent_a` with `// TODO(phase-3)`. `PropertyForm` shows server field errors through `useActionState`, redirects to `/dashboard` after create, and the dashboard delete dialog calls the action. Verified in the browser on `cf dev` :5173: create (Active) → dashboard row and public `/api/properties?q=` result; edit persists price and bathrooms, `updated_at` moves; client-side half-bath check shows "Use half-bath increments (0.5)."; delete removes the row (API 404, search empty). `pnpm lint`, `pnpm typecheck` and `pnpm build` pass.

- [x] 08 Read path (2026-10-27) — `services/properties.ts` now queries D1 via Drizzle: `search(filters, viewer)`, `getById(id, viewer)`, `listByOwner(ownerId)`, `getFeaturedProperties()`, `getOwnedProperty(id, ownerId)`. Anonymous/viewer sees `active` only; agent/admin also see their own rows. Search uses escaped `LIKE` over address, city and postal code; price, bedroom and bathroom filters; newest / price sort; page size ≤ 50. Covers are `/media/{id}`. `/`, `/properties`, `/properties/[id]`, `/dashboard` and the edit page read D1. New `GET /api/properties` and `GET /api/properties/[id]` use the envelope, and non-visible rows return 404. `lib/mock-data.ts` is deleted. Verified against the seeded local D1 with `cf dev` on :5173: the API returns active rows only, filters and sorts match, a draft and a sold ID return 404 from the API, and the dashboard shows seeded rows. Viewer identity is still temporary: the dashboard and edit page use `TEMPORARY_OWNER_ID = seed_agent_a` until Clerk lands in feature 10.

## In Progress
- [ ] _(none)_

## Up Next
- [ ] 10 Clerk integration
- [ ] 11 Route protection and ownership
- [ ] 12 Geocoder with KV cache
- [ ] 13 Upload and serve media
- [ ] 14 Gallery wiring and deletion cascade
- [ ] 15 KV cache and event-driven invalidation
- [ ] 16 Security pass
- [ ] 17 Tests
- [ ] 18 Failure-mode review
- [ ] 19 Production deploy

## Blocked
- [ ] 12 Geocoder — **Needs:** a Mapbox (or chosen vendor) API key before real calls can be tested
- [ ] 10 Clerk integration — **Unblocked for code, awaiting sign-in proof** (2026-10-27): the **RealTrack** application (`app_3LIJOkiAsmRiDc7ef3O04uzwKEz`) is created and linked, and its dev keys are wired. Remaining work is feature 10's own scope: `clerk init` scaffolding, email + password, session-token customization, `publicMetadata.role`, and a real sign-up/sign-in test.

---

## Known Issues
| Issue | Severity | Status |
|-------|----------|--------|
| R2 object delete can fail after DB row removal, leaving orphaned objects | Low | Open (accepted; log and review) |
| KV eventual consistency may serve a stale list for up to 60 s in other regions | Low | Accepted |
| Properties are orphaned if a Clerk user is deleted (no webhook built in v1; `clerk open webhooks` when needed) | Low | Open |
| Role changes can lag up to about a minute in session claims | Low | Accepted (`getFreshRole` used for deletes) |
| Clerk dev and prod are separate instances; roles and token customization must be redone for prod | Medium | Tracked in feature 19 |
| Stack maturity: `cf` (beta), Cloudflare Vite plugin 2.0 (beta), vinext ("under active development", not a drop-in for every app) | High | Mitigated by feature-02 go/no-go spike and stop-and-ask rule |
| `cf dev` can crash on `@clerk/nextjs` (`require is not defined`, vinext#4221) | Medium | **Mitigated** (2026-10-27) — dev-only `clerkRequireToImport()` plugin in `vite.config.ts`; the spike passes with it. `cf build` never needed it |
| Clerk has no automatic keyless mode here; without keys every request 500s (`Clerk keys are missing`) | Medium | **Resolved** (2026-10-27) — `RealTrack` app linked and its dev keys pulled |
| `.dev.vars` alone is invisible to Clerk; `CLERK_SECRET_KEY` must be declared as `bindings.secret()` | Medium | **Resolved** (2026-10-27) — binding declared; first deploy needs `--secrets-file .dev.vars` |
| `clerk env pull` writes `VITE_CLERK_PUBLISHABLE_KEY` (it detects Vite, not Next) | Low | Renamed by hand to `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; re-check after every pull |
| `createRouteMatcher` is deprecated in `@clerk/nextjs` 7 and removed in the next major | Low | **Resolved** (2026-10-28) — `proxy.ts` keeps a bare `clerkMiddleware()`; pages protect themselves with `requirePageUser()` → `auth.protect()`, so the matcher API is never used |
| Vite prints "client component dependency is inconsistently optimized" for Clerk's client entry | Low | Accepted — dev-only warning; add `optimizeDeps.exclude` if it becomes noisy |
| `/api/health` is public and unauthenticated | Low | Open — remove or restrict it before Phase 7 ends, per feature 02 |
| Generated shadcn primitives ship `dark:` utilities; the OS dark preference activated them and washed the page out | Medium | **Fixed** (2026-10-27) — `@custom-variant dark (&:is(.dark *))` in `globals.css`; the app is light-only |
| `shadcn init` hangs without a TTY and misdetects Vite | Low | Worked around — `components.json` is committed and hand-written, and components are added with `shadcn add` |
| `shadcn add` emitted `import { cn } from "cn"` and installed `cn` + `next-themes` (unapproved deps) | Low | **Fixed** (2026-10-27) — imports rewritten to `@/lib/utils`, both packages removed, `sonner.tsx` pinned to light |
| Radix overlays look "stuck open" in a hidden browser tab | Low | Documented in library-docs — the animation timeline is frozen, so `animationend` never fires. Not a code defect; disable animations when asserting overlay closure |
| `/style-guide` and the placeholder `app/(public)/page.tsx` are scaffolding | Low | Open — delete both in feature 04 |
| Vite prints "client component dependency is inconsistently optimized" for Clerk's client entry | Low | Accepted — dev-only warning; add `optimizeDeps.exclude` if it becomes noisy (carried over from feature 02)|
| `cf d1 ... --local` state differs from the dev server's `.cloudflare/state/` | Medium | **Resolved** (2026-10-27) — pass `--persist-to .cloudflare/state`; the dev database is registered in the Local Explorer as name `DB`, id `DB-real-estate-tracker`, and `cf d1 raw DB-real-estate-tracker --local --persist-to .cloudflare/state` reads and writes the exact file the running `cf dev` worker uses. Plain `--local` uses `~/.config/cloudflare/state` and sees a different, empty database |
| `cf d1 migrations apply --local` needs a UUID and rejects the local simulated id (`DB-real-estate-tracker`); it also creates a throwaway database keyed by whatever UUID it is given | Medium | Open (cf 1.0.0-beta.23) — there is no Cloudflare login in this environment and `cf deploy` does not write the provisioned id back, so no real UUID exists yet. Local schema changes are applied with `cf d1 raw DB-real-estate-tracker --local --persist-to .cloudflare/state --sql "$(cat migrations/<file>.sql)"`. Feature 19 sets the real `DATABASE_ID` and uses `pnpm db:migrate:remote`. Stray per-UUID sqlite files under `.cloudflare/state/v3/d1/miniflare-D1DatabaseObject/` can be deleted |
| `cf d1 migrations apply --pattern` now also requires `--dir`, and Drizzle's flat `migrations/*.sql` layout never matched the old `migrations/*/migration.sql` pattern | Low | **Fixed** (2026-10-27) — `db:migrate:local` / `db:migrate:remote` pass `--dir migrations` and let the default `<dir>/*.sql` glob do the work |
| Scaffold may emit `wrangler.jsonc` instead of `cloudflare.config.ts` | Low | Not hit — feature 01 produced `cloudflare.config.ts` with the `cf` flow |
| `typescript@latest` resolves to TS 7, which ships no compiler API; `typescript-eslint` refuses it ("does not support TS 7.0") | Medium | Fixed in feature 01 — `typescript` pinned to `^6.0.3` |
| pnpm ≥ 11 fails installs with `ERR_PNPM_IGNORED_BUILDS` for `workerd` / `esbuild` | Medium | Fixed in feature 01 — `allowBuilds` map in `pnpm-workspace.yaml` |
| `architecture.md` cites OpenNext #1407 as evidence that `cf` breaks OpenNext; the issue actually reports a `bunx` resolution failure, and the reporter says the local binary works with `cloudflare.config.ts` present | Low | Open — the no-Wrangler rule is still correct, the citation is wrong (checked 2026-10-27) |
| `pnpm build` prints rolldown warnings from vinext internals (`INEFFECTIVE_DYNAMIC_IMPORT`, `SOURCEMAP_BROKEN`) | Low | Accepted — the build still exits 0 |
| `notFound()` returned HTTP 200 for draft and unknown detail IDs | Low | Resolved — `cf dev` returns HTTP 404 for a draft ID, an unknown detail ID and the edit route (checked during feature 09). The `vite preview` status was not re-checked |
| Public views are `active`-only per the architecture invariant, so `StatusBadge` on `/`, `/properties` and the detail page always reads Active | Low | Accepted — the other three statuses appear on the feature 05 dashboard |
| Installing dependencies while `cf dev` runs leaves the dev server broken (`createContext is not a function` after Vite re-optimizes) | Low | Workaround — stop and restart `cf dev`; hit during feature 05, restart fixed it |
| Vinext re-optimizing client dependencies logs "client component dependency is inconsistently optimized" for `@clerk/nextjs` and `lucide-react` | Low | Accepted — dev-only warning, the server still serves every route |
| Vinext holds a per-project-root dev lock, so two sessions on this checkout cannot both run `vite dev` / `cf dev`; the second exits with "Another vinext dev server is already running" | Low | Accepted — check the existing listener first; the running server hot-reloads changes from this checkout |

---

## Decisions Made
These resolve the spec's open questions and unstated gaps. Edit any you disagree with before building.

- **2026-10-26** — **Auth: Clerk** (`@clerk/nextjs`), set up with the Clerk CLI (`clerk init`). Replaces the earlier custom KV-session design. No password, session, or cookie code in the app.
- **2026-10-26** — **No users table.** `owner_id` stores the Clerk user ID as plain text (no FK). Profile data stays in Clerk.
- **2026-10-26** — **Roles** live in Clerk `publicMetadata.role`, exposed via a customized session token. A user with no role is treated as `agent`; admins are promoted in the Clerk Dashboard. `viewer` has no create rights.
- **2026-10-26** — **Next.js 16 API on vinext (Vite), not OpenNext.** `cf` sets up Next.js projects with vinext and `cloudflare.config.ts`. OpenNext builds through Wrangler and conflicts with `cloudflare.config.ts` (opennextjs-cloudflare #1407). vinext supports `proxy.ts`. Requires Node.js ≥ 22.18.
- **2026-10-26** — **CLIs:** Clerk CLI (`clerk`) for auth setup and config; Cloudflare CLI (`cf`, beta, https://developers.cloudflare.com/cf/) for resources, dev, build, and deploy. No Wrangler. All Cloudflare configuration lives in `cloudflare.config.ts`.
- **2026-10-26** — **Bindings** are read via `getEnv()` (`cloudflare:workers`) in `lib/cloudflare.ts` only. **No ISR / `"use cache"`** in v1; pages render dynamically and KV version counters handle freshness.
- **2026-10-26** — **Stop-and-ask rule:** if the feature-02 spike shows `cf` + vinext + Clerk cannot work, the agent stops and asks the user. It does not fall back to OpenNext or Wrangler on its own.
- **2026-10-26** — **Geocoding vendor:** Mapbox as default behind a `Geocoder` interface so it can be swapped. Failure never blocks saving a property.
- **2026-10-26** — **Mutations via Server Actions; reads also exposed as `GET /api/properties[/:id]`.** The spec allowed either; POST/PATCH/DELETE route handlers are not built.
- **2026-10-26** — **ORM:** Drizzle on D1 for typed queries and migrations.
- **2026-10-26** — **R2 via Worker binding,** not S3 API. Bucket is private; media served through `/media/[id]`.
- **2026-10-26** — **Price stored as integer cents;** bathrooms as `real` (supports 2.5).
- **2026-10-26** — **KV list invalidation by version counter** instead of prefix deletes. TTLs: list 60 s, detail 300 s, geocode 30 d.
- **2026-10-26** — **Events are in-process functions** (`lib/events.ts`), not a queue.
- **2026-10-26** — **Multi-tenancy deferred:** ownership is per user only. No image processing pipeline; originals served as-is.
- **2026-10-26** — **Search scope** limited to address text, price, bedrooms, bathrooms, status.
- **2026-10-26** — **PII:** never log full addresses, emails, or tokens. No further governance for v1.
- **2026-10-26** — **UI tokens:** neutral default palette (teal accent) because no design was provided.
- **2026-10-27** — **Scaffold path:** `create-vinext-app` run into a throwaway directory (`scaffold-tmp`) with `--platform cloudflare --name real-estate-tracker --data-cache none --cdn-cache none --image-optimization none --no-prerender --use-pnpm --skip-install --disable-git`, then the output moved into the repo root. `cf init .` was rejected: its own help says a directory containing anything other than `.git` gets "autoconfig" instead of a new project, and this root already held `AGENTS.md`, `README.md` and `context/`.
- **2026-10-27** — **No framework caches, no image optimization, no prerendering.** Freshness comes only from the KV version counter, per the no-ISR invariant in `architecture.md`.
- **2026-10-27** — **`cf` owns dev, build and deploy:** the scripts are `cf dev` / `cf build` / `cf deploy`. The scaffold's `vinext-cloudflare deploy` script and its `@vinext/cloudflare` dependency were removed.
- **2026-10-27** — **ESLint added rather than skipped:** `eslint` + `@eslint/js` + `typescript-eslint` with a flat `eslint.config.mjs`, because build-plan 01 requires ESLint and the `lint` script has to do something. The approved list in `code-standards.md` was updated in the same session.
- **2026-10-27** — **Scaffold demo code removed:** `app/api/hello/route.ts` and the generated boilerplate `README.md` were deleted, and `app/page.tsx` was moved to `app/(public)/page.tsx` so the tree matches `architecture.md`.
- **2026-10-27** — **Clerk application is `RealTrack`** (`app_3LIJOkiAsmRiDc7ef3O04uzwKEz`), created with `clerk apps create` and linked with `clerk link --app`. Its development keys are the project's: publishable key in `.env.local`, `CLERK_SECRET_KEY` in `.dev.vars`. Feature 10 therefore builds on the real application rather than a throwaway accountless app.
- **2026-10-27** — **`CLERK_SECRET_KEY` is declared as `bindings.secret()`** in `cloudflare.config.ts`. Local `.dev.vars` values are not visible to Clerk by themselves; the declared binding is what exposes it. Deploys must therefore pass `cf deploy --secrets-file .dev.vars`.
- **2026-10-27** — **Clerk keys are mandatory.** Clerk 7 does not enter keyless mode on this stack, so the feature-02 spike ran against the real dev instance instead of "no keys needed yet".
- **2026-10-27** — **The dev-only `clerkRequireToImport()` plugin stays in `vite.config.ts`** until vinext or Clerk stops emitting bare `require()` in `@clerk/nextjs/dist/esm` (vinext#4221).
- **2026-10-27** — **`.gitignore` ignores `.env`, `.env*.local`, `.dev.vars`, `.secrets*` and negates the two examples**, so `.env.example` and `.dev.vars.example` are committed while real values stay out.
- **2026-10-27** — **Tokens live in `globals.css` `@theme` exactly as `ui-tokens.md` defines them**, and shadcn's semantic variables are mapped onto them in `:root` + `@theme inline`. `--color-accent`, `--color-background` and `--color-border` are deliberately not remapped, so shadcn's neutral hover/focus classes were rewritten to `bg-surface-secondary` in the primitives (listed in `ui-registry.md`).
- **2026-10-27** — **A new `--color-overlay` token (`bg-overlay`) replaced `bg-black/50`** in dialog, alert-dialog and sheet; recorded in `ui-tokens.md`.
- **2026-10-27** — **Light-only UI.** `@custom-variant dark (&:is(.dark *))` confines `dark:` utilities to an explicit `.dark` ancestor, which the app never adds, so an OS dark preference cannot repaint the UI. No dark palette exists in v1.
- **2026-10-27** — **shadcn is configured by hand.** `components.json` is committed; `shadcn init` is not run (it hangs non-interactively and misdetects Vite), and every added component gets the token pass described in `library-docs.md`.
- **2026-10-27** — **The scratch style guide lives at `/style-guide`** and is deleted in feature 04, together with the placeholder `app/(public)/page.tsx`.
- **2026-10-27** — **`lib/utils.ts` owns `cn`** (clsx + tailwind-merge). The `cn` npm package the CLI wanted is not used.
- **2026-10-27** — **Phase 1 mock data is reached only through `services/properties.ts`** (`searchActiveProperties`, `getActivePropertyById`, `getFeaturedProperties`) reading `lib/mock-data.ts`. Pages call the service, components import types from `types/property.ts`, and feature 08 swaps the service body for D1 without touching a page.
- **2026-10-27** — **The property service filters to `status = 'active'`** (there is no auth yet), so public browsing cannot show drafts, sold or off-market listings before feature 11 exists.
- **2026-10-27** — **Mock images are static SVG placeholders** in `public/placeholders/` and the mock stores that path as the image `src`; feature 13/14 change only the service to emit `/media/{id}`.
- **2026-10-27** — **Search filters, sort and page live in the URL** and are parsed by `validations/property-search.ts`. Every field `.catch`-es to a default, so a junk query string falls back instead of erroring, and `pageSize` defaults to 6 (`DEFAULT_PAGE_SIZE`): the 15 mock active listings paginate into 3 pages.
- **2026-10-27** — **The `/style-guide` scratch page and the placeholder `app/(public)/page.tsx` were deleted** in feature 04, as the tracker planned.
- **2026-10-27** — **Phase 1 dashboard shows every mock property, all statuses,** through `listDashboardProperties()`. There is no auth yet, so it is not owner-scoped; feature 08 replaces the service body with a temporary seed owner ID and real owner filtering.
- **2026-10-27** — **The property form validates with `react-hook-form` + `zodResolver` over `validations/property.ts`.** Numeric fields validate as strings and `.transform(Number)` on success, so `z.input` stays string-typed for form fields while `z.output` gives the numeric `PropertyInput`; the same schema will parse `FormData` strings in feature 09. `@hookform/resolvers` 6.0.0 was added alongside `react-hook-form` 7.91.0 (both already on the approved list).
- **2026-10-27** — **Form submit and dashboard delete are no-ops with a toast** until features 09. Delete goes through `ConfirmDialog`, which names the property.
- **2026-10-27** — **`getPropertyForEdit(id)` returns any status and `notFound()` otherwise** (verified HTTP 404), so drafts, sold and off-market listings can be edited before route protection exists.
- **2026-10-27** — **`PropertyFormValues` (strings) and `PropertyInput` (numbers, price in dollars)** are the form/action boundary; dollars are converted to cents only in the Phase 2 service.
- **2026-10-27** — **The four navbar auth states are a dev-only source flag.** `lib/mock-auth.ts` holds `MOCK_AUTH_STATE` (edit it to `viewer`, `agent` or `admin`), the mock users and `canManageProperties`; `getMockAuthState()` returns `signed_out` whenever `NODE_ENV` is `production`, so a build can never show a mock session. Feature 10 replaces every caller with Clerk and deletes the file. A source constant was chosen over an env var because the dev server lock makes an env-var flip require a restart another session may own.
- **2026-10-27** — **The auth pages label a placeholder, not a form.** `/sign-in` and `/sign-up` render `AuthPageLayout` with heading, copy, a dashed placeholder card naming where Clerk's component goes, and a cross-link; feature 10 swaps only the card body.
- **2026-10-27** — **Timestamps are stored as plain `integer` Unix milliseconds, not Drizzle's `timestamp_ms` mode.** `types/property.ts` and `lib/format.ts` already treat timestamps as numbers, so `$inferSelect.createdAt: number` matches the domain type without a conversion layer. Row defaults come from the database (`DEFAULT (unixepoch() * 1000)`), so raw SQL inserts are stamped too.
- **2026-10-27** — **The schema enforces the architecture invariants it can:** `CHECK` constraints for non-negative bedrooms, bathrooms and price, a `UNIQUE` index on `property_media.r2_key`, and a partial unique index on `property_media(property_id) WHERE is_cover = 1` so two covers cannot exist for one property. Feature 13 must clear the old cover before setting a new one.
- **2026-10-27** — **Seed data lives in `scripts/seed.sql`,** not a TS script: it is applied with `cf d1 raw`, needs no build step, and stays re-runnable (`DELETE` of the two seed owners first, media cascade with it). Placeholder owner ids are `seed_agent_a` and `seed_agent_b`; the R2 keys it inserts point at objects that do not exist until feature 13 uploads real media.
- **2026-10-27** — **Inferred row types live in `types/database.ts`,** re-exporting `PropertyRow`, `NewPropertyRow`, `PropertyMediaRow` and `NewPropertyMediaRow` from `lib/db/schema.ts`, per feature 07's "export inferred types in `types/`".

---

## Cloudflare Dashboard Checklist (not code)
- [ ] Proxy enabled on the custom domain (CDN + WAF)
- [ ] WAF managed rulesets on
- [ ] Clerk bot protection enabled in the Clerk Dashboard
- [ ] Clerk production DNS records set to **DNS only** (not proxied)
- [ ] "Always use HTTPS" on, minimum TLS 1.2
- [ ] Cache rule: bypass cache when the Clerk `__session` cookie is present

---

## Session Notes
[Brief notes from the last few sessions — what was done, what broke, what to watch for.]

**2026-10-26**
- Context files generated from spec.
- Revised to use Clerk for auth (Clerk CLI + Cloudflare CLI available locally).
- Revised to use `cf` (Cloudflare CLI beta) with vinext instead of OpenNext + Wrangler, based on https://developers.cloudflare.com/cf/.
- Next session: start at feature 01.

**2026-10-27**
- Rebuilt the file layout: the nine context docs moved into `context/` and the duplicate `real-estate-tracker-context/` copy was removed, so `AGENTS.md`'s "read every file in `/context`" matches reality.
- Upgraded `cf` from 1.0.0-beta.5 to 1.0.0-beta.23. `cf docs search` does not exist in beta.5 (it fell back to top-level help) and works in beta.23 — the `cf docs search` instruction was correct and the CLI was stale.
- Verified `cf init`, `cf d1 migrations apply <db>` and `cf deploy --secrets-file` on beta.23. Note for feature 07: `cf d1 migrations apply` defaults to `<dir>/*.sql`, but Drizzle's nested layout needs `--pattern "migrations/*/migration.sql"`; the scripts in `package.json` already pass it.
- Feature 01 complete: vinext 1.3.1, vite 8.3.0, React 19.3.1, `@cloudflare/vite-plugin` 2.0.0-beta.v.5, Tailwind 4.3.3, drizzle-orm 0.45.4, zod 4.6.7, vitest 5.0.5. `cf workers types` generates `.cloudflare/types/index.d.ts`, which is already in the tsconfig `include`.
- Known gaps for the next session: no D1/KV/R2 bindings are declared yet (feature 02), the route groups under `app/` are empty, and the Clerk spike has not been attempted.

**2026-10-27 (session 2) — feature 02**
- `cloudflare.config.ts` declares `DB` (`bindings.d1`, `real-estate-tracker-db`), `KV` (`bindings.kv()` — `KvBindingOptions` accepts only `id` and `dev`, so no name), `MEDIA` (`bindings.r2`, `real-estate-tracker-media`) and `CLERK_SECRET_KEY` (`bindings.secret()`).
- `lib/cloudflare.ts` exports `getEnv()` and is the only importer of `cloudflare:workers`. The temporary `/api/health` route probes D1 (`SELECT 1`), KV (write/read round-trip) and R2 (`list({ limit: 1 })`) and returns 200 only when all three pass.
- `cf deploy` provisioned the resources (KV id `95e028ca40d749b9a6f23f92e33efd30`) and published the Worker to https://real-estate-tracker.pilkington.workers.dev (version `0ad0bf07-f203-42e9-99ed-f9095bb0ce24`). `/api/health` is green both locally and on that URL. The deploy needed `--secrets-file .dev.vars` because of the secret binding.
- **Clerk spike verdict: works, with the documented workaround.** `cf dev` crashed with `require is not defined` until `clerkRequireToImport()` was added to `vite.config.ts`. With it, `clerkMiddleware` runs, and `auth()` returns correct values in a route handler, a server component and a Server Action; the clerk-js client handshake against the dev instance also succeeds and a Server Action POST returns 200. `cf build` passes with or without the shim. All spike files were removed afterwards.
- **Not yet proven:** a real sign-up/sign-in and a signed-in `auth()` result. Feature 10 owns that, along with the `clerk init` scaffolding, email + password, session-token customization and roles.
- `pnpm lint`, `pnpm typecheck` and `pnpm build` all pass. The repo contains no `wrangler.*`, `open-next.config.ts` or `.open-next/`.

**2026-10-27 (session 3) — feature 03**
- `app/globals.css` now holds the full `@theme` token block from `ui-tokens.md` plus the shadcn variable mapping. Verified in the browser: `--color-accent` `#0f766e`, `--color-background` `#f7f8fa`, body text `#111827`, Inter loaded through `next/font/google`.
- Installed `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `sonner`, `tw-animate-css` and `radix-ui`, then the 13 primitives from the feature list. `shadcn init` never ran: `components.json` was written by hand and `shadcn add` did the work.
- Each primitive needed a token pass (see `ui-registry.md`). Two real defects were caught this way: an input rendered `bg-transparent` with `dark:bg-input/30`, and every `dark:` utility was live under the machine's dark OS preference.
- `Navbar` (logged-out), `PageShell` and `Footer` render on every page through `app/layout.tsx`; the scratch page at `/style-guide` shows buttons, inputs, badges, status colours, card/table/skeleton and all five overlays.
- Browser checks: primary button `#0f766e` on white text, secondary `bg-surface` with the border token, the four status badges on their light tokens, dialog on `bg-surface` with the new `bg-overlay` scrim, skeleton on `surface-secondary`, a toast rendering ("Saved"), and no horizontal overflow at 390px.
- Known gap: overlays cannot be asserted closed in a hidden tab (frozen animation timeline). Test rules are in `library-docs.md`.

**2026-10-27 (session 4) — coderabbit fix**
- Triage: the Coderabbit finding on `components/ui/sonner.tsx` (`--normal-border` pointing at the undefined `--border`) was **verified as valid** — the border token is defined as `--color-border` in `app/globals.css` `@theme`, with shadcn semantic names mapped onto it (`--input: var(--color-border)`); no bare `--border` exists. Sonner consumes `--normal-border` via `border: 1px solid var(--normal-border)` on `[data-sonner-toast][data-styled='true']`.
- Applied the minimal fix: `"--normal-border": "var(--color-border)"`. No other undefined tokens found in the Toaster style block.
- `pnpm lint`, `pnpm typecheck` and `pnpm build` all pass after the fix.

**2026-10-27 (session 5) — feature 04**
- Data layer: `types/property.ts`, `lib/format.ts` (`formatPrice`, integer cents, no decimals), `lib/mock-data.ts` (18 fixtures: 15 active, 1 draft, 1 sold, 1 off-market; 3 cycled SVG placeholders, two active listings without coordinates and one without photos), `validations/property-search.ts` and `services/properties.ts`.
- Components: `StatusBadge`, `PropertyCard`, `PropertyGrid`, `PropertyImagePlaceholder`, `PropertyFacts`, `PropertyGallery`, `SearchFilters`, `EmptyState`, `Pagination`; pages: real `/`, `/properties` + `loading.tsx`, `/properties/[id]` + `not-found.tsx`. `/style-guide` and the placeholder landing page are gone.
- Browser checks (dev server, 1280px and 390px): 15 active listings in 3 pages, newest-first; page links carry the filters forward; the mobile sheet filters and applies (`?minBedrooms=4` → 6 results, Filters (1)); sort select (`?minBedrooms=4&sort=price_asc` → $518,000 → $2,450,000); hero search → `/properties?q=austin`; `?q=portland` (a draft only) renders the empty state with no draft leak; the detail page shows price, Active badge, facts, `41.96910, -87.67210` and a Google Maps link; the no-photo/no-coordinate fixture shows the placeholder and Location not verified; a draft id renders `not-found.tsx` inside the shell; the gallery lightbox opens at 896px and closes; no horizontal overflow at 390px.
- `loading.tsx` verified by temporarily delaying `searchActiveProperties`: the response streams the skeleton markup first (byte ~6 KB) and the cards later (~84 KB). The delay was removed before the final build.
- Behaviour recorded in Known Issues: `notFound()` renders correctly but the status is HTTP 200 on both the dev server and the production preview build.
- `pnpm lint`, `pnpm typecheck` and `pnpm build` pass; the built route table lists `/`, `/api/health`, `/properties` and `/properties/:id`.

**2026-10-27 (session 6) — feature 05**
- Schema: `validations/property.ts` (`propertyInputSchema`, `PropertyFormValues` strings / `PropertyInput` numbers, `emptyPropertyFormValues`, `propertyToFormValues`). Service reads added: `listDashboardProperties()` and `getPropertyForEdit(id)`; `formatDate()` added to `lib/format.ts`.
- UI: `FormField`, `PropertyForm`, `MediaUploader`, `ConfirmDialog`, `DashboardTable`; pages `/properties/new`, `/properties/[id]/edit`, `/dashboard`. The three obsolete `.gitkeep` files were deleted.
- Browser checks (390px and desktop): empty submit shows inline errors plus `aria-invalid` on address line 1, city, state, postal code, bedrooms, bathrooms and price; `bathrooms=2.4` is rejected with "Use half-bath increments (0.5).", `2.5` submits and shows the no-op toast; price and bedroom inputs are `step=1`, bathrooms `step=0.5`; editing the draft fixture prefills every field including status Draft; unknown edit id returns HTTP 404 with the not-found UI; the dashboard lists 18 properties (15 active, 1 draft, 1 sold, 1 off market) sorted by last edit, and the delete dialog reads "Delete “2211 NE Alberta St”?" before its no-op toast; the empty state was verified with a temporary empty return that was reverted; no horizontal body overflow at 390px (the table scrolls inside its own container).
- Installing `react-hook-form`/`@hookform/resolvers` while the old dev server was running left it in a broken re-optimized state; it was stopped (identified by port 5173 PID/tree) and restarted with `pnpm dev`, which fixed it. Recorded in Known Issues.
- `pnpm lint`, `pnpm typecheck` and `pnpm build` pass; the built route table adds `/dashboard`, `/properties/:id/edit` and `/properties/new`.

**2026-10-27 (session 7) — feature 06**
- Mock state: `lib/mock-auth.ts` (types, `MOCK_AUTH_STATES`, three mock users, `parseMockAuthState`, `canManageProperties`, `getMockAuthState`). The dev flag is the single `MOCK_AUTH_STATE` constant; `NODE_ENV === "production"` always resolves to `signed_out`.
- UI: `NavbarAuth` (client) and `AuthPageLayout` (server) added; `Navbar` now computes its links from the mock state and renders `NavbarAuth` on the right. Pages `/sign-in/[[...sign-in]]` and `/sign-up/[[...sign-up]]` replaced their `.gitkeep` files.
- Browser checks (390px and desktop, against the dev server already running in this checkout): signed out shows Browse + Sign in/Sign up and no Dashboard; viewer adds the Dashboard link and the `VL` avatar with no Add property; agent and admin add **Add property** (`AR` / `AC`); the menu shows name, email, `Role: Viewer|Agent|Admin (mock)`, Dashboard and Sign out, and Sign out toasts "Sign-out is not connected yet."; Dashboard is accent-coloured when active; the Add property label is visually hidden below `sm` (36px icon button, accessible name intact); at 390px the header inner width equals the viewport minus the scrollbar (no overflow) and the menu opens fully inside the viewport (133–357px); both auth pages centre a 448px card on desktop and fill the viewport below the header at 390px, with the footer starting at the fold; the sign-up → sign-in cross-link navigates; no console errors or warnings.
- The state was switched by editing `MOCK_AUTH_STATE` and reloading (HMR), then reverted to `signed_out` before the final build.
- `pnpm lint`, `pnpm typecheck` and `pnpm build` pass; the built route table adds `/sign-in` and `/sign-up`.

**2026-10-27 (session 8) — coderabbit triage**
- **Fixed — hint not announced.** `PropertyForm`'s `fieldProps` now takes `hasHint` and points `aria-describedby` at `{name}-hint` when there is no error, keeping `{name}-error` as the higher priority; `country`, `bathrooms` and `price` pass `true`. Verified in the browser: the three inputs reference their hint text while valid, and the error id once invalid.
- **Fixed — country accepted digits.** `validations/property.ts` keeps the two-letter length check and adds `/^[A-Z]{2}$/` with the same message, so `12` and `U1` fail while `us` / ` CA ` still normalize and pass.
- **Skipped — DashboardTable edit gating.** The reported edit controls are Phase 1 scaffolding on a dashboard the tracker deliberately leaves unscoped until feature 08/11, and `getMockAuthState()` returns `signed_out` in every production build. Gating there would remove the Edit affordance from the deployed Phase 1 UI (while Delete stayed visible) without protecting anything: the links only navigate to `/properties/[id]/edit`, which feature 11 guards server-side. Authorization stays a Clerk + service concern.

**2026-10-27 (session 9) — feature 07**
- Data layer: `lib/db/schema.ts` (`properties` 17 columns + 5 indexes + 3 checks; `property_media` 8 columns + 3 indexes + cascade FK), `lib/db/index.ts` (`getDb()` over the `DB` binding, typed `DrizzleD1Database<typeof schema>`), `drizzle.config.ts` (sqlite dialect, no credentials because drizzle-kit only generates SQL), `types/database.ts` (inferred row types), generated `migrations/0000_slimy_doctor_spectrum.sql` with `migrations/meta/`, and `scripts/seed.sql` (15 properties, 20 media rows).
- `pnpm db:generate` emitted the expected SQL, including the partial unique index (`property_media_cover_unique ... WHERE "property_media"."is_cover" = 1`) and the `DEFAULT (unixepoch() * 1000)` timestamps.
- **Local migration path:** the running `cf dev` database is the Local Explorer's `DB` (`http://localhost:5173/cdn-cgi/local/explorer/api/d1/database` → name `DB`, uuid `DB-real-estate-tracker`), stored at `.cloudflare/state/v3/d1/miniflare-D1DatabaseObject/238f41ef…sqlite`. `cf d1 migrations apply --local` takes only UUIDs, so it cannot target that database (it created a throwaway one keyed by the UUID it was given; the file was deleted). The migration was applied with `cf d1 raw DB-real-estate-tracker --local --persist-to .cloudflare/state --sql "$(cat migrations/0000_slimy_doctor_spectrum.sql)"`, and its multi-statement batch ran cleanly on the fresh database (`sqlite_master` had only `_cf_METADATA` before).
- **Seed:** `cf d1 raw DB-real-estate-tracker --local --persist-to .cloudflare/state --sql "$(grep -v "^--" scripts/seed.sql)"` — the `grep` is required because `cf` parses a `--sql` value beginning with a `--` comment as flags. Re-running leaves 15/20, so it is idempotent. Rows: 9 active, 2 draft, 2 sold, 2 off-market; 7 `seed_agent_a` / 8 `seed_agent_b`; 12 properties have exactly one cover; two have floor-plan PDFs; three have null coordinates; four have no media.
- **Verified against the running `cf dev` worker:** a temporary `app/api/db-probe/route.ts` (deleted afterwards) ran `getDb().select({ total: count() }).from(properties)` and returned `{ ok: true, propertyCount: 15 }`, proving the migrated tables, `getDb()` and the binding wiring work inside workerd, not just through the CLI.
- **Cascade verified:** deleting the 3-media "4821 N Hermitage Ave" row through `cf d1 raw` took `property_media` from 20 to 17 and the property count to 14; the seed was then re-applied (back to 15/20). A direct second `is_cover = 1` insert for one property was rejected with `UNIQUE constraint failed: property_media.property_id`.
- Scripts: `db:migrate:local` / `db:migrate:remote` now pass `--dir migrations` (cf requires `--dir` whenever `--pattern` is used, and Drizzle's flat layout never matched the old pattern), and let the default `<dir>/*.sql` glob find the file.
- `pnpm lint`, `pnpm typecheck` and `pnpm build` pass; the built route table is unchanged (no new routes).

**2026-10-28 (session 10) — feature 11 signed-out verification**
- Stopped the stale `pnpm vite` dev-server tree that was holding :5173 (it served 404s for `/dashboard` and `/properties/new`), then restarted with `pnpm dev`. vinext allows one dev server per checkout, so the old process had to go first. New listener: `[::1]:5173`.
- **Clerk dev-browser handshake:** every document request 307s to `clerk.accounts.dev/v1/client/handshake` on a cold cookie jar, including public `/`. That is Clerk's dev handshake, not route protection — it must be followed with a cookie jar, or non-document requests used, before reading a redirect chain.
- **Signed-out results** (curl, cookie jar, `Accept: text/html`): `/dashboard`, `/properties/new` and `/properties/<id>/edit` end at `/sign-in?redirect_url=<the requested page>` — so the return path is preserved. Public `/`, `/properties`, `/properties/<id>`, `/sign-in` and `/sign-up` all render 200.
- **Off-site `redirect_url`:** `/dashboard?redirect_url=https://evil.example` yields `redirect_url=http://localhost:5173/dashboard?redirect_url=…evil.example`, i.e. the target is always the request's own origin plus path; user input is never forwarded into `redirect()` (both `redirect()` calls in `app/` are the literal `"/dashboard"`).
- Still open for feature 11: Agent A vs Agent B edit/delete and `viewer` create/edit denial need signed-in accounts; the post-sign-in return trip was not exercised end to end.
