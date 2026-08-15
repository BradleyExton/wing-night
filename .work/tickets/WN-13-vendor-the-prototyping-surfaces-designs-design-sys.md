---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-13
title: "Vendor the prototyping surfaces (/designs + /design-system routes) — finish the claude-dev-system port"
status: needs-planning   # idea | needs-research | needs-planning | ready | in-progress | in-review | done | blocked | superseded
kind: chore
priority: medium
created: 2026-08-07

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: [WN-23]            # list<id>; DAG edges; must all be `done` before the SELECTOR picks this; default []
blocked_by: []           # list<string>; external/manual waits (free text); non-empty => selector skips; default []
# model: sonnet          # opus | sonnet | haiku; unset => global default-by-kind policy (SCHEMA §5)
# thinking: medium       # low | medium | high; unset => policy
# trust: checkpointed    # checkpointed | heads-down; default checkpointed
# needs_prototype: false # true => prototype must complete before in-progress; default false
# landing: preview-pr    # preview-pr | direct-main | feature-flag; unset => manifest default (SCHEMA §7)
# worktree:              # set by work-on on claim (collision guard); default null
# parallel_safe:         # RESERVED for F-8 (post-MVP) — do not set
---

## Goal
wing-night is only partially ported to claude-dev-system. It has the manifest, `rules/`
(code-design + testing), the `.claude/skills` symlink, both hooks and the ticket template — but not
the **vendored prototyping surfaces**. Give it the `/designs` and `/design-system` routes the system
expects every target project to have, so `port-variant` can complete all three of its outputs here.

## Why this exists (the gap, found 2026-08-07)
`port-variant` SKILL.md:30 states outright: *"in a target project these are the same files under its
vendored route copy."* `docs/PROTOTYPING.md` §1 marks both the designs route and the component
library **"M2 (vendored, new)"** — vendored meaning each project gets its own copy, not that they
live only in claude-dev-system's `apps/board`.

wing-night has neither. Verified 2026-08-07: `apps/client/src/utils/resolveClientRoute/index.ts`
defines exactly `ROOT | HOST | DISPLAY | DEV_MINIGAME | NOT_FOUND`, and the root `design/` directory
is documentation (`tokens.md`, `prompt-templates.md`, `illustration-spec.md`), not a catalog app.

This surfaced when WN-11's plan instructed the implementer to register the ported wizard in a design
catalog that does not exist here. WN-11 now skips outputs 2–3 and names this ticket; it is NOT
blocked on this work, and this ticket can backfill the wizard's catalog entry afterwards.

## Open decisions (why this is `needs-planning`, not `ready`)
These need a grill — guessing them is the exact failure that produced four gate1 parks this week:

1. **Shape.** ~~claude-dev-system's copy is a Next app… same files or same contract?~~
   **RESOLVED 2026-08-14 (plan-work, WN-23 grill):** same *contract*, wing-night's own idiom.
   WN-23 builds the native board shell — `ClientRoute` member + `/dev/*` path + lazy-loaded chunk +
   dev-only Express router — and both surfaces here reuse that mounting shape (hence the new
   `deps: [WN-23]`). No Next code is copied.
2. **Scope.** Both surfaces, or just `/design-system` (the persistent one output 2 needs)? `/designs`
   is ephemeral and GC'd at `done` by the ship tail (O-16/CDS-77) — check whether that GC step even
   exists here before vendoring a route that depends on it.
3. **Dev-gating.** These are dev-only surfaces. wing-night ships as a LAN party app; confirm how
   they are kept out of the production bundle, and that they cannot repeat the
   `ConfigSetupPrototype` failure (a dev-only surface that crashed `tsx --test` via `window` and
   `import.meta.env` — see WN-3).
4. **Token layer.** PROTOTYPING.md §7 says the component library's Foundations section renders the
   live token layer. wing-night's tokens live in `apps/client/tailwind.config.ts` and `design/tokens.md`.
   Decide whether Foundations is in scope or explicitly cut.

## Acceptance Criteria
- [ ] _To be written at planning time — and per the standing rule, every AC asserting something
      about the code must cite the `file:line` that proves it, verified during planning._
- [ ] _Last AC must be a runnable check (`pnpm typecheck` + `pnpm test`, plus a `test_one` spec if a
      route is added — use the pinned manifest form, never bare `pnpm test:e2e`)._

## Plan
<filled at GATE 1>

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- `port-variant` SKILL.md:24-30 (the three outputs; the vendored-copy sentence) and its Boundaries
  section (outputs 2–3 conditional, "skip-and-say, don't skip-and-forget").
- `docs/PROTOTYPING.md` §1 (four surfaces table), §3 (`/designs`), §4 (`/design-system`), §7 (tokens).
- `docs/BOARD.md` — the registries outputs 2–3 append to.
- WN-11 (skips outputs 2–3 pending this ticket); WN-3 (the dev-only-surface crash precedent).
- Upstream: claude-dev-system has **no onboarding checklist** — nothing defines what a fully-ported
  project has, which is why this was missed. Worth a CDS ticket in its own right.
