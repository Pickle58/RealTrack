<!-- Progress tracker: live build status — update this after every session -->

# Progress Tracker

**Last updated:** 2026-10-27
**Current phase:** Phase 1 — Full UI with Mock Data (Phase 0 complete)
**Overall status:** Features 01–03 complete. The `cf` + vinext + Clerk stack is proven, the Worker is live at https://real-estate-tracker.pilkington.workers.dev, and the design system plus the app shell are in place. Feature 04 (public browsing UI) is next.

---

## Completed
- [x] Technical spec converted into context files
- [x] 01 Project scaffold (2026-10-27) — `pnpm lint`, `pnpm typecheck` and `pnpm build` pass
- [x] 02 Cloudflare CLI, bindings, and stack spike (2026-10-27) — `DB`/`KV`/`MEDIA` declared and provisioned, `/api/health` green locally and on the deployed Worker, Clerk spike passes with the dev-only require shim
- [x] 03 Design tokens and app shell (2026-10-27) — `@theme` tokens + shadcn variable mapping in `globals.css`, Inter loaded, Navbar/PageShell/Footer rendering everywhere, 13 primitives installed and mapped to the tokens, scratch page at `/style-guide`

## In Progress
- [ ] _(none)_

## Up Next
- [ ] 04 Public browsing UI
- [ ] 05 Agent UI: form and dashboard
- [ ] 06 Auth page shells and navbar states
- [ ] 07 Schema, migrations, seed
- [ ] 08 Read path
- [ ] 09 Write path (temporary identity)
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
| `createRouteMatcher` is deprecated in `@clerk/nextjs` 7 and removed in the next major | Low | Open — feature 11 must protect with bare `clerkMiddleware()` plus `await auth.protect()` per page/action |
| Vite prints "client component dependency is inconsistently optimized" for Clerk's client entry | Low | Accepted — dev-only warning; add `optimizeDeps.exclude` if it becomes noisy |
| `/api/health` is public and unauthenticated | Low | Open — remove or restrict it before Phase 7 ends, per feature 02 |
| Generated shadcn primitives ship `dark:` utilities; the OS dark preference activated them and washed the page out | Medium | **Fixed** (2026-10-27) — `@custom-variant dark (&:is(.dark *))` in `globals.css`; the app is light-only |
| `shadcn init` hangs without a TTY and misdetects Vite | Low | Worked around — `components.json` is committed and hand-written, and components are added with `shadcn add` |
| `shadcn add` emitted `import { cn } from "cn"` and installed `cn` + `next-themes` (unapproved deps) | Low | **Fixed** (2026-10-27) — imports rewritten to `@/lib/utils`, both packages removed, `sonner.tsx` pinned to light |
| Radix overlays look "stuck open" in a hidden browser tab | Low | Documented in library-docs — the animation timeline is frozen, so `animationend` never fires. Not a code defect; disable animations when asserting overlay closure |
| `/style-guide` and the placeholder `app/(public)/page.tsx` are scaffolding | Low | Open — delete both in feature 04 |
| Vite prints "client component dependency is inconsistently optimized" for Clerk's client entry | Low | Accepted — dev-only warning; add `optimizeDeps.exclude` if it becomes noisy (carried over from feature 02)|
| `cf d1 ... --local` state differs from the dev server's `.cloudflare/state/` | Medium | Verify in feature 07; record working command |
| Scaffold may emit `wrangler.jsonc` instead of `cloudflare.config.ts` | Low | Not hit — feature 01 produced `cloudflare.config.ts` with the `cf` flow |
| `typescript@latest` resolves to TS 7, which ships no compiler API; `typescript-eslint` refuses it ("does not support TS 7.0") | Medium | Fixed in feature 01 — `typescript` pinned to `^6.0.3` |
| pnpm ≥ 11 fails installs with `ERR_PNPM_IGNORED_BUILDS` for `workerd` / `esbuild` | Medium | Fixed in feature 01 — `allowBuilds` map in `pnpm-workspace.yaml` |
| `architecture.md` cites OpenNext #1407 as evidence that `cf` breaks OpenNext; the issue actually reports a `bunx` resolution failure, and the reporter says the local binary works with `cloudflare.config.ts` present | Low | Open — the no-Wrangler rule is still correct, the citation is wrong (checked 2026-10-27) |
| `pnpm build` prints rolldown warnings from vinext internals (`INEFFECTIVE_DYNAMIC_IMPORT`, `SOURCEMAP_BROKEN`) | Low | Accepted — the build still exits 0 |

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
