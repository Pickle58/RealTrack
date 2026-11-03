# Interactive Browsing Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/properties` shows active listings as map pins; panning the map narrows both the pins and the grid from one server render driven by the URL.

**Architecture:** The viewport is four search params (`n`, `s`, `e`, `w`). `parsePropertySearch` validates them, `services/properties.search` adds a bounding-box predicate and returns `pins`/`withoutLocation` alongside the existing grid page, and one client component (`PropertyMap`) renders Leaflet from that prop and writes rounded corners back to the URL with `router.replace` inside `startTransition`.

**Tech Stack:** vinext (Next.js 16 API on Vite) on Cloudflare Workers, React Server Components, Zod, Drizzle + D1, KV list cache, Leaflet 1.9 with raster tiles, Vitest + Miniflare.

**Spec:** `docs/superpowers/specs/2026-11-03-interactive-map-design.md`

## Global Constraints

- Only `leaflet` and `@types/leaflet` may be added; `context/code-standards.md` must list them before the install runs. No MapLibre, no map SDKs, no clustering plugins.
- The map must never run on the server: Leaflet is imported inside `useEffect` only.
- Pins are `<img>` requests, so the only CSP change is one origin in `img-src`. Never add `unsafe-eval`; never add a `connect-src` entry for tiles.
- Never build pin markup as an HTML string. `L.divIcon` receives a DOM element built with `document.createElement`; listing data goes in through `textContent` / marker `title`, never `innerHTML`.
- Every query stays in `services/`. `components/` and `app/` never touch `lib/db` or D1.
- Marker styling uses tokens only (`bg-accent`, `border-surface`, no hex, no raw Tailwind colours).
- Corners are rounded to 3 decimals (~110 m) before they reach the URL or the cache key.
- `PIN_LIMIT = 500`. Bounds reset `page` to 1. A change to filter, sort or page keeps the current bounds; **Clear filters** drops them.
- Public payloads carry no `ownerId`; pins select listing fields only.
- Page size stays `DEFAULT_PAGE_SIZE = 6` / `MAX_PAGE_SIZE = 50`.
- Build/verify with `cf` only (`pnpm dev`, `pnpm build`). Never Wrangler or opennextjs-cloudflare.

## Review Focus

- **Empty viewport or empty database:** a map with zero pins must open at a fixed country-wide view, never `fitBounds` on an empty set, and must not write `NaN` bounds to the URL.
- **Tiles blocked or provider down:** the CSP host is wrong or the tile host 404s — the panel must stay an empty box with the count line and grid intact, not an error page.
- **Scroll and keyboard on touch:** Leaflet captures drag and wheel; page scrolling must still work, so wheel zoom stays off and the map must not trap focus.
- **Antimeridian and edge pins:** a drag across lng ±180 or a pin exactly on a corner must not produce an inverted box, a dropped pin, or an infinite `replace` loop.
- **Repeated drags and the back button:** ten drags must not create ten history entries, and back must leave `/properties` rather than replay viewports.

---

## File Structure

- `validations/property-search.ts` — bounds fields, the "all four or none" transform, `toBounds`, params round-trip. Owns what a valid viewport is.
- `types/property.ts` — `MapBounds`, `PropertyPin`, and `PropertySearchResult` as a superset of `PropertyListPage`. The dashboard's `listByOwner` keeps the narrower type.
- `services/properties.ts` — bbox predicate, `pins` query, `withoutLocation` count, bounds in the cache key. Owns what a viewport returns.
- `components/properties/PropertyMap.tsx` — new client component. Owns Leaflet, the map instance, and URL writes from panning.
- `components/properties/SearchFilters.tsx` — carries bounds through apply; drops them on clear.
- `app/(public)/properties/page.tsx` — places the map above the grid.
- `next.config.ts` — tile origin in `img-src`.

---

### Task 1: Dependency, env vars, and the tile origin in the CSP

**Files:**
- Modify: `context/code-standards.md` (approved dependency list + environment table)
- Modify: `.env.example`
- Modify: `next.config.ts:20` (`img-src` line), after the `productionClerkHost` const

**Interfaces:**
- Consumes: nothing.
- Produces: `NEXT_PUBLIC_MAP_TILE_URL` (default `https://tile.openstreetmap.org/{z}/{x}/{y}.png`) and `NEXT_PUBLIC_MAP_TILE_ATTRIBUTION` (default `© OpenStreetMap contributors`), readable from any client component at build time.

- [ ] **Step 1: Record the dependency before installing it**

Add to the approved list in `context/code-standards.md`:

```
- `leaflet` — the browsing map (client-only, dynamically imported)
- `@types/leaflet` (dev dependency) — Leaflet ships no types
```

Add to the environment table:

| `NEXT_PUBLIC_MAP_TILE_URL` | Public var (inlined at build) | `components/properties/PropertyMap.tsx`, `next.config.ts` (CSP `img-src`) |
| `NEXT_PUBLIC_MAP_TILE_ATTRIBUTION` | Public var (inlined at build) | `components/properties/PropertyMap.tsx` |

- [ ] **Step 2: Install**

```bash
pnpm add leaflet && pnpm add -D @types/leaflet
```

Expected: `leaflet@1.9.x` and `@types/leaflet@1.9.x` in `package.json`; no other package changes.

- [ ] **Step 3: Add the env vars to `.env.example`**

```
NEXT_PUBLIC_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_MAP_TILE_ATTRIBUTION=© OpenStreetMap contributors
```

- [ ] **Step 4: Derive the tile origin in `next.config.ts`**

Above `contentSecurityPolicy`:

```ts
const mapTileUrl =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/** The tile host is the one third-party image origin this app loads; a malformed value must not break every page. */
function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "https://tile.openstreetmap.org";
  }
}

const mapTileOrigin = originOf(mapTileUrl);
```

and append `${mapTileOrigin}` to the `img-src` line, after the Clerk hosts.

- [ ] **Step 5: Verify the header and the build**

```bash
pnpm build
```

Expected: exits 0. With `pnpm dev` running:

```bash
curl -sI http://localhost:5173/properties | tr ';' '\n' | grep img-src
```

Expected: the `img-src` line ends with `https://tile.openstreetmap.org`. No other directive changed.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml context/code-standards.md .env.example next.config.ts
git commit -m "feat: allow raster map tiles through the CSP"
```

---

### Task 2: Bounds in the search schema

**Files:**
- Modify: `validations/property-search.ts`
- Test: `tests/validations.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `propertySearchSchema` gains optional `n`, `s`, `e`, `w` (numbers; latitude −85…85, longitude −180…180); the schema's output has all four set or all four `undefined`.
  - `export function toBounds(search: PropertySearchInput): MapBounds | null`
  - `PropertySearchInput` still round-trips through `propertySearchToParams`.

- [ ] **Step 1: Write the failing tests**

Add to `tests/validations.test.ts` (import `toBounds`, `propertySearchSchema` values as needed; `parsePropertySearch` and `propertySearchToParams` are already imported):

```ts
describe("map bounds", () => {
  it("keeps a complete, correctly ordered set", () => {
    const parsed = parsePropertySearch({ n: "40.9", s: "40.6", e: "-73.8", w: "-74.1" });
    expect(parsed).toMatchObject({ n: 40.9, s: 40.6, e: -73.8, w: -74.1 });
  });

  it("drops a partial set instead of filtering a line", () => {
    const parsed = parsePropertySearch({ n: "40.9", s: "40.6", w: "-74.1" });
    expect(parsed.n).toBeUndefined();
    expect(parsed.s).toBeUndefined();
    expect(parsed.w).toBeUndefined();
  });

  it("drops inverted corners", () => {
    const parsed = parsePropertySearch({ n: "40.6", s: "40.9", e: "-73.8", w: "-74.1" });
    expect(parsed.n).toBeUndefined();
    expect(toBounds(parsed)).toBeNull();
  });

  it("drops latitudes beyond the projection limit", () => {
    const parsed = parsePropertySearch({ n: "90", s: "-90", e: "10", w: "0" });
    expect(toBounds(parsed)).toBeNull();
  });

  it("writes bounds at three decimals and omits them when absent", () => {
    const withBounds = propertySearchToParams({
      ...defaultPropertySearch,
      n: 40.7124,
      s: 40.6912,
      e: -73.9442,
      w: -74.0258,
    });
    expect(withBounds.toString()).toBe("n=40.712&s=40.691&e=-73.944&w=-74.026");
    expect(propertySearchToParams(defaultPropertySearch).toString()).toBe("");
  });

  it("exposes the viewport as one object", () => {
    const parsed = parsePropertySearch({ n: "41", s: "40", e: "-73", w: "-75" });
    expect(toBounds(parsed)).toEqual({ n: 41, s: 40, e: -73, w: -75 });
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

```bash
pnpm test tests/validations.test.ts -t "map bounds"
```

Expected: FAIL — `n` is undefined, `toBounds` is not exported.

- [ ] **Step 3: Implement the bounds fields**

In `validations/property-search.ts`, next to `optionalNumberParam`, add a coordinate helper that accepts negatives:

```ts
export const MAX_LATITUDE = 85;
export const MAX_LONGITUDE = 180;

function optionalCoordinateParam(max: number) {
  const coordinate = z.coerce.number().min(-max).max(max);
  return z
    .preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      coordinate.optional(),
    )
    .catch(undefined);
}
```

Add the four fields to `propertySearchSchema` (`n`, `s`, `e`, `w`, all `optionalCoordinateParam(MAX_LATITUDE)` except longitude which uses `MAX_LONGITUDE`), then post-process so a partial or inverted box is dropped rather than half-applied:

```ts
export type MapBounds = { n: number; s: number; e: number; w: number };

export function toBounds(search: {
  n?: number;
  s?: number;
  e?: number;
  w?: number;
}): MapBounds | null {
  const { n, s, e, w } = search;
  if (n === undefined || s === undefined || e === undefined || w === undefined) return null;
  if (n <= s || e <= w) return null;
  return { n, s, e, w };
}
```

Chain `.transform((search) => (toBounds(search) ? search : { ...search, n: undefined, s: undefined, e: undefined, w: undefined }))` onto the object schema, so `propertySearchSchema.parse({})` still yields `defaultPropertySearch`.

In `propertySearchToParams`, append the bounds after `pageSize` and round each corner: `Math.round(value * 1000) / 1000`, joining as `params.set("n", String(rounded))` etc., only when `toBounds(search)` is non-null.

- [ ] **Step 4: Run the tests again**

```bash
pnpm test tests/validations.test.ts
```

Expected: PASS, including the existing cases (the file's earlier assertions on `defaultPropertySearch` still hold because `parse({})` returns the same shape).

- [ ] **Step 5: Commit**

```bash
git add validations/property-search.ts tests/validations.test.ts
git commit -m "feat: parse a map viewport from the search params"
```

---

### Task 3: Pins and bounding-box search in the service

**Files:**
- Modify: `types/property.ts:75`
- Modify: `services/properties.ts` (`listCacheKey`, `isCachedSearch`, `runSearch`, constants)
- Test: `tests/properties-service.test.ts`

**Interfaces:**
- Consumes: `toBounds` from Task 2.
- Produces:
  - `export type PropertyPin = { id: string; latitude: number; longitude: number; addressLine1: string }`
  - `export type PropertySearchResult = PropertyListPage & { pins: PropertyPin[]; pinsTruncated: boolean; withoutLocation: number }`
  - `export const PIN_LIMIT = 500` from `services/properties.ts`
  - `search()` keeps its signature `(search: PropertySearchInput, viewer: ServiceViewer) => Promise<PropertySearchResult>`.

- [ ] **Step 1: Write the failing tests**

Add to `tests/properties-service.test.ts` (helpers `seedProperty`, `search`, `defaultPropertySearch` are already imported; `search` builds a full input):

```ts
describe("map viewport", () => {
  const viewport = { n: 41, s: 40, e: -73, w: -75 };

  it("pins only what is inside the box while the grid still paginates", async () => {
    const insideA = await seedProperty(worker, { latitude: 40.5, longitude: -74 });
    const insideB = await seedProperty(worker, { latitude: 40.7, longitude: -73.5 });
    await seedProperty(worker, { latitude: 45, longitude: -74 });

    const result = await properties.search(search({ ...viewport, pageSize: 1 }), null);

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.pins.map((pin) => pin.id).sort()).toEqual([insideA, insideB].sort());
    expect(result.pinsTruncated).toBe(false);
  });

  it("counts listings without coordinates instead of pinning them", async () => {
    await seedProperty(worker, { latitude: null, longitude: null });
    await seedProperty(worker, { latitude: 40.5, longitude: -74 });

    const result = await properties.search(search(viewport), null);

    expect(result.pins).toHaveLength(1);
    expect(result.withoutLocation).toBe(1);
    expect(result.total).toBe(2);
  });

  it("never serves one viewport's cached page to another", async () => {
    const north = await seedProperty(worker, { latitude: 40.5, longitude: -74 });
    const south = await seedProperty(worker, { latitude: 35, longitude: -74 });

    const first = await properties.search(search({ n: 41, s: 40, e: -73, w: -75 }), null);
    const second = await properties.search(search({ n: 36, s: 34, e: -73, w: -75 }), null);

    expect(first.pins.map((pin) => pin.id)).toEqual([north]);
    expect(second.pins.map((pin) => pin.id)).toEqual([south]);
  });

  it("returns no pins for an empty viewport", async () => {
    await seedProperty(worker, { latitude: 45, longitude: -74 });

    const result = await properties.search(search(viewport), null);

    expect(result.pins).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pinsTruncated).toBe(false);
  });

  it("caps pins at PIN_LIMIT and flags the truncation", async () => {
    for (let index = 0; index < 505; index += 1) {
      await seedProperty(worker, { latitude: 40.5, longitude: -74 });
    }

    const result = await properties.search(search(viewport), null);

    expect(result.pins).toHaveLength(properties.PIN_LIMIT);
    expect(result.pinsTruncated).toBe(true);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

```bash
pnpm test tests/properties-service.test.ts -t "map viewport"
```

Expected: FAIL — `result.pins` is undefined.

- [ ] **Step 3: Widen the result type**

In `types/property.ts`, replace the `PropertySearchResult` alias (line 75) with:

```ts
/** A pin carries listing fields only — no owner id, no media. */
export type PropertyPin = {
  id: string;
  latitude: number;
  longitude: number;
  addressLine1: string;
};

export type PropertySearchResult = PropertyListPage & {
  pins: PropertyPin[];
  pinsTruncated: boolean;
  withoutLocation: number;
};
```

`PropertyListPage` stays as it is, so `listByOwner` and the dashboard are untouched.

- [ ] **Step 4: Filter, pin, and count in `runSearch`**

In `services/properties.ts`:

- `export const PIN_LIMIT = 500;` beside `LIST_CACHE_TTL_SECONDS`. No migration is needed: the box is a plain `BETWEEN` scan over the rows the other filters already narrowed, so a geographic index stays out of scope until the table outgrows a D1 scan.
- In `listCacheKey`'s `stableJson` object add `bounds: boundsKey(search)` where `boundsKey` returns `"n,s,e,w"` or `null`:

```ts
function boundsKey(search: PropertySearchInput): string | null {
  const bounds = toBounds(search);
  return bounds ? `${bounds.n},${bounds.s},${bounds.e},${bounds.w}` : null;
}
```

- In `runSearch`, after the bathroom condition, push the box (a listing without coordinates is not in it):

```ts
const bounds = toBounds(search);
if (bounds) {
  conditions.push(
    sql`${properties.latitude} IS NOT NULL AND ${properties.longitude} IS NOT NULL
      AND ${properties.latitude} BETWEEN ${bounds.s} AND ${bounds.n}
      AND ${properties.longitude} BETWEEN ${bounds.w} AND ${bounds.e}`,
  );
}
```

- After the `rows` query, fetch the pins with the same conditions, no pagination, deterministic order, one row over the cap:

```ts
const pinRows = await db
  .select({
    id: properties.id,
    latitude: properties.latitude,
    longitude: properties.longitude,
    addressLine1: properties.addressLine1,
  })
  .from(properties)
  .where(where)
  .orderBy(asc(properties.id))
  .limit(PIN_LIMIT + 1);
```

Narrow each row (`latitude`/`longitude` are nullable) into `PropertyPin`, slice to `PIN_LIMIT`, and set `pinsTruncated = pinRows.length > PIN_LIMIT`.

- Count the unplaceable rows with the same conditions plus a null check:

```ts
const [missingRow] = await db
  .select({ total: count() })
  .from(properties)
  .where(
    and(
      where,
      sql`(${properties.latitude} IS NULL OR ${properties.longitude} IS NULL)`,
    ),
  );
```

- Return `{ items, total, page, pageSize, pageCount, pins, pinsTruncated, withoutLocation: missingRow?.total ?? 0 }`.
- Extend `isCachedSearch` with `Array.isArray(value.pins)`, so a payload cached by an older build is a miss rather than `undefined` in the component.

- [ ] **Step 5: Run the tests again**

```bash
pnpm test tests/properties-service.test.ts
```

Expected: PASS, both the new block and the existing visibility, cache and batching cases.

- [ ] **Step 6: Commit**

```bash
git add types/property.ts services/properties.ts tests/properties-service.test.ts
git commit -m "feat: return map pins for the current viewport"
```

---

### Task 4: The map component, the page, and bounds through the filters

**Files:**
- Create: `components/properties/PropertyMap.tsx`
- Modify: `app/(public)/properties/page.tsx`
- Modify: `components/properties/SearchFilters.tsx` (`toSearchInput`, `apply`, both **Clear filters** buttons)

**Interfaces:**
- Consumes: `PropertySearchInput`, `toBounds`, `propertySearchToParams` (Task 2); `PropertyPin` (Task 3); `NEXT_PUBLIC_MAP_TILE_URL` / `NEXT_PUBLIC_MAP_TILE_ATTRIBUTION` (Task 1).
- Produces: `export function PropertyMap(props: { search: PropertySearchInput; pins: PropertyPin[]; withoutLocation: number; pinsTruncated: boolean }): React.ReactElement`.

- [ ] **Step 1: Write the component**

`components/properties/PropertyMap.tsx` — `"use client"`, static `import "leaflet/dist/leaflet.css";`, one `ref` for the div, and these effects. It imports `type PropertyPin` from `@/types/property` and `propertySearchToParams`, `toBounds`, `type MapBounds`, `type PropertySearchInput` from `@/validations/property-search`. The pan handler is the only part with real decisions, so it is written out:

```tsx
const PAN_DEBOUNCE_MS = 400;
const BOUNDS_TOLERANCE = 0.0005;
const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

function roundBounds(bounds: L.LatLngBounds): MapBounds {
  return {
    n: Math.round(bounds.getNorth() * 1000) / 1000,
    s: Math.round(bounds.getSouth() * 1000) / 1000,
    e: Math.round(bounds.getEast() * 1000) / 1000,
    w: Math.round(bounds.getWest() * 1000) / 1000,
  };
}

function sameViewport(a: MapBounds | null, b: MapBounds): boolean {
  if (!a) return false;
  return (
    Math.abs(a.n - b.n) < BOUNDS_TOLERANCE &&
    Math.abs(a.s - b.s) < BOUNDS_TOLERANCE &&
    Math.abs(a.e - b.e) < BOUNDS_TOLERANCE &&
    Math.abs(a.w - b.w) < BOUNDS_TOLERANCE
  );
}
```

Mount effect (`useEffect`, empty deps): `await import("leaflet")`, create the map with `{ zoomControl: true, scrollWheelZoom: false }` (wheel zoom traps page scrolling on touch and trackpads), set the viewport — `fitBounds` of `search`'s bounds, else `fitBounds` of the pins, else `DEFAULT_CENTER`/`DEFAULT_ZOOM` — and attach `moveend` through a 400 ms debounce that reads `searchRef.current`, builds `propertySearchToParams({ ...search, ...roundBounds(map.getBounds()), page: 1 })`, skips the write when `sameViewport(toBounds(search), rounded)`, and otherwise calls `startTransition(() => router.replace(query ? `/properties?${query}` : "/properties", { scroll: false }))`. Cleanup calls `map.remove()` and clears the timer.

`searchRef` is updated in its own effect so the listener never closes over a stale search. A marker layer `L.layerGroup()` is added once and re-filled in a `pins` effect with one `L.marker([pin.latitude, pin.longitude], { title: pin.addressLine1, alt: pin.addressLine1, icon })` per pin, where `icon` is `L.divIcon({ className: "", iconSize: [18, 18], html: element })` and `element` is a `document.createElement("span")` with `className="block size-[18px] rounded-full border-2 border-surface bg-accent"`. A marker click calls `router.push(`/properties/${pin.id}`)`. A third effect re-fits the map when the URL's bounds stop matching the map (`sameViewport` is false) and the map is already initialised.

Render a `Card className="gap-0 overflow-hidden p-0"` holding a `flex flex-wrap items-center justify-between gap-2 px-4 py-3` count row — `{pins.length} in view` in `text-sm font-medium text-text-primary` with the caveats beside it: `{withoutLocation > 0 ? \`${withoutLocation} without a verified location\` : null}` and `{pinsTruncated ? "Zoom in to see every pin" : null}` in `text-xs text-text-muted` — above a `div ref` with `h-[320px] w-full md:h-[420px]` and `aria-label="Map of listings"`/`role="region"`. While `isPending`, the map div gets `opacity-60` and a `aria-live="polite"` span reads "Updating map…".

- [ ] **Step 2: Place it on the page**

In `app/(public)/properties/page.tsx`, after `<SearchFilters … />` and before the existing `result.items.length > 0 ?` branch:

```tsx
<PropertyMap
  pins={result.pins}
  pinsTruncated={result.pinsTruncated}
  search={search}
  withoutLocation={result.withoutLocation}
/>
```

The map renders for an empty viewport too — the `EmptyState` below it keeps its **Clear filters** link.

- [ ] **Step 3: Carry bounds through the filters**

In `components/properties/SearchFilters.tsx`: `toSearchInput(values, bounds: MapBounds | null)` spreads `...(bounds ?? {})` into the returned input; `apply(next: FilterValues, bounds = toBounds(initial))` passes it through, and both **Clear filters** buttons call `apply(toFilterValues(defaultPropertySearch), null)`. `toFilterValues` stays as it is — it reads only the five filter values, so the map does not disturb typing.

- [ ] **Step 4: Verify**

```bash
pnpm lint && pnpm typecheck && pnpm build
```

Expected: all pass. Then with `pnpm dev` running, on `/properties`:

- pins render for the local dev rows, clicking one opens its detail page;
- dragging to a smaller box changes the URL (`n=…`) and the grid beneath shrinks with it, with no page reset;
- `GET /properties?n=41&s=40&e=-73&w=-75` in a fresh tab opens at that viewport;
- the browser back button leaves the page, not the previous drag;
- the page still scrolls with the pointer over the map (wheel zoom off);
- console shows no CSP violation for the tile host;
- at 375 px wide the map is 320 px tall and scrolls with the page.

- [ ] **Step 5: Commit**

```bash
git add components/properties/PropertyMap.tsx components/properties/SearchFilters.tsx "app/(public)/properties/page.tsx"
git commit -m "feat: browse listings on a map that filters the grid"
```

---

### Task 5: Documentation, feature entry, and the full gate

**Files:**
- Modify: `context/build-plan.md` (new feature entry + the Feature Count table)
- Modify: `context/project-overview.md` (the out-of-scope line, ~111)
- Modify: `context/architecture.md` (pins and bounds)
- Modify: `context/library-docs.md` (Leaflet section)
- Modify: `context/ui-registry.md` (`PropertyMap` entry)
- Modify: `context/progress-tracker.md` (Completed / Up Next / session note)

**Interfaces:**
- Consumes: everything above.
- Produces: nothing code-facing.

- [ ] **Step 1: Add feature 20 to `build-plan.md`**

A new `## Phase 8 — Browse experience` with **20 Interactive map** and the Done-when list:

```
- [ ] Panning the map narrows both pins and grid from one search
- [ ] A viewport URL restores the same map and grid
- [ ] Listings without coordinates are counted, not silently dropped
- [ ] Tiles load under the production CSP
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass
```

Update the Feature Count table: Phase 8 = 1, total = 20.

- [ ] **Step 2: Rewrite the out-of-scope line**

In `context/project-overview.md`, the `Interactive map UI — …` bullet under **Features Out of Scope** becomes a statement of what the map does now (pins in the viewport, grid follows, no clustering, no polygon search), and the pages list mentions the map on `/properties`.

- [ ] **Step 3: Record the invariants and the library pattern**

- `architecture.md`: pins are built from the same conditions as the grid, carry listing fields only, and a viewport is a filter (bounds enter the KV list hash); coordinates stay nullable and the map never invents one.
- `library-docs.md`: a `## Leaflet` section — dynamically imported in a client component's `useEffect` (no SSR), `divIcon` elements built with `document.createElement` (never an HTML string), raster tiles from `NEXT_PUBLIC_MAP_TILE_URL` with attribution, `scrollWheelZoom: false`, OSM tiles are development-only and production needs a provider whose terms allow it.
- `ui-registry.md`: `### PropertyMap` with path, client type, props, the count-row and map-div classes, used-in `/properties`, and a note that Leaflet owns the DOM inside the panel.

- [ ] **Step 4: Run the full gate**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Expected: all pass. Record the test count in the session note.

- [ ] **Step 5: Update the tracker and commit**

`progress-tracker.md`: feature 20 under Completed with the manual checks actually performed, Up Next back to the one open item (feature 16's Clerk toggle), a session note, and a Known Issue if a tile provider is still to be chosen for production.

```bash
git add context/
git commit -m "docs: record the interactive map feature"
```
