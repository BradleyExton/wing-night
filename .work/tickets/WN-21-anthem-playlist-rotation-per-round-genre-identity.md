---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-21
title: "Anthem playlist rotation per round + genre identity on the minigame intro screen"
status: ready
kind: feature
priority: medium
created: 2026-08-07

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: [WN-20]
blocked_by: []
---

## Goal
Teams with multi-song playlists hear a different anthem each round (deterministic rotation, no repeats until the playlist wraps), and the MINIGAME_INTRO screen shows the team's genre identity alongside the team spotlight.

## Acceptance Criteria
- [ ] A pure selector `resolveAnthemForRound(team, roundNumber)` picks `anthems[(roundNumber - 1) % anthems.length]` — deterministic, unit-tested directly (single-song, multi-song, wrap-around, empty cases). `useTeamAnthemCue` consumes it instead of hard-coding `anthems[0]`.
- [ ] The MINIGAME_INTRO stage body (apps/client/src/components/DisplayBoard/StageSurface/MinigameIntroStageBody) renders the active team's `genre` label as part of the team spotlight when present, and renders identically to today when absent. Check apps/client/public/mockups/minigame-intro/ (01-team-spotlight) before styling.
- [ ] Rotation is stable across snapshot re-derives and display refresh/rehydrate (same round → same track).
- [ ] `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass, including the new selector tests.

## Plan
Decisions resolved at planning (grilled 2026-08-07, user present):
- **Small playlist per genre (2–4 songs)** was chosen over a single anthem — variety across rounds.
- **Rotation, not random** — testing rules forbid nondeterminism, and rotation guarantees no same-round repeats. Keyed off the round number already in the display snapshot, so a refreshed display picks the same track (rehydrate must not change the pick — WN-2's refresh-rehydrate coverage territory).
- Genre label on the intro screen is pure flavor — copy-level addition to the existing team-spotlight layout, no new layout direction, so no prototype flag.

Implementation shape:
1. Extract/extend the WN-20 selector into `resolveAnthemForRound` (colocated tests; name tests "does X when Y").
2. Thread `roundNumber` (already display-safe in the snapshot) into the cue hook.
3. MinigameIntroStageBody: render `genre` under/next to the team name using existing team-color variant tokens; no motion changes (respect the motion guards from the polish pass).

Out of scope: per-phase ambient beds, genre shown on standings/results surfaces, host controls.

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- [[WN-20]] (foundation: schema, static route, unlock gate, cue hook)
- apps/client/public/mockups/minigame-intro/ (design prototypes for the intro moment)
- apps/client/src/utils/resolveTeamColorVariant (per-team identity precedent)
