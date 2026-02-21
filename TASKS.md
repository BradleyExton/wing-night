# TASKS.md

Wing Night -- Codex-First Build Plan

## Execution Tracker

Status keys:
- [ ] Not started
- [-] In progress (branch/PR open)
- [x] Merged to main

Current in-progress work:
- (none)

Audit snapshot (2026-02-19):
- Verified against local tree at `dd0b155` and current test inventory under `tests/e2e/*`.
- `9.1` and `9.2` remain intentionally open; current E2E coverage includes shell smoke + override sync, but not explicit phase-advance sync and refresh-rehydrate milestone assertions.
- Phase 11/12 tasks are post-MVP platformization work for full-screen minigame takeover and cross-title reuse.

Completed:
- [x] R4 DRY Readability Epic
  - Branch: `refactor/host-display-decomposition`
  - PRs: [#65](https://github.com/BradleyExton/wing-night/pull/65) -> [#72](https://github.com/BradleyExton/wing-night/pull/72)
  - ADR: `docs/adr/ADR-0002-dry-readability-epic.md`
  - Verification:
    - [x] `pnpm test`
    - [x] `pnpm lint`
    - [x] `pnpm typecheck`
    - [x] `pnpm playwright test` (smoke baseline)
  - Notes:
    - R4.8 hardening is complete.
    - Phase 9 Playwright scenario tasks remain deferred and tracked separately (`9.1`, `9.2`).
- [x] R3 Host Header Dynamic Context Refactor (audited against `main`)
  - Branch: `phase-r3-host-header-dynamic-context`
  - PR: [#59](https://github.com/BradleyExton/wing-night/pull/59)
  - Audit evidence:
    - `HostPanelHeader` dynamic phase + round context coverage in `apps/client/src/components/HostControlPanel/HostPanelHeader/index.test.tsx`.
    - Active-team context for `EATING`/`MINIGAME_*` follows SPEC team-name-only contract (no turn-progress label).
    - Compact non-game host surfaces remain covered in `apps/client/src/components/HostControlPanel/index.test.tsx`.
- [x] Tracker Sync for 8.12 + D Tasks
  - Branch: `phase-d-task-tracker-sync`
  - PR: [#56](https://github.com/BradleyExton/wing-night/pull/56)
  - Merge timestamp: `2026-02-18T03:56:48Z`
- [x] D6 README Team-Turn Flow Alignment
  - Branch: `phase-d6-readme-team-turn-flow-alignment`
  - PR: [#53](https://github.com/BradleyExton/wing-night/pull/53)
  - Merge timestamp: `2026-02-18T03:55:03Z`
- [x] D5 SPEC Team-Turn Flow Alignment
  - Branch: `phase-d5-spec-team-turn-flow-alignment`
  - PR: [#54](https://github.com/BradleyExton/wing-night/pull/54)
  - Merge timestamp: `2026-02-18T03:55:00Z`
- [x] D4 DESIGN Surface Rule Update
  - Branch: `phase-d4-design-surface-rule-audit`
  - PR: [#55](https://github.com/BradleyExton/wing-night/pull/55)
  - Notes: no `DESIGN.md` change required (no material divergence from current surface rules)
  - Merge timestamp: `2026-02-18T03:54:58Z`
- [x] D3 AGENTS Guardrail Update
  - Branch: `phase-d3-agents-guardrail-update`
  - PR: [#57](https://github.com/BradleyExton/wing-night/pull/57)
  - Merge timestamp: `2026-02-18T03:54:55Z`
- [x] 8.12 Host/Display Team-Turn Surfaces
  - Branch: `phase-8-12-host-display-team-turn-surfaces`
  - PR: [#58](https://github.com/BradleyExton/wing-night/pull/58)
  - Notes: manual host/display smoke run completed (sync + refresh rehydrate across team turns)
  - Merge timestamp: `2026-02-18T03:54:53Z`
- [x] 8.11 Active-Team Eating + Scoring Gating
  - Branch: `(squash merged; source branch deleted)`
  - PR: [#52](https://github.com/BradleyExton/wing-night/pull/52)
  - Merge timestamp: `2026-02-18T02:57:16Z`
- [x] 8.9 Host Timer Controls (Pause/Extend)
  - Branch: `(squash merged; source branch deleted)`
  - PR: [#49](https://github.com/BradleyExton/wing-night/pull/49)
  - Merge timestamp: `2026-02-18T02:55:36Z`
- [x] D2 README Architecture Alignment
  - Branch: `phase-d2-readme-architecture-alignment`
  - PR: [#51](https://github.com/BradleyExton/wing-night/pull/51)
  - Merge timestamp: `2026-02-18T02:50:44Z`
- [x] 8.10 Team-Turn State Machine Realignment
  - Branch: `phase-8-10-team-turn-state-machine-realignment`
  - PR: [#50](https://github.com/BradleyExton/wing-night/pull/50)
  - Merge timestamp: `2026-02-18T02:47:08Z`
- [x] D1 SPEC Architecture Alignment
  - Branch: `phase-d1-spec-architecture-alignment`
  - PR: [#48](https://github.com/BradleyExton/wing-night/pull/48)
  - Merge timestamp: `2026-02-18T02:47:05Z`
- [x] R2 Display UI Decomposition Pass
  - Branch: `phase-r2-display-ui-decomposition-pass`
  - PR: [#40](https://github.com/BradleyExton/wing-night/pull/40)
  - Merge timestamp: `2026-02-18T02:45:17Z`
- [x] 8.8 Timer `endsAt` Contract Reconciliation
  - Branch: `phase-8-8-timer-endsat-contract-reconciliation`
  - PR: [#38](https://github.com/BradleyExton/wing-night/pull/38)
  - Merge timestamp: `2026-02-18T02:40:59Z`
- [x] 8.7 Host/Display Minigame Surface Shell
  - Branch: `phase-8-7-host-display-minigame-surface-shell`
  - PR: [#35](https://github.com/BradleyExton/wing-night/pull/35)
  - Merge timestamp: `2026-02-18T02:32:59Z`
- [x] Phase 8 + Docs stacked execution (A/B/C wave kickoff tracker)
  - Branch: `docs-tracker-phase8-batch-start`
  - PR: [#34](https://github.com/BradleyExton/wing-night/pull/34)
  - Merge timestamp: `2026-02-18T02:32:52Z`
- [x] R1 Host UI Decomposition Pass
  - Branch: `phase-r1-host-ui-decomposition-pass`
  - PR: [#33](https://github.com/BradleyExton/wing-night/pull/33)
  - Merge timestamp: `2026-02-18T00:46:00Z`
- [x] 8.6 Trivia Migration to Module Boundary
  - Branch: `phase-8-6-trivia-migration-module-boundary`
  - PR: [#32](https://github.com/BradleyExton/wing-night/pull/32)
  - Merge timestamp: `2026-02-18T00:10:06Z`
- [x] 8.5 Minigame Module Boundary (Architecture)
  - Branch: `phase-8-5-minigame-module-boundary`
  - PR: [#31](https://github.com/BradleyExton/wing-night/pull/31)
  - Merge timestamp: `2026-02-17T23:43:53Z`
- [x] 8.4 Host Compact Phase Views (Non-Game)
  - Branch: `phase-8-4-host-compact-phase-views`
  - PR: [#29](https://github.com/BradleyExton/wing-night/pull/29)
  - Merge timestamp: `2026-02-17T20:36:10Z`
- [x] 8.3 Host Phase-Focused Layout (Non-Game)
  - Branch: `phase-8-3-host-phase-focused-layout`
  - PR: [#28](https://github.com/BradleyExton/wing-night/pull/28)
  - Merge timestamp: `2026-02-17T20:35:14Z`
- [x] 8.2 Display Countdown Render
  - Branch: `phase-8-2-display-countdown-render`
  - PR: [#25](https://github.com/BradleyExton/wing-night/pull/25)
  - Merge timestamp: `2026-02-17T18:31:25Z`
- [x] 8.1 Server-Based Timer
  - Branch: `phase-8-1-server-based-timer`
  - PR: [#24](https://github.com/BradleyExton/wing-night/pull/24)
  - Merge timestamp: `2026-02-17T18:31:11Z`
- [x] 7.3 PASS_AND_PLAY Mode
  - Branch: `phase-7-3-pass-and-play-mode`
  - PR: [#23](https://github.com/BradleyExton/wing-night/pull/23)
  - Merge timestamp: `2026-02-17T18:31:01Z`
- [x] 7.2 Turn-Based Trivia Logic
  - Branch: `phase-7-2-turn-based-trivia-logic`
  - PR: [#26](https://github.com/BradleyExton/wing-night/pull/26)
  - Notes: replacement PR after #22 was closed during stack restack
  - Merge timestamp: `2026-02-17T18:30:44Z`
- [x] 7.1 Trivia Content Loader
  - Branch: `phase-7-1-trivia-content-loader`
  - PR: [#21](https://github.com/BradleyExton/wing-night/pull/21)
  - Merge timestamp: `2026-02-17T18:27:28Z`
- [x] 6.2 Apply Points in ROUND_RESULTS
  - Branch: `phase-6-2-apply-points-round-results`
  - PR: [#19](https://github.com/BradleyExton/wing-night/pull/19)
  - Merge timestamp: `2026-02-17T04:46:34Z`
- [x] 6.1 Wing Participation Recording
  - Branch: `phase-6-1-wing-participation-recording`
  - PR: [#18](https://github.com/BradleyExton/wing-night/pull/18)
  - Merge timestamp: `2026-02-17T04:45:55Z`
- [x] 5.2 Round Scheduling
  - Branch: `phase-5-2-round-scheduling`
  - PR: [#20](https://github.com/BradleyExton/wing-night/pull/20)
  - Merge timestamp: `2026-02-17T04:45:18Z`
- [x] 5.1 Load gameConfig
  - Branch: `phase-5-1-load-game-config`
  - PR: [#16](https://github.com/BradleyExton/wing-night/pull/16)
  - Merge timestamp: `2026-02-17T04:43:05Z`
- [x] 4.3 Lock Teams on Start
  - Branch: `phase-4-3-lock-teams-on-start`
  - PR: [#15](https://github.com/BradleyExton/wing-night/pull/15)
  - Merge timestamp: `2026-02-17T02:54:28Z`
- [x] 4.2 Team Creation UI
  - Branch: `phase-4-2-team-creation-ui`
  - PR: [#14](https://github.com/BradleyExton/wing-night/pull/14)
  - Merge timestamp: `2026-02-17T02:55:34Z`
- [x] 4.1 Content Loader
  - Branch: `phase-4-1-content-loader`
  - PR: [#13](https://github.com/BradleyExton/wing-night/pull/13)
  - Merge timestamp: `2026-02-17T02:56:18Z`
- [x] 3.2 Host Next Phase Button
  - Branch: `phase-3-2-host-next-phase-button`
  - PR: [#11](https://github.com/BradleyExton/wing-night/pull/11)
  - Notes: synced into `main` via `phase-3-mainline-sync`
- [x] 3.1 Phase Transition Logic
  - Branch: `phase-3-1-phase-transition-logic`
  - PR: [#10](https://github.com/BradleyExton/wing-night/pull/10)
  - Notes: synced into `main` via `phase-3-mainline-sync`
- [x] 2.3 Host Mutation Protection
  - Branch: `phase-2-3-host-mutation-protection`
  - PR: [#9](https://github.com/BradleyExton/wing-night/pull/9)
  - Merge commit: `fe0d0df`
- [x] Realtime foundation bundle (`1.3`, `2.1`, `2.2`)
  - Branch: `phase-realtime-foundation-1-3-2-1-2-2`
  - PR: [#8](https://github.com/BradleyExton/wing-night/pull/8)
  - Merge commit: `2a21f5d`
- [x] 0.5 CI PR Checks (GitHub Actions)
  - Branch: `phase-0-5-ci-pr-checks`
  - PR: [#7](https://github.com/BradleyExton/wing-night/pull/7)
  - Merge commit: `105eb8f`
- [x] 1.2 Define Socket Event Contracts
  - Branch: `phase-1-2-socket-contracts`
  - PR: [#5](https://github.com/BradleyExton/wing-night/pull/5)
  - Merge commit: `3f3e5ac`
- [x] 1.1 Define Core Types
  - Branch: `phase-1-1-core-types`
  - PR: [#4](https://github.com/BradleyExton/wing-night/pull/4)
  - Merge commit: `5a40199`
- [x] 0.3 Basic Client
  - Branch: `phase-0-3-basic-client`
  - PR: [#3](https://github.com/BradleyExton/wing-night/pull/3)
  - Merge commit: `cf1e70d`
- [x] 0.2 Basic Server
  - Branch: `phase-0-2-basic-server`
  - PR: [#2](https://github.com/BradleyExton/wing-night/pull/2)
  - Merge commit: `ba8d94d`
- [x] 0.1 Initialize Monorepo
  - Branch: `phase-0-1-monorepo-init`
  - PR: [#1](https://github.com/BradleyExton/wing-night/pull/1)
  - Merge commit: `26615d9`

Backlog status:
- [x] R4.1 Epic Spec + Tracker Wiring
- [x] R4.2 Client Host-Secret Request Helper
- [x] R4.3 Server Authorized Mutation Gate Helper
- [x] R4.4 Server Broadcast Wrapper
- [x] R4.5 Content Loader Base Utility
- [x] R4.6 Copy Simplification
- [x] R4.7 Countdown Math + Dead Style Cleanup
- [x] R4.8 Epic Hardening + Final Regression Gate
- [x] 0.2 Basic Server
- [x] 0.3 Basic Client
- [x] 0.5 CI PR Checks (GitHub Actions)
- [x] 1.1 Define Core Types
- [x] 1.2 Define Socket Event Contracts
- [x] 1.3 In-Memory RoomState
- [x] 2.1 Socket Connection
- [x] 2.2 Rehydrate on Refresh
- [x] 2.3 Host Mutation Protection
- [x] 3.1 Phase Transition Logic
- [x] 3.2 Host Next Phase Button
- [x] 4.1 Content Loader
- [x] 4.2 Team Creation UI
- [x] 4.3 Lock Teams on Start
- [x] 5.1 Load gameConfig
- [x] 5.2 Round Scheduling
- [x] 6.1 Wing Participation Recording
- [x] 6.2 Apply Points in ROUND_RESULTS
- [x] 7.1 Trivia Content Loader
- [x] 7.2 Turn-Based Trivia Logic
- [x] 7.3 PASS_AND_PLAY Mode
- [x] 8.1 Server-Based Timer
- [x] 8.2 Display Countdown Render
- [x] 8.3 Host Phase-Focused Layout (Non-Game)
- [x] 8.4 Host Compact Phase Views (Non-Game)
- [x] 8.5 Minigame Module Boundary (Architecture)
- [x] 8.6 Trivia Migration to Module Boundary
- [x] R1 Host UI Decomposition Pass (`HostPlaceholder` phase-surface extraction + remove `Placeholder` naming)
- [x] 8.7 Host/Display Minigame Surface Shell
- [x] 8.10 Team-Turn State Machine Realignment
- [x] 8.11 Active-Team Eating + Scoring Gating
- [x] 8.8 Timer `endsAt` Contract Reconciliation
- [x] 8.9 Host Timer Controls (Pause/Extend)
- [x] R2 Display UI Decomposition Pass (`DisplayPlaceholder` stage/standings extraction + remove `Placeholder` naming)
- [x] 8.12 Host/Display Team-Turn Surfaces
- [x] D1 SPEC Architecture Alignment (after 8.7)
- [x] D2 README Architecture Alignment (after 8.7)
- [x] D5 SPEC Team-Turn Flow Alignment (after 8.12)
- [x] D6 README Team-Turn Flow Alignment (after 8.12)
- [x] D3 AGENTS Guardrail Update (after boundary stabilizes)
- [x] D4 DESIGN Surface Rule Update (only if host/display rules materially change)
- [ ] 9.1 Playwright Host/Display Sync
- [ ] 9.2 Playwright Refresh Rehydrate
- [x] 10.1 Manual Round Escape Hatch
- [x] 10.2 Score Override UI
- [x] 10.3 Game Reset Flow
- [x] 10.4 Basic Error Screen for Invalid Content
- [x] 10.5 Redo Escape Hatch (Host)
- [x] 10.6 Host Turn Order Reorder
- [ ] 11.1 Role-Scoped Snapshot Contract (Host vs Display)
- [ ] 11.2 Generic Minigame Action Envelope + Socket Event
- [ ] 11.3 Server Minigame Runtime Orchestrator
- [ ] 11.4 Minigame Plugin Content Loader Contract
- [x] 11.5 Host Full-Screen Minigame Shell (Takeover)
- [x] 11.6 Display Full-Screen Minigame Shell (Takeover)
- [x] 11.7 Shell-Level Override Overlay During Minigame Takeover
- [x] 11.8 TRIVIA Full-Screen Plugin Migration + GEO/DRAWING Unsupported States
- [x] 11.9 Rehydrate/Recovery Hardening for Full-Screen Takeover
- [ ] 12.1 Cross-Title Game Shell Contract ADR
- [ ] 12.2 Extract Reusable Orchestrator Package Boundary (Monorepo-Local)
- [ ] 12.3 Minigame Authoring Guide + Example Scaffold
- [x] D7 SPEC Full-Screen Minigame Takeover Alignment (after 11.x)
- [ ] D8 README Plugin + Reuse Architecture Alignment (after 12.x)
- [ ] D9 AGENTS Guardrail Update for Plugin API + Snapshot Privacy

This roadmap is optimized for: - 4 hours per week - Small, verifiable
tasks - Codex execution loops - Stable incremental progress

Each task should: 1. Be small (\< 60 minutes). 2. Have a clear output
artifact. 3. Include verification steps. 4. End in a working state.

UI task addendum (required for new client UI tasks):
- Include a component decomposition note in the task output (parent + subcomponents created/updated).
- Avoid expanding over-cap component files; extract first, then add new UI behavior.
- Prefer phase-surface subcomponents for host/display views (`Setup`, `Eating`, `RoundResults`, etc.).
- When touching placeholder-era components, rename them to stable production names (remove `Placeholder` suffix).

------------------------------------------------------------------------

# Phase 0 --- Repo Setup (Week 1)

## 0.1 Initialize Monorepo

-   Create pnpm workspace
-   apps/client
-   apps/server
-   packages/shared
-   Add base tsconfig setup Verification:
-   pnpm install runs successfully
-   pnpm dev starts both client and server

## 0.2 Basic Server

-   Express server running
-   Health route `/health` Verification:
-   GET /health returns 200

## 0.3 Basic Client

-   Vite React app
-   Routes:
    -   /host
    -   /display Verification:
-   Both routes render basic placeholder text

## 0.5 CI PR Checks (GitHub Actions)

-   Add GitHub Actions workflow for pull requests to `main`
-   Use Node 22 + pnpm frozen lockfile install
-   Run lint, tests, typecheck, and build in a single deterministic job
-   Configure concurrency cancellation for repeated pushes to the same PR
Verification:
-   Open PR to `main` and confirm `PR Checks / verify` runs
-   Confirm commands: `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm build`

------------------------------------------------------------------------

# Phase 1 --- Shared Contracts & State Core

## 1.1 Define Core Types (packages/shared)

-   Phase enum
-   RoomState type
-   Team type
-   Player type Verification:
-   pnpm test passes (type-only test)

## 1.2 Define Socket Event Contracts

-   client:requestState
-   server:stateSnapshot
-   game:nextPhase Verification:
-   Types compile across client and server

## 1.3 In-Memory RoomState (Server)

-   Single global state
-   Default = SETUP phase Verification:
-   Server boots without crash

------------------------------------------------------------------------

# Phase 2 --- Host / Display Sync

## 2.1 Socket Connection

-   Connect client to server
-   Server emits state snapshot on connect Verification:
-   Display logs snapshot on load

## 2.2 Rehydrate on Refresh

-   On reconnect, server re-sends full state Verification:
-   Refresh display → state persists

## 2.3 Host Mutation Protection

-   Implement hostSecret
-   Require secret on mutation events Verification:
-   Display cannot trigger game:nextPhase

------------------------------------------------------------------------

# Phase 3 --- Phase Machine

## 3.1 Phase Transition Logic

-   Implement reducer-like transition function
-   Only host triggers next phase Verification:
-   Unit tests for valid transitions

## 3.2 Host "Next Phase" Button

-   Button visible only on host
-   Triggers game:nextPhase Verification:
-   Display updates when host clicks

------------------------------------------------------------------------

# Phase 4 --- Players + Teams (Setup)

## 4.1 Content Loader

-   Load players.json
-   Local → sample fallback
-   Validation Verification:
-   Invalid JSON blocks start

## 4.2 Team Creation UI

-   Create team
-   Assign players Verification:
-   Teams stored in server state

## 4.3 Lock Teams on Start

-   Prevent team size changes after INTRO Verification:
-   Attempted edit after start fails

------------------------------------------------------------------------

# Phase 5 --- GameConfig Integration

## 5.1 Load gameConfig.json

-   Validate schema
-   Store in server state Verification:
-   Missing config blocks start

## 5.2 Round Scheduling

-   Round counter
-   Read minigame from config Verification:
-   ROUND_INTRO shows correct sauce + minigame

------------------------------------------------------------------------

# Phase 6 --- Scoring Engine

## 6.1 Wing Participation Recording

-   Per-player checkbox
-   Compute wingPointsThisRound Verification:
-   Unit tests for scoring math

## 6.2 Apply Points in ROUND_RESULTS

-   Combine wing + minigame points Verification:
-   Totals update correctly

------------------------------------------------------------------------

# Phase 7 --- First Mini-Game (Trivia)

## 7.1 Trivia Content Loader

-   Load trivia.json
-   Validate format Verification:
-   Invalid trivia blocks start

## 7.2 Turn-Based Trivia Logic

-   One team at a time
-   Host marks correct/incorrect Verification:
-   Points assigned correctly

## 7.3 PASS_AND_PLAY Mode

-   Hide host controls
-   Press-and-hold unlock Verification:
-   Host controls hidden during turn

------------------------------------------------------------------------

# Phase 8 --- Timers

## 8.1 Server-Based Timer

-   endsAt timestamp
-   Server authoritative Verification:
-   Unit tests for timer math

## 8.2 Display Countdown Render

-   Client calculates remaining time from endsAt Verification:
-   Refresh maintains correct time

------------------------------------------------------------------------

# Phase 8B --- Host UI Focus (Non-Game)

## 8.3 Host Phase-Focused Layout (Non-Game)

-   SETUP shows team setup + player assignment UI only
-   EATING shows wing participation UI only (+ phase controls)
-   MINIGAME phases keep existing trivia behavior for now (no new gameplay behavior)
-   No server state or socket contract changes in this task
Verification:
-   Host component tests assert phase-based visibility for setup and eating cards
-   Existing trivia/pass-and-play tests continue passing

## 8.4 Host Compact Phase Views (Non-Game)

-   INTRO / ROUND_INTRO / ROUND_RESULTS / FINAL_RESULTS render compact status + next action
-   Remove setup-style card clutter outside setup/eating contexts
-   Keep escape hatches and host phase controls visible where currently supported
Verification:
-   Host component tests cover compact rendering per non-game phase
-   `pnpm lint`, `pnpm typecheck`, `pnpm test`

------------------------------------------------------------------------

# Phase 8C --- Minigame Architecture

## 8.5 Minigame Module Boundary (Architecture)

-   Introduce minigame package boundary under `packages/minigames/*`
-   Define engine-facing contract for init/reduce/selectors with serializable state
-   Keep server authoritative for lifecycle, timers, and score application
-   Keep npm extraction out of scope for this phase
Verification:
-   At least one minigame can be mounted through the boundary without behavior regression
-   No client-side score/timer truth is introduced

## 8.6 Trivia Migration to Module Boundary

-   Move trivia-specific gameplay logic behind the new minigame module interface
-   Preserve existing trivia behavior, scoring rules, and pass-and-play semantics
-   Keep host/display mutation authorization flow unchanged
Verification:
-   Existing trivia tests pass with minimal fixture updates
-   Round scoring and phase transitions remain server-authoritative

## 8.7 Host/Display Minigame Surface Shell

-   Pre-req: complete `R1 Host UI Decomposition Pass` before adding new minigame host surfaces
-   Render minigame phases via dedicated host/display minigame surface modules
-   Feed minigame-specific `hostView` and `displayView` from server snapshot
-   Keep non-minigame phase layouts separate from minigame surfaces
Verification:
-   Host and display render trivia through the minigame surface shell
-   Pass-and-play privacy still prevents answer leakage to display view

------------------------------------------------------------------------

# Phase 8D --- Timer Contract Completion

## 8.8 Timer `endsAt` Contract Reconciliation

-   Add explicit server-authored timer state to shared `RoomState` (including `endsAt`)
-   Start/clear timer state on phase transitions where timing is active
-   Ensure display countdown renders from snapshot timer state, not static config seconds
Verification:
-   Unit tests cover timer lifecycle during phase transitions
-   Display countdown remains correct after refresh/reconnect

## 8.9 Host Timer Controls (Pause/Extend)

-   Add host-authorized timer mutation events for pause/resume/extend in EATING
-   Ensure server remains source of truth for remaining time
-   Keep controls host-only and deny unauthorized clients
Verification:
-   Socket handler tests verify host authorization and payload validation
-   Host component tests cover enabled/disabled timer controls by phase

------------------------------------------------------------------------

# Phase 8E --- Team-Turn Flow Realignment

## 8.10 Team-Turn State Machine Realignment

-   Add per-round active-team turn cursor and completion tracking
-   Repeat `EATING -> MINIGAME_INTRO -> MINIGAME_PLAY` per team before `ROUND_RESULTS`
-   Keep round advancement tied to final team turn completion
Verification:
-   Room-state tests cover first/middle/last team transitions and round boundary transitions

## 8.11 Active-Team Eating + Scoring Gating

-   Restrict EATING participation updates to players on the active team
-   Accumulate wing + minigame points by team turn until `ROUND_RESULTS`
-   Keep server authoritative and escape-hatch compatible for skip/redo/override follow-ups
Verification:
-   Unit tests reject non-active-team mutations
-   Unit tests verify full-round score totals across all team turns

## 8.12 Host/Display Team-Turn Surfaces

-   Pre-req: complete `R2 Display UI Decomposition Pass` before expanding display team-turn surfaces
-   Render active team context in EATING and MINIGAME phases on host and display
-   Render active-team context only (team name; no turn-progress label)
-   Preserve reconnect rehydrate correctness for active team turn context
Verification:
-   Host/display component tests cover active-team context rendering
-   `pnpm playwright test` covers host/display sync across team-turn transitions

------------------------------------------------------------------------

# Docs Alignment Follow-Ups

## D1 SPEC Architecture Alignment (after 8.7)

-   Update `SPEC.md` to reflect minigame module boundary and host/display view model split
-   Trigger: first architecture + minigame surface PR (`8.7`) merged

## D2 README Architecture Alignment (after 8.7)

-   Update `README.md` monorepo structure and architecture section for minigame modules
-   Trigger: first architecture + minigame surface PR (`8.7`) merged

## D3 AGENTS Guardrail Update (after boundary stabilizes)

-   Add explicit implementation guardrails for minigame package boundaries and contracts
-   Trigger: architecture boundary is accepted as a stable repo rule

## D4 DESIGN Surface Rule Update (only if host/display rules materially change)

-   Update `DESIGN.md` only when host/display surface rules diverge from current guidance
-   Trigger: minigame surface UI rules require new canonical design constraints

## D5 SPEC Team-Turn Flow Alignment (after 8.12)

-   Update `SPEC.md` round flow and phase definitions to match per-team turn execution (`EATING -> MINIGAME_INTRO -> MINIGAME_PLAY` per team)
-   Trigger: team-turn flow tasks (`8.10`, `8.11`, `8.12`) merged

## D6 README Team-Turn Flow Alignment (after 8.12)

-   Update `README.md` architecture/flow summary to match implemented team-turn round execution
-   Trigger: team-turn flow tasks (`8.10`, `8.11`, `8.12`) merged

------------------------------------------------------------------------

# Phase 9 --- E2E Milestone

## 9.1 Playwright: Host/Display Sync

-   Load host + display
-   Advance phase
-   Verify display updates

## 9.2 Playwright: Refresh Rehydrate

-   Refresh display mid-game
-   Verify state consistency

------------------------------------------------------------------------

# Phase 10 --- Polish

## 10.1 Manual Round Escape Hatch

-   Host can skip forward to the next safe phase/round boundary
-   Preserve score consistency when skipping
Verification:
-   Phase transition tests include skip-path assertions without score corruption

## 10.2 Score Override UI

-   Host can set explicit per-team score adjustments
-   Adjustments are logged and reflected immediately in snapshots
Verification:
-   Room state tests cover override validation and cumulative totals
-   Host tests verify override controls are host-only

## 10.3 Game Reset Flow

-   Host can reset the game to SETUP from an in-progress game
-   Reset clears phase/round/minigame/transient scoring state safely
Verification:
-   Room reset tests cover mid-round and final-results reset paths

## 10.4 Basic Error Screen for Invalid Content

-   Client renders a clear fatal-state screen when server content boot fails
-   Include actionable next-step guidance for host/operator
Verification:
-   Client component tests cover fatal error rendering states

## 10.5 Redo Escape Hatch (Host)

-   Host can redo the last minigame/round scoring action when correction is needed
-   Redo is bounded to prevent corrupting unrelated earlier rounds
Verification:
-   Room state tests verify redo behavior and guardrails
-   Host controls only show redo where action history allows it

## 10.6 Host Turn Order Reorder

-   Host can reorder team turn order during `ROUND_INTRO`
-   Reordered turn order carries forward until changed again
Verification:
-   Room state tests verify reorder validation and cross-round persistence
-   Host tests verify reorder controls render only in `ROUND_INTRO`

------------------------------------------------------------------------

# Phase 11 --- Full-Screen Minigame Platformization

## 11.1 Role-Scoped Snapshot Contract (Host vs Display)

-   Split server snapshot projection into host-safe and display-safe payloads keyed by client role
-   Display snapshots must never include host-only answer/secret fields
-   Preserve reconnect rehydrate behavior for both `/host` and `/display` using full role-scoped snapshots
-   Define explicit behavior when transport recovery is unavailable (`socket.recovered === false`): request/emit full role-scoped snapshot immediately
Verification:
-   Socket server tests assert role-scoped snapshot payload shape
-   Tests assert display snapshots exclude answer-bearing fields
-   Rehydrate tests cover recovered and non-recovered reconnect paths

## 11.2 Generic Minigame Action Envelope + Socket Event

-   Replace trivia-only mutation event path with a generic minigame action envelope (`minigameId`, `actionType`, `actionPayload`)
-   Validate that incoming action envelopes match the currently active minigame turn
-   Keep host authorization requirements unchanged
-   Add minigame contract metadata (`minigameApiVersion`, capability flags) so shell and plugins can negotiate compatibility safely
Verification:
-   Socket validation tests reject malformed, unauthorized, and wrong-minigame actions
-   Trivia scoring path remains green through generic action dispatch
-   Version/capability mismatch paths fail safely with clear host-facing fallback messaging

## 11.3 Server Minigame Runtime Orchestrator

-   Introduce a registry-driven runtime adapter for init/reduce/select/project/clear operations
-   Remove direct trivia runtime coupling from room-state phase transition flow
-   Keep room engine authoritative for phase lifecycle, timers, and score application timing
-   Isolate plugin runtime failures so a minigame exception cannot crash the room process
Verification:
-   Room-state transition/scoring tests remain green
-   Unknown minigame IDs fail safely (no crash, clear fallback behavior)
-   Runtime failure path degrades to safe shell state + log entry without data corruption

## 11.4 Minigame Plugin Content Loader Contract

-   Move from hardcoded `loadTrivia` boot behavior to minigame-declared content loader hooks
-   Each minigame declares required content files and validation logic
-   Boot fails fast with clear error messaging when active minigame content is invalid/missing
Verification:
-   Content-loader tests cover local -> sample fallback under plugin loader flow
-   Invalid minigame content blocks start with explicit error context

## 11.5 Host Full-Screen Minigame Shell (Takeover)

-   During `MINIGAME_INTRO` and `MINIGAME_PLAY`, host route renders a full-screen minigame shell instead of in-panel minigame cards
-   Keep global phase controls available where contract allows
-   Preserve tablet/mobile ergonomics without vertical-scroll regressions
Verification:
-   Host component tests assert full-screen takeover in minigame phases
-   Non-minigame phases still render existing host panel structure

## 11.6 Display Full-Screen Minigame Shell (Takeover)

-   During `MINIGAME_INTRO` and `MINIGAME_PLAY`, display route renders full-screen minigame surfaces from `minigameDisplayView`
-   Remove display dependence on host-only/legacy trivia fields
-   Provide a stable fallback surface for unsupported minigames
Verification:
-   Display component tests assert takeover rendering and unsupported fallback behavior
-   Display tests assert no answer/secret field dependency

## 11.7 Shell-Level Override Overlay During Minigame Takeover

-   Move override trigger/panel ownership to shell-level so overrides stay reachable over full-screen minigame surfaces
-   Preserve existing skip/redo/manual-score escape hatches
-   Keep PASS_AND_PLAY lock behavior intact (overlay must not bypass host unlock constraints)
Verification:
-   Host tests cover override visibility and action reachability during minigame takeover
-   Playwright path proves override actions remain reachable without host/display sync drift

## 11.8 TRIVIA Full-Screen Plugin Migration + GEO/DRAWING Unsupported States

-   Migrate trivia host/display rendering into minigame plugin renderer modules
-   Register trivia plugin on both server and client minigame registries
-   Add explicit unsupported-state surfaces for `GEO` and `DRAWING` until implementations exist
Verification:
-   Registry tests cover TRIVIA happy path and GEO/DRAWING fallback path
-   Existing trivia gameplay/scoring tests remain green

## 11.9 Rehydrate/Recovery Hardening for Full-Screen Takeover

-   Validate reconnect/refresh behavior mid `MINIGAME_INTRO` and mid `MINIGAME_PLAY`
-   Ensure active team context, timer state, and pending score projections survive rehydrate
-   Ensure host control claim/reclaim works while minigame takeover is active
-   Add adapter-compatibility note for connection-state recovery if transport/scaling architecture changes later
Verification:
-   Playwright coverage includes minigame-phase refresh/reconnect paths for host + display
-   No team-turn ordering regressions after recovery
-   Recovery tests assert fallback full-snapshot rehydrate when connection-state recovery is not available

------------------------------------------------------------------------

# Phase 12 --- Cross-Title Reuse (Wing Night-Like Games)

## 12.1 Cross-Title Game Shell Contract ADR

-   Define boundary between reusable party-game orchestration and wing-night-specific gameplay logic
-   Document package targets, ownership, and migration sequence
-   Keep explicit non-goals for this phase (no persistence/network architecture changes)
-   Define compatibility/versioning policy between shell and minigame plugins
Verification:
-   ADR accepted with target module map and phased migration checkpoints
-   ADR includes compatibility matrix and deprecation policy for plugin contract changes

## 12.2 Extract Reusable Orchestrator Package Boundary (Monorepo-Local)

-   Move generic orchestration helpers into a monorepo-local reusable package boundary
-   Keep wing-night-specific scoring/phase adapters inside app/server modules
-   Preserve behavior while changing dependency direction
Verification:
-   `pnpm test` and `pnpm typecheck` pass after extraction
-   Socket contract behavior and room-state invariants remain unchanged

## 12.3 Minigame Authoring Guide + Example Scaffold

-   Add a minigame authoring guide for module contract, server adapter, client renderer, and test expectations
-   Include security checklist for host-only vs display-safe payload boundaries
-   Add scaffold/template for the next minigame (GEO) using plugin architecture contracts
Verification:
-   Scaffold compiles and typechecks
-   Docs and scaffold referenced from `README.md`

------------------------------------------------------------------------

# Docs Alignment Follow-Ups (Post 11/12)

## D7 SPEC Full-Screen Minigame Takeover Alignment (after 11.x)

-   Update `SPEC.md` host/display minigame sections for full-screen takeover architecture
-   Clarify role-scoped snapshot behavior and minigame action envelope contract

## D8 README Plugin + Reuse Architecture Alignment (after 12.x)

-   Update `README.md` architecture + monorepo sections for plugin-based minigame runtime and cross-title reuse boundary
-   Document new minigame authoring flow

## D9 AGENTS Guardrail Update for Plugin API + Snapshot Privacy

-   Add guardrails for generic minigame event envelopes, role-scoped snapshots, and full-screen takeover shell rules
-   Require regression tests for display-safe payload guarantees

------------------------------------------------------------------------

# Definition of MVP Complete

-   Full multi-round game runs without restart
-   Display rehydrates after refresh
-   Host retains control after refresh
-   Wing points tracked per player
-   Mini-game schedule follows config
-   Game resets cleanly
-   All unit tests pass
-   E2E tests pass

------------------------------------------------------------------------

# Execution Rhythm

Each week (4 hours): - 3--5 small tasks - Commit after each task - Never
leave repo broken - Prefer progress over perfection

------------------------------------------------------------------------

Build for stability. Optimize for party night reliability.
