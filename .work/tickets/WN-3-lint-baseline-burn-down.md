---
id: WN-3
title: Burn down the 28 baseline lint errors; restore lint to the verify gate
status: ready
kind: chore
priority: medium
created: 2026-08-01
---

## Goal
`pnpm lint` is red at baseline (28 errors of the repo's own custom wingnight rules — hardcoded hex colors in styles.ts, hardcoded JSX copy, inline style props, a max-lines breach). Fix them and put lint back in the default verify gate.

Audit re-verify (2026-08-04): the 28-error count is **confirmed** on the main tree — 13
`wingnight/no-hardcoded-hex-colors-in-styles`, 9 `wingnight/no-hardcoded-component-jsx-text`,
4 `wingnight/no-inline-style-prop`, 1 `wingnight/require-styles-import-in-component-entry`,
1 `max-lines` — across 10 files (DisplayBoard stage bodies/styles, StandingsSurface,
HostControlPanel SetupStage/EatingStage, PlayersSurface). BUT the raw `pnpm lint` run reports
**72 errors + 18 warnings**, because `eslint.config.mjs`'s `ignores` block does not exclude
`.claude/`, so eslint sweeps stale agent worktrees under `.claude/worktrees/*` (44 extra
errors + 18 warnings from old copies of `tools/import-geo-photos/index.mjs` etc.). The gate
must not depend on transient worktree litter — add `.claude/**` to the ignores as part of
this ticket.

## Acceptance Criteria
- [ ] `eslint.config.mjs` `ignores` excludes `.claude/**` (worktree litter can't redden the gate)
- [ ] All 28 baseline errors fixed (no rule disables, no rule weakening)
- [ ] `.work/manifest.yml` re-keys `lint_full` → `lint` so the gate runs it by default
- [ ] `pnpm lint` passes

## Plan
Planned 2026-08-04 (autonomous backlog-audit run — every decision below is
`(self-answered — autonomous run)` unless it restates the ticket's original intent).

Grill summary (scope / edges / architecture / testing):
- **Scope:** the 28 main-tree errors + the `.claude/**` eslint ignore + the manifest
  `lint_full` → `lint` re-key. Cuts: no rule changes, no warning cleanup (main tree has 0
  warnings), no visual redesign — every fix is a mechanical equivalence (same rendered
  output). (self-answered — autonomous run)
- **Error map (verified 2026-08-04):**
  - 13 hex colors: `DisplayBoard/StageSurface/SetupStageBody/styles.ts` (11),
    `DisplayBoard/GameLockedOverlay/styles.ts` (2). Theme tokens live in
    `apps/client/tailwind.config.ts` (`bg`, `surface`, `primary`, `teamA-H`, …).
  - 9 hardcoded JSX copy: `SetupStage/index.tsx` (5), `TurnResultsStageBody`,
    `EatingStageBody`, `SetupStageBody`, `EatingPlayersSurface` (1 each) → move strings to
    the existing `apps/client/src/copy/` modules (`host.ts` / `display.ts`).
  - 4 inline style props: `StandingsSurface`, `EatingStage`, + 2 more → move to colocated
    `styles.ts`; if a value is dynamic, use a style-factory function in `styles.ts` per
    existing repo patterns. (self-answered — autonomous run)
  - 1 `require-styles-import`: `HostControlPanel/PlayersSurface/index.tsx`.
  - 1 `max-lines` (285 > 260): `DisplayBoard/StageSurface/SetupStageBody/index.tsx` → extract
    a coherent subcomponent (its styles move too, which also shrinks the 11-hex hotspot).
- **Edge cases:** a hex with no existing theme token (e.g. rgba overlays/shadows) → add a
  semantic token to `tailwind.config.ts` rather than approximating with a wrong token
  (additive, reversible). (self-answered — autonomous run) Equivalence guard: tokens must
  resolve to the identical color value; no "close enough" swaps.
- **Architecture:** follow the settled conventions only — colocated `styles.ts`, `copy/`
  modules, component extraction per code-design rules. No new abstractions.
- **Verification:** `pnpm lint` green is the machine check; `pnpm typecheck` + `pnpm test`
  must stay green (component tests may need copy-import updates — update imports, never
  assertions-to-pass). Manifest re-key makes `lint` part of the default gate from this ticket
  onward. E2E not required (no behavior change). (self-answered — autonomous run)

Ordering within the ticket: eslint ignore + manifest re-key last, after the 28 errors are
fixed, so the gate flips to green in the same diff that makes it enforceable.

## Progress
_Not started._

## Evidence
_pending_

## Links
- Found by the CDS-52 dogfood run (WN-1 verify gate).
