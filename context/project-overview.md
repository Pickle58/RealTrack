<!-- Project overview: what you're building, why, and who it's for -->

# Project Overview

## About the Project

Real Estate Tracker is a web app where agents catalog property listings (address, bedrooms, bathrooms, lot size, electric service, septic, water, price, status, photos and documents) and where anyone can browse and search the active listings. It covers built homes and vacant land: bedrooms and bathrooms are optional, and lot size can be recorded in square feet or acres. It runs entirely on Cloudflare (Workers, D1, KV, R2).

---

## The Problem It Solves

Agents keep property details in spreadsheets, notes, and scattered photo folders. Addresses are inconsistent, nothing is searchable, and media is detached from the record. This app gives each property one structured record with a normalized, geocoded address and its media attached, plus fast search for the public.

---

## Pages

```
/                        → Landing page: hero, search box, featured active listings
/properties              → Public search and listing grid (filters, sort, pagination)
/properties/[id]         → Property detail: gallery, facts, address, status, map coordinates
/properties/new          → Create property (auth required)
/properties/[id]/edit    → Edit property and manage media (owner or admin)
/dashboard               → "My listings" table with status, edit, delete (auth required)
/sign-in                 → Clerk sign-in
/sign-up                 → Clerk sign-up
```

---

## Navigation

Top navbar only. Left: RealTrack logo (two-colour mark: accent teal roof over an ink house body, wordmark `Real` in ink and `Track` in the accent). Links in order: **Browse** (`/properties`), **Dashboard** (`/dashboard`, signed-in only). Right: **Sign in / Sign up** buttons when signed out; Clerk `UserButton` when signed in. A primary **Add property** button appears in the navbar for `agent` and `admin`.

---

## Core User Flow

### 1. Browse (anonymous)

1. Visitor opens `/properties`.
2. Filters: free-text address/city, min/max price, min bedrooms, min bathrooms, status (active only for anonymous users).
3. Server renders the result page. Results are cached in KV by query hash.
4. Visitor opens a property to see photos, facts, and location.

### 2. Create a property (agent)

1. Agent signs up or signs in through Clerk, clicks **Add property**.
2. Fills the form (address, bedrooms, bathrooms, lot size and unit, electric, septic, water, price, status). Bedrooms, bathrooms, lot size and electric are optional, so vacant land can be saved without them.
3. Server Action validates input → geocodes the address (cache first) → inserts into D1 → emits `property.created` → redirects to the edit page to add media.
4. If geocoding fails the property still saves with null coordinates and a visible "Location not verified" note.

### 3. Manage media (agent)

1. On the edit page, agent uploads images / PDFs.
2. Server Action validates type and size → writes to R2 under `properties/{propertyId}/media/{mediaId}` → inserts `property_media` row.
3. Agent can edit alt text, delete media, and mark a cover image (first uploaded by default).

### 4. Edit / delete

Owner or admin edits fields (re-geocodes if address changed) or deletes the property (cascades to media rows and R2 objects). Both emit events that invalidate caches.

---

## Data Architecture

### Property

- Lives in D1 `properties`: the single system of record.
- Changes only through Server Actions in `actions/` → `services/properties.ts`.
- Used by SSR pages and the JSON read API.
- Must never be written from components, route handlers for GET, or KV.

### Property media

- Metadata in D1 `property_media`; bytes in R2.
- DB row and R2 object must stay in sync (see invariants in architecture.md).

### Cache

- Lives in KV only (`properties:*`, `geocode:*`, `ratelimit:*`). All entries have a TTL. Cache is never the source of truth.

### User identity

- Lives in Clerk. D1 stores only the Clerk user ID as `properties.owner_id`.
- Role lives in Clerk `publicMetadata.role`.
- The app never stores passwords, sessions, or copies of user profile data.

---

## Features In Scope

- Property CRUD with status (draft, active, sold, off-market)
- Houses and vacant land in one record: optional bedrooms/baths plus lot size (sq ft or acres) and electric service
- Address normalization and lat/lng via external geocoding API
- Search and filter by address text, price, bedrooms, bathrooms, status
- Media upload, list, delete (images, floor plans, documents)
- Clerk authentication (prebuilt components); roles viewer / agent / admin via Clerk public metadata; ownership checks
- KV caching of list results and property detail with event-driven invalidation
- Edge deployment on Cloudflare with WAF/CDN in front

---

## Features Out of Scope

- Multi-tenancy / organizations — ownership is per user only (open question in spec; deferred)
- Image resizing / processing pipeline — originals are stored and served as-is
- Filters beyond address, bedrooms, bathrooms, price, status
- Payments, offers, messaging, saved searches, favorites
- Interactive map UI — coordinates are stored and shown as text plus an external map link
- Custom-built auth screens — Clerk's prebuilt `<SignIn />` / `<SignUp />` are used. Social login is switched on in the Clerk Dashboard, not coded.
- Clerk Organizations / shared team listings — ownership is per user for v1

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router, React Server Components), Tailwind CSS v4, shadcn/ui
- **Backend:** Next.js SSR, Server Actions, route handlers — run on Cloudflare Workers via vinext (the Next.js API on Vite) and the Cloudflare Vite plugin
- **Database:** Cloudflare D1 (SQLite) with Drizzle ORM
- **Cache:** Cloudflare KV (list/detail cache, geocode cache, rate limits)
- **Media:** Cloudflare R2 (binding access)
- **Auth:** Clerk (`@clerk/nextjs`), set up with the Clerk CLI
- **External:** Geocoding & Address API (vendor behind an interface; geocod.io)
- **Edge:** Cloudflare CDN + WAF; built and deployed with the Cloudflare CLI (`cf`)

---

## Events (server-side)

```typescript
property.created; // { propertyId, ownerId }
property.updated; // { propertyId, ownerId, addressChanged }
property.deleted; // { propertyId, ownerId }
```

---

## Target User

Primary: real-estate agents or small teams tracking their own listings. Secondary: the public searching active listings without an account.

---

## Success Criteria

- An agent can create, edit, and delete a property with media in under a minute each.
- Anonymous users can search and view only `active` properties; drafts are never exposed.
- An agent can never modify another agent's property (verified by tests).
- Repeat list queries are served from KV; a mutation makes the next read fresh.
- The app deploys to Cloudflare with `cf deploy` and passes lint, typecheck, and build.
