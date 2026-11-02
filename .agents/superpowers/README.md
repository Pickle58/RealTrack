# Superpowers (vendored)

A verbatim copy of the `skills/` directory from Jesse Vincent's
[obra/superpowers](https://github.com/obra/superpowers), so this repo's agents can
read and follow it without a plugin harness.

| | |
|---|---|
| Upstream | https://github.com/obra/superpowers |
| Commit | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` (2026-10-21) |
| Vendored | 2026-11-02 |
| License | MIT, © 2025 Jesse Vincent — see [LICENSE](LICENSE) |

## What is here

`skills/<name>/SKILL.md` plus each skill's supporting files (prompts, references,
templates, scripts) — 15 skills, 84 files:

| Skill | Use it when |
|---|---|
| `brainstorming` | Any new feature, component, or behaviour change, before planning |
| `writing-plans` | A spec exists and the work is bigger than one pass |
| `executing-plans` | Carrying out a written plan in this session |
| `subagent-driven-development` | Carrying out an independent-task plan with dispatched agents |
| `test-driven-development` | Any implementation, before the implementation |
| `systematic-debugging` | Any bug, failing check, or unexpected behaviour |
| `verification-before-completion` | Before claiming anything is done, fixed, or passing |
| `requesting-code-review` / `receiving-code-review` | Before merge; when handling review feedback |
| `dispatching-parallel-agents` | 2+ tasks with no shared state |
| `using-git-worktrees` | Feature work that needs an isolated workspace |
| `finishing-a-development-branch` | Deciding how finished work gets integrated |
| `writing-skills` | Authoring or editing a skill like these |
| `using-superpowers` | The upstream bootstrap table — reference only, see below |
| `diagnosing-superpowers` | Analysing Superpowers sessions; not wired into this repo |

## What is not here

The upstream repo also ships `hooks/`, `index.js`, a plugin manifest, `scripts/`,
`tests/` and `docs/`. Those are the parts that make a plugin-capable harness
inject `using-superpowers` at session start and force skill invocation. Freebuff
has no plugin or hook mechanism, so they would be dead weight here and were not
copied. The copies of `using-superpowers` and the per-platform
`references/*-tools.md` files are kept for reference only.

## How it is wired

[AGENTS.md](../../AGENTS.md) → "Superpowers skills (vendored)" tells the agent
which `SKILL.md` to read for a given kind of work. There is no automatic trigger:
the AGENTS.md section *is* the trigger, and it is read every session.

Precedence: this project's own instructions win. `progress-tracker.md` decides
what to build next and what "done" means; the Superpowers skills decide how to
carry that out. The skills agree with this — `using-superpowers` states that user
instructions (AGENTS.md and friends) take precedence over skills.

## Updating

```bash
rm -rf .tmp-superpowers
git clone --depth 1 https://github.com/obra/superpowers .tmp-superpowers
rm -rf .agents/superpowers/skills
cp -R .tmp-superpowers/skills .agents/superpowers/skills
cp .tmp-superpowers/LICENSE .agents/superpowers/LICENSE
rm -rf .tmp-superpowers
```

Then update the commit and date in the table above, and re-check the AGENTS.md
skill list if upstream added, renamed, or removed a skill. Vendored files are
kept verbatim on purpose: local edits make the next update a merge instead of a
copy, so put project-specific rules in AGENTS.md, not in these files.
