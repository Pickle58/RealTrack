# Interactive map for browsing listings — design

**Date:** 2026-11-03
**Status:** approved 2026-11-03
**Touches a documented decision:** this replaces the "Interactive map UI" line under **Features Out of Scope** in `context/project-overview.md`.

---

## Intent

Visitors browse active listings as pins on a map they can pan and zoom, and the map's viewport is the filter: what is on screen is what the grid below lists.

Today the map is one line of text — coordinates plus an **Open in map** link out to Google Maps (`app/(detail)/properties/[id]/page.tsx:26-31`). A grid of cards answers "what is for sale" only if the visitor already knows where to look; a map answers "what is near here", which is how people actually search for property.

## Goals

- `/properties` gains a map above the existing grid, with one pin per active listing in the viewport.
- Pan and zoom narrow the results: when a drag settles, the viewport goes into the URL and the server re-renders both pins and grid page from **one** query.
- Pins and grid can never disagree.
- A shared link restores the same viewport, and drags never fill the back button.
- Listings with no coordinates are counted and disclosed, never silently dropped.
- The grid stays the complete, accessible path; the map is additive and its failure never blocks browsing.

## Non-goals

- Clustering at low zoom, polygon/radius drawing.
- Pin popups or hover mini-cards — a pin click navigates to `/properties/{id}`.
- A map on the detail page; that keeps its current **Open in map** link.
- An explicit "search this area" button, saved views, or a mobile full-screen map mode.
- Antimeridian wrapping (lng ±180) and tile coverage beyond what the provider serves.

## Anti-goals

- A second source of truth for filters living in the client.
- A map that can show a non-active listing.
- Results that require JavaScript to exist at all.

## Constraints

- **RSC by default.** The map is the app's first third-party client widget; everything else is server components, Server Actions and `router.push`.
- **Strict CSP** in `next.config.ts`: `default-src 'self'`, `img-src` limited to self/Clerk/`data:`/`blob:`, `connect-src` to self/Clerk/Turnstile, and no `'unsafe-eval'` anywhere. Raster tiles are plain `<img>` requests, so the tile host must join `img-src`.
- **Approved dependencies** (`context/code-standards.md`) contain no map library; the list must be amended before the install.
- **No spatial index.** `properties` indexes status, owner, city, price and bedrooms — not `latitude`/`longitude`, both nullable reals (`lib/db/schema.ts`).
- **KV list cache.** Public reads are cached 60 s under a key hashed from the normalized filters (`services/properties.ts:207-221`). The viewport must enter that key or panning writes a new KV entry per drag.
- **No owner ids in public payloads** — removed deliberately in feature 16; pins inherit that.

## Approaches considered

1. **Bounds in the URL, one server render per pan.** Viewport is search params; one `search()` call returns pins and the grid page. *Chosen.*
2. **Client-owned map with a pins endpoint.** The map fetches pins itself and the grid updates separately. Pins feel instant, but it introduces the first data-fetching client layer in the codebase (an audit of `components/` and `app/` finds no `fetch()` at all), duplicates filter logic, and needs a second cache.
3. **One payload of all pins, corners filtered in the browser.** Trivial and instant on today's three listings; collapses as the data grows and moves the source of truth into the browser.

Approach 1 wins because it keeps one source of truth, adds no second cache to invalidate, and reuses a navigation pattern already proven here (`SearchFilters` already does `startTransition(() => router.push(...))`).

## Decided by you

- A browsing map: every active listing as a pin, pan and zoom, a click through to the listing.
- Panning narrows the results.
- The grid narrows with it — same bounds, same set.
- Approach 1.

## Decided by me (override any of these)

1. **Leaflet 1.9 with raster tiles**, dynamically imported so it never runs on the server. ~40 KB, no eval, no workers, tiles are images. MapLibre GL is the runner-up (vector tiles, better looking) but brings workers, `connect-src` entries and a heavier bundle for a feature that draws one marker layer.
2. **Tile URL comes from one public env var** (`NEXT_PUBLIC_MAP_TILE_URL`, plus an attribution string). OSM's standard tiles are fine for local development but their policy does not cover production traffic, so production needs a provider that permits it. One env var, no code change — see *Open items*.
3. **Panning writes the URL with `router.replace(..., { scroll: false })`** inside `startTransition`: no history entry per drag, and the grid can show a pending state. Filter changes keep `router.push`.
4. **Corners rounded to 3 decimals** (~110 m) before they reach the URL or the cache, and **page resets to 1** whenever bounds change.
5. **Pins are capped at 500** with a `pinsTruncated` flag and a "zoom in to see all" note.
6. **A bare `/properties` writes no bounds.** The server returns every active pin, the client fits the map to them, and the URL only gains `n/s/e/w` after the first pan — so the default URL stays clean and existing links keep working.
7. **Map height 320px on mobile, 420px from `md`**, inside a `Card` (every content section lives in a card).

## How it works

### URL and validation

`validations/property-search.ts` gains `n`, `s`, `e`, `w`:

- numbers, lat clamped −85…85, lng −180…180, and only accepted as a set when `n > s` and `e > w`;
- invalid or partial bounds fall back to `undefined` through the existing `.catch(undefined)` style, so junk never breaks the page;
- `propertySearchToParams` writes them at 3 decimals and omits them entirely when absent;
- `bounds` becomes part of `PropertySearchInput`, so the cache hash and the URL agree by construction.

### Service

`runSearch` adds one predicate when bounds exist:

```sql
latitude IS NOT NULL AND longitude IS NOT NULL
  AND latitude BETWEEN s AND n AND longitude BETWEEN w AND e
```

`search()` now returns `{ items, total, page, pageSize, pageCount, pins, pinsTruncated }`. `pins` runs the same conditions without pagination, `limit 501`, selecting only `id, latitude, longitude, priceCents, currency, addressLine1`, ordered by `id` so the cap is deterministic. The public viewer filter is unchanged, so a pin can never be a draft.

### UI

New `components/properties/PropertyMap.tsx` (client):

- mounts a `ref`'d div and `await import("leaflet")` inside `useEffect`; Leaflet's stylesheet is a static import;
- draws one `L.divIcon` marker per pin styled with project tokens (not Leaflet's default PNG assets);
- fits the map to the returned pins on first load, falling back to a fixed country-wide view when there are no pins at all;
- marker click → `router.push("/properties/{id}")`;
- `moveend`, debounced 400 ms → round the corners, drop `page`, `router.replace(...{ scroll: false })` in a transition;
- when the URL's bounds differ from the map's current view (deep link, back/forward), `fitBounds(..., { animate: false })`;
- carries the current bounds through filter, sort and page changes (`SearchFilters.apply` must preserve them), while **Clear filters** drops them;
- above the map: "N listings in view" and, when any exist, "M not shown — location not verified".

`/properties` renders the map above `PropertyGrid` and keeps its current empty state.

### Failure behaviour

Tiles unreachable or Leaflet failing to load → the map renders as an empty panel, and the count line plus the grid still work. An in-bounds empty result keeps the map where it is and shows the existing "No properties match your filters" state, whose **Clear filters** also drops the bounds.

### CSP

`next.config.ts` adds the tile origin to `img-src`, read from `NEXT_PUBLIC_MAP_TILE_URL` at startup (defaulting to the OSM host). No `connect-src`, `script-src` or `frame-src` change — raster tiles are images, and Leaflet injects no scripts.

### Tests

- `validations.test.ts`: bounds parse; inverted or partial bounds become `undefined`; params round-trip; 3-decimal rounding.
- `properties-service.test.ts`: bbox includes and excludes by corner; rows with null coordinates never appear as pins; `items` still paginate while `pins` do not; the cache key differs when bounds differ; the cap sets `pinsTruncated`.
- Manual pass on `cf dev`: pan changes URL, pins and grid together; a deep link restores the viewport; browser back leaves the page rather than replaying drags; mobile height; console clean under the CSP.

### Docs updated in the same change

`project-overview.md` (out-of-scope → in-scope, pages list), `architecture.md` (pins carry public fields only; bounds are a filter), `code-standards.md` (dependency and CSP note), `library-docs.md` (Leaflet: dynamic import, no SSR, attribution), `ui-registry.md` (`PropertyMap`), `build-plan.md` (feature entry with Done-when), `progress-tracker.md` at session end.

## Left to the builder

- Marker styling within the tokens, and whether the count line sits above the map or in its corner.
- The pending indicator while a bounds re-render is in flight.
- Whether an in-bounds empty result should offer "zoom out" alongside **Clear filters**.

## Open items

- **Production tile provider.** Development uses OSM's tiles; publishing needs a provider whose terms cover production (MapTiler's free tier, or OpenFreeMap, which needs no key). This is an env var, not a code change, and it must be settled before the map is reachable by the public.
- **Out-of-scope line.** `project-overview.md` still says an interactive map is out of scope; the first commit of this feature should rewrite it rather than leave the documents contradictory.
