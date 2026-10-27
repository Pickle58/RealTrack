<!-- Code standards: rules the agent must follow when writing code for this project -->

# Code Standards

Implementation rules for the entire project. Follow these in every session without exception.

---

## Engineering Mindset

- Think before implementing: understand what the feature does and which files it touches before writing code.
- Scope is sacred: only build what the current feature in `build-plan.md` requires.
- Clean over clever: simple, readable code always wins.
- One feature at a time. Verify it end to end before moving on.
- Server-first: React Server Components by default. Use `"use client"` only for interactivity (forms, filters, dialogs).

---

## Language & Type Safety

- TypeScript `strict: true`. No exceptions.
- Never use `any`. Use `unknown` and narrow it.
- Explicit parameter and return types on all exported functions.
- Derive types from Zod schemas (`z.infer`) and Drizzle (`typeof table.$inferSelect`) rather than redeclaring them.
- `const` by default.

---

## File and Folder Naming

- Folders: `kebab-case`
- React components: `PascalCase.tsx`, one component per file
- Everything else (services, lib, actions, validations): `kebab-case.ts`
- Named exports everywhere except Next.js files that require default exports (`page`, `layout`, etc.)

---

## Component / Module Structure

```
imports → types → constants → component/function → exports
```

- No inline styles. Styling is Tailwind classes using tokens from `ui-tokens.md`.
- No business logic in components. Components receive props and call passed-in actions.
- Prefer shadcn primitives (`components/ui`) before building custom ones.

---

## Auth Convention (Clerk)

Authentication is delegated entirely to Clerk. Never write password, session, or cookie code.

```typescript
// lib/auth/guards.ts (shape)
import { auth, clerkClient } from "@clerk/nextjs/server";

export type Role = "viewer" | "agent" | "admin";
export type AppUser = { id: string; role: Role };
export class AuthError extends Error {
  constructor(public code: "unauthenticated" | "forbidden") { super(code); }
}

export async function getOptionalUser(): Promise<AppUser | null>;           // null when signed out
export async function requireUser(allowed?: Role[]): Promise<AppUser>;       // throws AuthError — for actions, services, route handlers
export async function requirePageUser(allowed?: Role[]): Promise<AppUser>;  // redirects to /sign-in or calls notFound() — for pages
export async function getFreshRole(userId: string): Promise<Role>;           // reads Clerk backend; use before destructive writes
```

- Role comes from `sessionClaims.metadata.role`; a missing role means `agent`.
- `auth()` is async. Only call it in server code.
- `requireUser` throws; Server Actions catch `AuthError` and return a failure result. Route handlers map it to 401 / 403.

---

## Server Action Convention

```typescript
"use server";

export async function createProperty(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser(["agent", "admin"]);
    const parsed = propertyInputSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return fail("Please fix the highlighted fields.", parsed.error.flatten().fieldErrors);

    const property = await propertiesService.create(user, parsed.data);
    await emitPropertyEvent("property.created", property);
    revalidatePath("/properties");
    return ok({ id: property.id });
  } catch (error) {
    if (error instanceof AuthError) return fail("You don't have permission to do that.");
    console.error("[actions/properties/createProperty]", error);
    return fail("Could not save the property. Please try again.");
  }
}
```

- Return `ActionResult<T> = { success: true; data: T } | { success: false; error: string; fieldErrors?: Record<string, string[]> }`.
- Authorize first, validate with Zod, then call a service.
- Redirects happen in the calling code after a success result, never inside a `try` block (`redirect()` throws).
- Never expose raw error messages to the client.

---

## Route Handler Convention (reads only)

```typescript
export async function GET(request: Request): Promise<Response> {
  const parsed = searchSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return Response.json({ success: false, error: "Invalid query" }, { status: 400 });
  const viewer = await getOptionalUser();
  const data = await propertiesService.search(parsed.data, viewer);
  return Response.json({ success: true, data });
}
```

- Same `{ success, data?, error? }` envelope as actions.
- Proper status codes: 400 invalid, 401 unauthenticated, 403 forbidden, 404 not found.
- Return **404 (not 403)** for non-active properties to non-owners, so IDs cannot be probed.

---

## Database

- All queries live in `services/`. Never query from `app/`, `components/`, or `actions/` directly.
- Drizzle parameterized builders only. No raw SQL string building.
- Always apply the viewer filter (active-only or owner scope) inside the service, not in the caller.
- Use `db.batch([...])` for multi-statement writes (D1 has no interactive transactions).
- Schema changes: edit `lib/db/schema.ts` → `pnpm db:generate` → commit the generated SQL → `pnpm db:migrate:local`. Never edit generated migrations by hand.
- Money in integer cents. Format only at the UI edge with `formatPrice()`.

---

## Error Handling

- No empty `catch` blocks. Log with a context prefix `[module/function]`, then return a human-readable error.
- Never log PII (full addresses, emails, session tokens). Log IDs.
- Treat KV and geocoder failures as non-fatal (see Failure Behavior in `architecture.md`).
- Each route group has an `error.tsx`; `/properties/[id]` has `not-found.tsx`.

---

## Security

- Authorization check inside every action and service call; `proxy.ts` is only a convenience redirect.
- Never build password, session, or cookie handling. Clerk owns authentication entirely.
- Never trust a role or user ID supplied by the client. Derive both from `auth()`; re-read the role with `getFreshRole` before deletes.
- Uploads: allow-list mime types (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`), max 10 MB each, max 20 files per property. Verify size server-side.
- Never render user HTML. React escaping only; no `dangerouslySetInnerHTML`.
- Rate-limit geocode calls and media uploads per user ID (KV counter, see library-docs). Sign-in and sign-up abuse protection is Clerk's (enable bot protection in the Clerk Dashboard).
- Geocoder and Clerk secret keys only from Worker secrets.
- The CSP must allow Clerk's script, frame, connect, and image origins (see Clerk's CSP guide).

---

## Events

| Event              | When                                  | Properties                          | Effect                                                     |
| ------------------ | ------------------------------------- | ----------------------------------- | ---------------------------------------------------------- |
| `property.created` | After successful insert               | `propertyId`, `ownerId`             | Bump `properties:list:version`                             |
| `property.updated` | After update or media change          | `propertyId`, `ownerId`, `addressChanged` | Bump list version, delete `properties:{id}`          |
| `property.deleted` | After delete                          | `propertyId`, `ownerId`             | Bump list version, delete `properties:{id}`                |

---

## Environment Variables and Bindings

| Name                    | Kind            | Used In                          |
| ----------------------- | --------------- | -------------------------------- |
| `DB`                    | D1 binding      | `lib/db`                         |
| `KV`                    | KV binding      | `lib/kv.ts`                      |
| `MEDIA`                 | R2 binding      | `lib/r2.ts`                      |
| `GEOCODER_API_KEY`      | Worker secret   | `lib/geocoder/*`                 |
| `GEOCODER_PROVIDER`     | Plain var       | `lib/geocoder/index.ts` (default `mapbox`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public var (inlined at build) | `app/layout.tsx` (via Clerk) |
| `CLERK_SECRET_KEY`      | Worker secret   | Clerk server SDK                 |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Public var (`/sign-in`) | Clerk components |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Public var (`/sign-up`) | Clerk components |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Public var (`/dashboard`) | Clerk components |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Public var (`/dashboard`) | Clerk components |
| `APP_URL`               | Plain var       | Redirects, absolute links        |
| `ASSETS`                | Binding (framework) | Static asset responses, generated by the vinext scaffold. Declared with `bindings.assets()`; do not remove. |

Bindings (`DB`, `KV`, `MEDIA`), secrets, and plain vars are all declared in `cloudflare.config.ts` under `worker.env` (`bindings.d1`, `bindings.kv`, `bindings.r2`, `bindings.secret`, `bindings.text`).

Clerk variable names follow the current Clerk docs; confirm against the installed SDK version or the Clerk skills.

Secrets are declared with `bindings.secret()`. Local values go in `.dev.vars` (gitignored; `cf dev` loads it). Deployed secrets are uploaded with `cf deploy --secrets-file <path>` (JSON or `.env` format; keep that file out of git). `NEXT_PUBLIC_*` values must exist at **build time** (`.env.local`), because vinext inlines them. Provide `.dev.vars.example` and `.env.example`.

---

## Comments

- No comments explaining what code does. Comments only for non-obvious "why".

---

## Scripts (package.json)

`dev` (`cf dev`), `build` (`cf build`), `lint`, `typecheck` (`cf workers types && tsc --noEmit`), `test`, `deploy` (`cf deploy`), `db:generate` (`drizzle-kit generate`), `db:migrate:local` (`cf d1 migrations apply <DATABASE_ID> --local`), `db:migrate:remote` (same without `--local`; applies to the remote database by default). `cf` does not run `package.json` scripts, so chain any extra build steps yourself (e.g. `"build": "tsc -b && cf build"`). There is no `preview` or `cf-typegen` script.

---

## Dependencies

Approved dependencies:

- `vinext`, `vite`, `@vitejs/plugin-react`, `@vitejs/plugin-rsc`, `react-server-dom-webpack`, `react`, `react-dom` — framework (vinext reimplements the Next.js 16 API on Vite; Node.js ≥ 22.18). Keep `next` only if the scaffold installs it.
- `@clerk/nextjs` — authentication
- `cf` (dev dependency) and `@cloudflare/vite-plugin` (2.0 beta tag), as installed by `cf init` / `vinext init`
- `drizzle-orm`, `drizzle-kit` — D1 ORM and migrations
- `zod` — validation
- `react-hook-form`, `@hookform/resolvers` — client forms
- `tailwindcss`, `@tailwindcss/postcss`, `tw-animate-css`, `class-variance-authority`, `clsx`, `tailwind-merge` — styling
- `lucide-react` — icons
- shadcn/ui components via the CLI (adds Radix packages as needed)
- `sonner` — toasts
- `vitest` — unit tests
- `typescript`, `eslint`, `@eslint/js`, `typescript-eslint` — type checking and linting (added in feature 01)

Do not install any other packages without updating this list first.

**TypeScript is pinned to `^6.0.3`, not `latest`.** TypeScript 7 ships no compiler API, and `typescript-eslint` (peer range `typescript >=4.8.4 <6.1.0`) refuses it outright. TS 6.0.x is the last line that provides both a `tsc` binary and the API. To get TS 7's speed later, use the side-by-side aliases from the TypeScript 7 release notes: `"@typescript/native": "npm:typescript@^7.0.2"` next to `"typescript": "npm:@typescript/typescript6@^6.0.2"`.

`@vinext/cloudflare` is deliberately **not** a dependency. `create-vinext-app` adds it for its own `vinext-cloudflare deploy` script, but deploys here go through `cf deploy`, so both the package and that script were removed in feature 01.

Dependency build scripts for `workerd` and `esbuild` are allowed declaratively in `pnpm-workspace.yaml` (`allowBuilds: { esbuild: true, workerd: true }`). pnpm ≥ 11 skips dependency lifecycle scripts by default and fails the install with `ERR_PNPM_IGNORED_BUILDS`; `pnpm approve-builds <pkg>` writes that same map.
