# AGENTS.md — Real Estate Tracker

This file is the entry point for any coding agent (Claude Code, Cursor, Codex, Windsurf). Copy it to `CLAUDE.md` if your tool expects that name.

## Session Protocol

**Start of every session:**
1. Read every file in `/context`, in this order:
   `project-overview.md` → `architecture.md` → `code-standards.md` → `library-docs.md` → `ui-tokens.md` → `ui-rules.md` → `ui-registry.md` → `build-plan.md` → `progress-tracker.md`
2. Find the first unchecked item in `progress-tracker.md` → "Up Next". That is the only task for this session.
3. Open that feature's section in `build-plan.md` and follow its UI / Logic / Done-when lists exactly.

**During the session:**
- Build one feature at a time. Do not start the next feature until Done-when is satisfied.
- Do not install packages that are not in the approved list in `code-standards.md`. Update the list first if one is needed.
- Do not violate anything under "Invariants" in `architecture.md` or `ui-tokens.md`.
- Before using any library API, read its section in `library-docs.md`. Prefer an MCP server or installed skill for current API docs if one exists.
- Auth is Clerk. Never write password, session, or auth-cookie code, and never add a `users` table. Use `clerk` CLI commands (`clerk init`, `clerk api`, `clerk config pull`, `clerk open`) and Clerk skills for current patterns.
- Cloudflare is managed with the `cf` CLI (beta) and `cloudflare.config.ts`. Find commands with `cf cli search "<task>"`, read live docs with `cf docs search "<query>"`, inspect request shapes with `cf schema <command>`, and preview any resource change with `--dry-run` first. Never guess command syntax. Never pass `--force` without reading the command's `--help`. Never create a Wrangler config or run `wrangler` / `opennextjs-cloudflare`. `cf` does not run `package.json` scripts. Reference: https://developers.cloudflare.com/cf/llms.txt and https://github.com/cloudflare/skills.
- If the spec is ambiguous, check "Decisions Made" in `progress-tracker.md` before asking or guessing.

**End of every session:**
1. Run `pnpm lint && pnpm typecheck && pnpm build`. Fix failures.
2. Add every new reusable component to `ui-registry.md`.
3. Update `progress-tracker.md` (Completed / In Progress / Up Next / Decisions / Session Notes).
4. If architecture changed, update `architecture.md` in the same session.
