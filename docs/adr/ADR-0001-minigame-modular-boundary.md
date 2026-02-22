# ADR-0001: Minigame Modular Boundary and Host/Display Surface Model

Status: Accepted
Date: 2026-02-17

## Context

Wing Night currently runs as one authoritative server and one client app with host and display routes. That shape remains intentional for MVP and near-term delivery.

Minigames should be modularized for long-term reuse and maintainability. The current trivia implementation proved gameplay feasibility, but mixing game-specific logic directly into broad room-state/UI flows increases coupling and makes future minigames harder to add safely.

NPM extraction is explicitly deferred in this phase. The goal now is modular boundaries inside this monorepo, not package publishing.

## Decision

1. Minigames are implemented as separate packages under `packages/minigames/*`.
2. The server remains authoritative for room lifecycle, timers, host authorization, phase transitions, and score application timing.
3. Minigames return pending round results; the main app applies totals at phase boundaries (for example, on `MINIGAME_PLAY -> ROUND_RESULTS`).
4. Host and display consume separate minigame-derived views: `minigameHostView` and `minigameDisplayView`.
5. Host handoff mode is supported via locked/unlocked host interaction modes:
   - Locked mode: player-safe controls only.
   - Unlocked mode: host-only controls (scoring/admin/override) visible.

## Non-Goals

1. No NPM extraction in this phase.
2. No multi-app split per minigame (no separate app/server projects per game).
3. No persistence/database changes.

## Consequences

### Positive

1. Clearer boundaries between core app orchestration and minigame behavior.
2. Better reuse path for additional minigames in the monorepo.
3. Safer pass-and-play/privacy model through explicit host/display view separation.

### Cost / Tradeoffs

1. Upfront interface and migration work before adding more minigames.
2. Temporary complexity while transitioning existing trivia code.
3. Additional test maintenance to verify boundary behavior and no regressions.

## Rollout

Implementation will follow the task sequence in `TASKS.md`:

1. `8.3 Host Phase-Focused Layout (Non-Game)`
2. `8.4 Host Compact Phase Views (Non-Game)`
3. `8.5 Minigame Module Boundary (Architecture)`
4. `8.6 Trivia Migration to Module Boundary`
5. `8.7 Host/Display Minigame Surface Shell`

Documentation follow-ups are intentionally tracked separately in `TASKS.md`:

1. `D1 SPEC Architecture Alignment (after 8.7)`
2. `D2 README Architecture Alignment (after 8.7)`
3. `D3 AGENTS Guardrail Update (after boundary stabilizes)`
4. `D4 DESIGN Surface Rule Update (only if host/display rules materially change)`
