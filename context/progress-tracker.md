<!-- Progress tracker: live build status — update this after every session -->

# Progress Tracker

**Last updated:** 2026-10-27
**Current phase:** Phase 0 — Foundation
**Overall status:** Feature 01 complete; feature 02 next. The `cf` + vinext + Clerk stack is still unproven until the feature-02 spike runs.

---

## Completed
- [x] Technical spec converted into context files
- [x] 01 Project scaffold (2026-10-27) — `pnpm lint`, `pnpm typecheck` and `pnpm build` pass

## In Progress
- [ ] _(none)_

## Up Next
- [ ] 02 Cloudflare runtime and bindings
- [ ] 03 Design tokens and app shell
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
- [ ] 10 Clerk integration — **Needs:** a Clerk application linked to this project (`clerk init`). The `clerk` CLI is signed in, but no application is linked yet.
- [ ] 02 Cloudflare CLI and stack spike — **Prerequisites now met** (2026-10-27): `cf` 1.0.0-beta.23 installed and authenticated (account `3a3c9211676d25b5219c9693aa56574d`), Node v24.21.0, pnpm 12.10.1. The spike itself has not been run.

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
| `cf dev` can crash on `@clerk/nextjs` (`require is not defined`, vinext#4221) | Medium | Workaround documented in library-docs |
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
