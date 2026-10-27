# Real Estate Tracker — Context Files

Context files that turn the technical spec into a step-by-step build for a coding agent. Structure follows `jsmastery-pro/context-driven-dev`.

## Layout

```
AGENTS.md                      # agent entry point (copy to CLAUDE.md if needed)
context/
├── project-overview.md        # what, who, pages, flows, scope
├── architecture.md            # stack, folders, boundaries, flows, schema, KV/R2, auth, invariants
├── code-standards.md          # rules the agent must follow, approved deps, env vars
├── library-docs.md            # project-specific patterns: cf + vinext, D1/Drizzle, KV, R2, Clerk, Zod, shadcn
├── ui-tokens.md               # design tokens (Tailwind v4 @theme)
├── ui-rules.md                # layout / component / state rules
├── ui-registry.md             # living list of built components
├── build-plan.md              # 8 phases (0–7), 19 features, each with Done-when
└── progress-tracker.md        # live status, decisions, session notes
```

## Prerequisites

- Node.js ≥ 22.18 (required to load `cloudflare.config.ts`) and `pnpm`
- **Clerk CLI** (`clerk`) installed, and a Clerk account. The agent runs `clerk init` in build-plan feature 10.
- **Cloudflare CLI** (`cf`, beta): `npm install --global cf`, then `cf auth login`. Docs: https://developers.cloudflare.com/cf/. Wrangler and OpenNext are **not** used.
- A geocoding API key (Mapbox by default), needed from feature 12.

**Stack maturity:** `cf` (beta), the Cloudflare Vite plugin 2.0 (beta), and vinext ("under active development") are newer than the OpenNext + Wrangler path. Feature 02 is a go/no-go spike that includes Clerk. If it fails, the agent stops and asks you rather than switching tools.


## How to use

1. Copy `AGENTS.md` and `context/` into an empty project folder and `git init`.
2. Review `progress-tracker.md` → "Decisions Made". These resolve the spec's open questions; change any you disagree with **before** building.
3. Replace the placeholder palette in `ui-tokens.md` if you have a design.
4. Start your agent with:
   > Read AGENTS.md and follow the session protocol. Do the next task from progress-tracker.md.
5. Repeat one session per feature. Review the diff, then let the agent update the tracker.

## Where the spec went

| Spec section | Context file |
|---|---|
| 1 Overview | project-overview, architecture (Stack) |
| 2 Components | architecture (Folder structure, boundaries), library-docs |
| 3 APIs / events | architecture (Data flows, Routes, Events), code-standards |
| 4 Data model | architecture (Database schema, KV, R2) |
| 5 Authn / Authz | architecture (Authentication), library-docs (Clerk), build-plan phase 3 (Clerk) |
| 6 Threat model | code-standards (Security), architecture (Invariants), build-plan phase 7 |
| 7 Failure modes | architecture (Failure behavior), build-plan phases 5–7 |
| 8 Open questions | progress-tracker (Decisions Made) |
