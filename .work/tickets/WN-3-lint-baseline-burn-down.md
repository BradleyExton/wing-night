---
id: WN-3
title: Burn down the 28 baseline lint errors; restore lint to the verify gate
status: needs-planning
kind: chore
priority: medium
created: 2026-08-01
---

## Goal
`pnpm lint` is red at baseline (28 errors of the repo's own custom wingnight rules — hardcoded hex colors in styles.ts, hardcoded JSX copy, inline style props, a max-lines breach). Fix them and put lint back in the default verify gate.

## Acceptance Criteria
- [ ] All 28 baseline errors fixed (no rule disables, no rule weakening)
- [ ] `.work/manifest.yml` re-keys `lint_full` → `lint` so the gate runs it by default
- [ ] `pnpm lint` passes

## Plan
_Filled at GATE 1. Discovered during CDS-52 onboarding: the WN-1 handoff re-verify surfaced that the lint gate was red before any ticket work — see files listed by `pnpm lint` (DisplayBoard stage bodies + styles, HostControlPanel setup/eating surfaces, PlayersSurface)._

## Progress
_Not started._

## Evidence
_pending_

## Links
- Found by the CDS-52 dogfood run (WN-1 verify gate).
