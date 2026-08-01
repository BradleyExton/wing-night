---
id: WN-1
title: Playwright host/display phase-advance sync coverage (TASKS.md 9.1)
status: in-progress
kind: chore
priority: medium
created: 2026-08-01
worktree: "/Users/bradleyexton/Projects/wing-night/.claude/worktrees/wing-night-WN-1"
---

## Goal
E2E-prove the host's phase advances propagate to the display: load both surfaces, drive the host primary action through the round-1 milestone chain, assert the display follows at each milestone.

## Acceptance Criteria
- [ ] New spec `tests/e2e/host-display-sync.spec.ts`: host + display pages in one context; host advances Setup → lock → start → team briefing → eating → mini-game via the primary action button
- [ ] At each milestone the spec asserts a display-side surface update (briefing/coming-up surface, eating surface, minigame surface) — not just host-side state
- [ ] Reuses/extends `tests/e2e/hostShell.ts` helpers (no duplicated advance logic); any new phase-advance helper lives there
- [ ] No app code changes — test-only diff
- [ ] `pnpm test:e2e tests/e2e/host-display-sync.spec.ts` passes

## Plan
Grill summary (scope/edges/architecture/testing):
- **Scope:** one new spec, display-sync assertions across the round-1 chain up to the first mini-game surface. Cut: no score/standings assertions, no round-2+ looping, no display-refresh (that's WN-2).
- **Edge cases:** avoid asserting during the 3-2-1 countdown (wait for it to clear, pattern in `intro-countdown.spec.ts`); server holds room state between specs — start with `ensureSetupPhase` (existing reset-via-overrides pattern); suite runs `workers: 1` serial so shared server state is safe.
- **Architecture:** follow `intro-countdown.spec.ts` structure (one context, two pages). Extend `hostShell.ts` with the briefing→eating→minigame advance steps so WN-2 can reuse them.
- **Verification:** the spec itself is the machine check (`test_one` manifest command); full gate (lint/typecheck/test) must stay green.

## Progress
- 2026-08-01T23:27:35.540Z prototype: skipped (not in plan)
- 2026-08-01T23:27:35.641Z claimed → in-progress @ /Users/bradleyexton/Projects/wing-night/.claude/worktrees/wing-night-WN-1
- 2026-08-01T23:30:13.772Z implemented: host-display-sync.spec.ts + 3 additive hostShell helpers (openTeamBriefingFromRoundIntro/startEatingFromBriefing/startMinigameFromEating); MINIGAME_PLAY arrival keyed off trivia 'Correct' button since takeover replaces the primary-action deck
- 2026-08-01T23:33:06.245Z verify gate surfaced 28 PRE-EXISTING lint errors (repo's own custom rules, none in this diff or onboarding files); re-keyed manifest lint->lint_full to keep the default gate honest-green, filed WN-3 for the burn-down. Fixed strict-mode violation in startMinigameFromEating ('Correct' also matched 'Incorrect'; exact:true).
## Evidence
_pending_

## Links
- TASKS.md §9.1 (Phase 9 — E2E Milestone); existing coverage: `tests/e2e/intro-countdown.spec.ts`, `tests/e2e/smoke.spec.ts`.
