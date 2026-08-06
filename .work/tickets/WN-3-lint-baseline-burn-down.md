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
**72 errors + 18 warnings** (2026-08-04; 78 + 19 by 2026-08-06 — this figure drifts with
whatever worktrees exist and is diagnostic only, never a target), because `eslint.config.mjs`'s `ignores` block does not exclude
`.claude/`, so eslint sweeps stale agent worktrees under `.claude/worktrees/*` (44 extra
errors + 18 warnings from old copies of `tools/import-geo-photos/index.mjs` etc.). The gate
must not depend on transient worktree litter — add `.claude/**` to the ignores as part of
this ticket.

Re-verified 2026-08-06 (gate1 park, WN-3.gate1.json): the main tree now reports **36 errors +
1 warning**, not 28. The 8 extra errors + 1 warning are ALL in
`apps/client/src/components/HostControlPanel/ConfigSetupPrototype/` — the throwaway variant lab
that landed in 9001a1f, after this ticket's audit (4x `component-entry-file-name` on
VariantA/B/C + VariantSwitcher, 4x `no-nonsemantic-color-tokens-in-styles` in its styles.ts).
That lab is **deleted by WN-11**, so fixing its lint is wasted work that would also conflict
with WN-11's diff. Resolution (chosen over `deps: [WN-11]`, which would push lint back behind
the whole feature arc): **ignore the lab** — it is dev-gated throwaway code that was never
meant to satisfy production rules. `36 - 8 = 28`, so the original scope below is exactly
correct once the carve-out is in. Verified 2026-08-06: `eslint . --ignore-pattern '.claude/**'`
→ 36 errors/1 warning; the lab alone → 8 errors/1 warning.

## Acceptance Criteria
- [ ] `eslint.config.mjs` `ignores` excludes `.claude/**` (worktree litter can't redden the gate)
- [ ] `eslint.config.mjs` `ignores` also excludes
      `apps/client/src/components/HostControlPanel/ConfigSetupPrototype/**`, with an inline
      comment naming WN-11 as the ticket that deletes both the lab and this entry. This is a
      scope carve-out for throwaway code, NOT a rule disable or rule weakening — no rule
      definition changes and no `eslint-disable` comment is added anywhere.
- [ ] All 28 baseline errors fixed (no rule disables, no rule weakening)
- [ ] `.work/manifest.yml` re-keys `lint_full` → `lint` so the gate runs it by default
- [ ] `pnpm lint` passes

## Plan
Planned 2026-08-04 (autonomous backlog-audit run — every decision below is
`(self-answered — autonomous run)` unless it restates the ticket's original intent).

Grill summary (scope / edges / architecture / testing):
- **Scope:** the 28 main-tree errors + the `.claude/**` eslint ignore + the
  `ConfigSetupPrototype/**` ignore (added 2026-08-06 — see the Goal's gate1 re-verify) + the
  manifest `lint_full` → `lint` re-key. Cuts: no rule *definition* changes (the two `ignores`
  entries are scope carve-outs, not rule edits — this cut does NOT forbid them), no warning
  cleanup (main tree has 0 warnings once the lab is excluded — the 1 current warning is the
  lab's), no visual redesign — every fix is a mechanical equivalence (same rendered output).
  (self-answered — autonomous run)
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
- 2026-08-06T01:18:31.126Z gate1 (product-owner critic, 2026-08-05): **needs-changes** — re-planning required. Verdict recorded at .work/verdicts/WN-3.gate1.json.

Summary: "Well-formed with a real machine check (`pnpm lint` passes), and every named file/token/module is real — but the error map is stale: the main tree now has 36 errors, not 28, and the extra 8 are all in the throwaway `ConfigSetupPrototype/` lab that WN-11 is scheduled to delete, a coupling WN-3 neither declares nor gives direction on."

MAJOR finding: `pnpm lint` (excluding .claude/**) now reports 36 errors + 1 warning on the main tree, not 28/0. The 8 extra are all in apps/client/src/components/HostControlPanel/ConfigSetupPrototype/ — 4x wingnight/component-entry-file-name (VariantA/B/C.tsx, VariantSwitcher.tsx) + 4x wingnight/no-nonsemantic-color-tokens-in-styles (styles.ts). That folder landed in 9001a1f (2026-08-05), AFTER this ticket's 2026-08-04 audit. AC #4 (`pnpm lint` passes) cannot be met without dealing with them, but AC #2 caps scope at '28 baseline errors' and the Plan's cut list forecloses rule/ignore changes. Every remaining option is bad: properly fixing the lab means renaming 4 files into index.tsx folders and re-tokenising styles in code WN-11 AC#5 mandates deleting (wasted work + a conflict against WN-11); an inline disable violates AC #2. Needs one line of direction — most likely deps: [WN-11], or an explicit 'ignore ConfigSetupPrototype/** until WN-11 lands' carve-out.

MINOR: the raw-lint figure is stale too — Goal says 72 errors + 18 warnings from .claude/worktrees litter; actual is 78 + 19 (42 from three stale worktrees at 14 each + 36 main-tree). Diagnosis and fix are still correct; the number is not a target.

Verified clean: eslint.config.mjs really lacks .claude/** in ignores; manifest really keys lint_full; the 28-error breakdown outside the lab matches exactly; copy/ modules and tailwind tokens all exist.

Routing: status ready → needs-planning; next: plan-work WN-3.

## Evidence
_pending_

## Links
- Found by the CDS-52 dogfood run (WN-1 verify gate).
