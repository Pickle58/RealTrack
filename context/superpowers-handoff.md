<!-- Handoff note, not part of the AGENTS.md session reading order. Delete freely once decided. -->

# Handoff: Superpowers + Freebuff tooling

**Date:** 2026-11-02
**Status:** Investigation done; option A was then implemented — see [Update](#update-implemented-2026-11-02). Nothing was installed outside the repo.

## The two requests that produced this

1. `/add-plugin superpowers`
2. `/export`

Neither is a Freebuff command. Freebuff has no slash-command registry for
these, so both arrived as ordinary chat messages and were handled as requests.
There is no plugin marketplace, no plugin install/uninstall, and no transcript
export hook in this client. Nothing was broken; the commands simply do not
exist here.

## How Freebuff skills actually load

Verified this session:

- Skills are read from the **Cloud-synced account skill list**, materialised on
  disk at
  `%USERPROFILE%\.config\freebuff-desktop\account-skills\<account-hash>\<bundle-hash>\<skill-name>\SKILL.md`
  (forward-slash path on this machine:
  `C:/Users/jpilk/.config/freebuff-desktop/account-skills/93cce42…b5/<skill>/SKILL.md`).
- That directory currently holds **26** skill folders — the Clerk, Cloudflare,
  sandbox, eval and `swarm` skills listed at the top of every session.
- Each entry is a plain directory with a `SKILL.md`; there is no executable
  hook, no bootstrap injection, and no manifest that a repo can add to.
- The list is managed from the user's Freebuff account (Cloud), **not** from a
  chat session. An agent cannot write to it; anything that must live there has
  to be added through account settings.
- The session prompt injects only each skill's name, one-line description and
  `SKILL.md` path. Bodies are read on demand.

Consequence: project-local skill folders (however they are installed) do not
appear in that list. The only way a repo can make an agent follow local skill
material is to point at it from [AGENTS.md](../AGENTS.md), which *is* loaded
every session.

## What Superpowers is

Jesse Vincent's `obra/superpowers` — a skills framework, not an npm package.
Skills are plain Markdown at `skills/<name>/SKILL.md`, shipped as a *plugin*
whose value comes from two things:

1. The skill bodies: `brainstorming`, `writing-plans`, `executing-plans`,
   `test-driven-development`, `systematic-debugging`,
   `verification-before-completion`, `requesting-code-review`,
   `receiving-code-review`, `dispatching-parallel-agents`,
   `using-git-worktrees`, `finishing-a-development-branch`, and others.
2. Harness integration: a `using-superpowers` bootstrap that is injected when a
   session starts so the agent is *forced* to consult the right skill before
   working, plus hook-driven activation and subagent review loops.

Part 1 is portable Markdown. Part 2 is not — it depends on the host agent
having plugins and session hooks.

## Options, with what each one actually buys

### A. Vendored reference material (works in Freebuff today)

Clone the repo into the workspace and add a short section to `AGENTS.md`
telling the agent to read the matching `SKILL.md` before non-trivial work.

- Keeps: the whole methodology — spec before code, plan with per-task
  verification, red/green TDD, root-cause debugging, review before "done".
- Loses: automatic triggering. The `AGENTS.md` line has to stand in for the
  bootstrap, and it competes with this repo's existing protocol ("find the
  first unchecked item in `progress-tracker.md` and build only that"). One of
  them has to be declared authoritative for process; Superpowers' mandatory
  brainstorming step otherwise stalls a planned feature.
- Cost: ~20 Markdown files plus a clone in the tree; no dependencies, no build
  impact.

### B. Real Superpowers in a plugin-capable harness alongside Freebuff

Claude Code is installed on this machine (`claude`, 2.1.301) and does have a
plugin system — verified: `claude plugin install|list|uninstall|update`,
`claude plugin marketplace`, `claude plugin details`, `claude plugin eval`.
Upstream's documented install is `claude plugin marketplace add
obra/superpowers` then `claude plugin install superpowers@…`; run
`claude plugin marketplace --help` for the exact argument form, which was not
checked here. Cursor's equivalent is the literal `/add-plugin superpowers`.

- Keeps: everything, including hook-driven activation.
- Loses: nothing, but it is a different agent. It can edit this same checkout;
  the files do not care who writes them.
- Watch out: two agents on one working tree means staging/commit ownership
  needs care, which `AGENTS.md` already warns about.

### C. Port selected skills into the account skill list

The prose-only skills would work as synced skills and would then show up in
this session's skill list automatically. Must be done by the user from
account settings. The bootstrap/hook-dependent pieces do not survive the move;
Freebuff's todo list and `spawn_agents` only partly replace
`dispatching-parallel-agents`.

## Recommendation

- Want the discipline active in Freebuff sessions on this repo → **A**, with
  `AGENTS.md` naming the Superpowers checklist for *how* to execute and leaving
  `progress-tracker.md` authoritative for *what* to build next.
- Want Superpowers as designed → **B**, and use Freebuff for direct edits.
- Don't bother with **C** unless a specific skill is wanted permanently in
  every project.

## Verified vs. assumed

- Verified: Freebuff skill paths and count; `claude` binary, version and plugin
  subcommand list; Superpowers skill layout on GitHub; that both slash commands
  reached the chat as text.
- Assumed, not verified: that no Freebuff plugin hook mechanism exists (inferred
  from the absence of a plugin system, not from documentation);  the exact
  argument syntax of `claude plugin marketplace add`;  whether every Superpowers
  skill works standalone without its bootstrap.

## Update: implemented (2026-11-02)

Option A was chosen. What landed:

- [`.agents/superpowers/`](../.agents/superpowers/README.md) — the upstream
  `skills/` tree copied verbatim from `obra/superpowers` at commit
  `2ce8aa15` (2026-10-21), 15 skills / 84 files, MIT licence included. The
  plugin's `hooks/`, `index.js`, manifest, tests and docs were deliberately not
  copied, because nothing here can load them.
- [AGENTS.md](../AGENTS.md) — a new "Superpowers skills (vendored)" block in the
  session protocol: which `SKILL.md` to read for which kind of work, the
  precedence rule (the tracker decides *what*, the skills decide *how*), and the
  requirement to mirror a skill's checklist into `write_todos`.
- `eslint.config.mjs` and `tsconfig.json` now ignore `.agents/**`. Without that,
  the vendored scripts fail `pnpm lint` (136 `no-undef` errors on
  `console`/`process`) and their `.ts` example files fall inside the typecheck
  include glob. Vendored third-party code stays verbatim instead of being
  patched to satisfy first-party rules.

Still open: nothing from option B or C was attempted, and `progress-tracker.md`
was not updated because no product feature moved.
