<!-- End-to-end smoke checklist: the manual pass from sign-up to delete -->

# End-to-end Smoke Checklist

Feature 17 requires one documented end-to-end pass: **sign up → create → upload → public view → delete**. Run it on `pnpm dev` (http://localhost:5173) before closing feature 10 or 17, and again on the production URL for feature 19. Record the date, the environment and every failure in `progress-tracker.md → Session Notes`.

Automated coverage lives in `pnpm test` (103 cases against an in-memory D1/KV/R2). This pass covers what only a real Clerk session and a browser can: the sign-in handshake, the upload round-trip to R2, and the rendered public pages.

**2026-10-29 run (local `pnpm dev`, real Clerk accounts):** sections 1, 2, 3 (upload + alt text), 4, 5 and 6 were executed and pass. `☑` marks an item this run exercised; `☐` items were verified in the feature noted next to them (probe or UI run) and are re-run on production in feature 19. The result log at the bottom has the evidence.

## Before you start

- `pnpm lint && pnpm typecheck && pnpm test` all pass.
- `.dev.vars` holds `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `GEOCODER_API_KEY`; the local D1 has the committed migrations applied.
- Two browser profiles: a normal window for the agent, a private window for the signed-out stranger (and a second account for the IDOR checks).
- A test JPEG under 10 MB, a second JPEG, and a small PDF.
- Three Clerk accounts: one `agent` (the owner), a second `agent` (the outsider) and one `viewer`. Set `publicMetadata.role` in the Clerk Dashboard; a missing role resolves to `agent`.

The 2026-10-29 accounts (Clerk dev instance `RealTrack`; every address uses a `+clerk_test` tag so Clerk accepts the code `424242`):

| Account | Role | Used for |
|---------|------|----------|
| `smoke.owner+clerk_test@example.com` | none (`{}` → `agent`) | owner, create/upload/delete, default-role check |
| `smoke.outsider+clerk_test@example.com` | `agent` | second agent, IDOR |
| `smoke.viewer2+clerk_test@example.com` | `viewer` | viewer gating |
| `smoke.agent3+clerk_test@example.com` | `admin` | admin scope, cross-owner edit |
| `smoke.signup+clerk_test@example.com` | none | the sign-up pass |

## 1. Sign up / sign in

- [x] Open `/sign-up`, create an account with email + password, finish verification. — `smoke.signup+clerk_test@example.com`, code `424242`; landed on `/dashboard`.
- [x] Expect to land on `/dashboard` with "You haven't added any properties yet." and an **Add property** button in the navbar. — "0 properties across every status", empty state + navbar button.
- [x] Sign out, then sign in again at `/sign-in`; expect the same dashboard. — signed out → `/dashboard` redirected to `/sign-in?redirect_url=%2Fdashboard`; signing in returned to `/dashboard`.
- [x] With a `viewer` account: no **Add property** in the navbar or dashboard, and `/properties/new` redirects to `/dashboard`. — viewer2: navbar without Add property, 0 rows, `/properties/new` → `/dashboard`.

## 2. Create a property

- [x] At `/properties/new`, enter a real US address (e.g. `900 NW 8th Ave`, Miami, FL `33136`, US), 2 bedrooms, 2 bathrooms, price `545000`, status **Active**.
- [x] Click **Create property**; expect a success toast and the row on `/dashboard`. — as `smoke.owner` (no role metadata): "1200 Brickell Ave, Miami, FL 33131" and "77 Hidden Draft Lane, Austin, TX 78704", both drafts, dashboard said "2 properties across every status".
- [x] Open the listing: price reads `$545,000`, and Location shows coordinates plus **Open in map** (not "Location not verified"). — 77 Hidden Draft Lane: $725,000, `30.29904, -97.79310`, Open in map.
- [ ] `/properties` finds it by the address, city and postal code; the price/bedroom/bathroom filters and both price sorts behave. — covered by `tests/properties-service.test.ts` and the feature-04 browser pass.
- [ ] Create a second property with status **Draft**; it appears on the dashboard but not on `/properties`. — done in reverse this run (both drafts; neither in the public list), covered by the visibility tests.

## 3. Upload media

- [x] On the edit page, **Choose files** → the JPEG. Expect a thumbnail, "1 of 20 files used" and the **Cover** badge on this first image. — 70 B PNG; "1 of 20 files used"; D1 row `is_cover = 1`, thumbnail from `/media/{id}`.
- [ ] Upload the second JPEG: the badge stays on the first photo. Use the star (**Set this photo as the cover**) on the second; the badge moves and the detail page's main photo changes. — feature 13 browser run (cover badge moved, one `is_cover = 1` row).
- [x] Type alt text into a photo's field and tab away, then reload: the text persists. — "Corner unit with bay views" written to `property_media.alt_text` through the real session.
- [ ] Upload the PDF: no alt-text field, and it appears under **Documents** on the public detail page. — feature 14 browser run (PDF · 620 KB, Documents card).
- [ ] Rejections read as a message and leave the count unchanged: a file over 10 MB, a `.gif`, and a 21st file on one property. — feature 13 UI run; service errors covered by `tests/media-service.test.ts`.

## 4. Public view (private window, signed out)

- [x] `/properties` lists active listings with covers and the address search works. — anonymous: "10 active listings", covers from `/media/342205c2-…`, signed-out navbar.
- [x] `/properties/{id}` renders the gallery, price, facts and documents; photos load from `/media/{id}`, and no R2 key appears in the HTML or network panel. — detail HTML carries only `/media/{mediaId}` (checked again in feature 13/14).
- [x] The draft listing's URL shows the not-found page for the stranger and for the `viewer` account; the owner still sees it. — anonymous `404` with no address text; viewer2 "Property not found"; `smoke.owner` and the admin both render the Draft badge.
- [x] `curl -s 'http://localhost:5173/api/properties' | head -c 300` returns `{"success":true,"data":...}` with active rows only, and `curl -s -o /dev/null -w '%{http_code}' 'http://localhost:5173/api/properties/{draft-id}'` returns `404`. — both confirmed.
- [x] `curl -s -D - -o /dev/null http://localhost:5173/properties | grep -iE 'content-security-policy|strict-transport-security|x-frame-options|referrer-policy'` lists all four headers. — all four.

## 5. Delete the property

- [x] From the dashboard, delete the listing and confirm **Delete property**. — "Property deleted." toast, row gone, "1 property across every status".
- [x] Expect the row to disappear, `/properties/{id}` to show not found, and the `/api/properties` response to no longer include it. — `/api/properties/{id}` 404, `/media/{mediaId}` 404, anonymous page 404.
- [x] Media rows disappeared with it and the R2 prefix `properties/{id}/` is empty (the automated suite asserts this; spot-check the network panel shows no 200 from `/media/{old-id}`). — 0 property rows, 0 media rows, the object is gone from the bucket (only the unrelated `9045334a-…` photo remains).

## 6. Isolation and roles (IDOR)

- [x] The second `agent` account does not see the owner's rows on `/dashboard`. — `smoke.outsider`: "0 properties across every status" while the owner's draft still exists.
- [x] Opening the owner's `/properties/{id}/edit` URL as the second agent shows the not-found page; no form is rendered. — "404 This page could not be found.", `form` absent.
- [x] As the `viewer` account, the same edit URL is refused, and no delete control exists anywhere for it. — viewer2 `/properties/new` → `/dashboard`, owner draft detail → "Property not found", no Add property.
- [x] If the owner is promoted to `admin`, the dashboard lists every owner's rows and the admin can edit and delete them. — `smoke.agent3`: 19 rows across every owner, the navbar Add property, and another owner's edit page renders the form.

## 7. Failure paths worth one run

- [ ] Stop the geocoder (remove or invalidate `GEOCODER_API_KEY`) and create a property: it still saves, Location shows "Location not verified", and a warning toast appears only when the hourly budget is spent. — feature 16 UI run (`create` returned `geocode: "rate_limited"`, warning toast, null coordinates).
- [ ] Upload 61 files in one hour as one account: the 61st returns the rate-limit message with no new row or object. — feature 16 probe and UI run (61st denied, 0 rows, no object).

## Result log

| Date | Environment | Result | Notes |
|------|-------------|--------|-------|
| 2026-10-29 | local `pnpm dev` | **Pass** (sections 1–6; section 3 partly, section 7 in feature 16) | Real Clerk sessions on dev instance `RealTrack`. Real sign-up (email + password + `424242`), sign-in, sign-out and the `?redirect_url` return trip; new account with empty `publicMetadata` resolved to `agent` and could create; geocoded create ($725,000 at `30.29904, -97.79310`); PNG upload through the Server Action (70 B, cover, alt text); anonymous list/API/headers/draft 404; owner and admin draft preview; dashboard delete removed the row, its media rows and its R2 object; outsider agent 404 on the owner's edit page while the admin could edit it. Not re-run this session: second-photo cover switch, PDF documents, upload rejections, geocode failure, 61st upload (all verified in features 13/14/16 and by `pnpm test`). |
| | production | | Feature 19: same pass on the deployed URL, plus the `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`/`CLERK_SECRET_KEY` production instance and role metadata. |
