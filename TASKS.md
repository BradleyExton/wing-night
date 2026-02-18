# TASKS.md

Wing Night -- Codex-First Build Plan

## Execution Tracker

Status keys:
- [ ] Not started
- [-] In progress (branch/PR open)
- [x] Merged to main

Current in-progress work:
- [-] 8.6 Trivia Migration to Module Boundary
  - Branch: `phase-8-6-trivia-migration-module-boundary`

Completed:
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
- [-] 8.6 Trivia Migration to Module Boundary
- [ ] R1 Host UI Decomposition Pass (`HostPlaceholder` phase-surface extraction + remove `Placeholder` naming)
- [ ] 8.7 Host/Display Minigame Surface Shell
- [ ] 8.10 Team-Turn State Machine Realignment
- [ ] 8.11 Active-Team Eating + Scoring Gating
- [ ] 8.8 Timer `endsAt` Contract Reconciliation
- [ ] 8.9 Host Timer Controls (Pause/Extend)
- [ ] R2 Display UI Decomposition Pass (`DisplayPlaceholder` stage/standings extraction + remove `Placeholder` naming)
- [ ] 8.12 Host/Display Team-Turn Surfaces
- [ ] D1 SPEC Architecture Alignment (after 8.7)
- [ ] D2 README Architecture Alignment (after 8.7)
- [ ] D5 SPEC Team-Turn Flow Alignment (after 8.12)
- [ ] D6 README Team-Turn Flow Alignment (after 8.12)
- [ ] D3 AGENTS Guardrail Update (after boundary stabilizes)
- [ ] D4 DESIGN Surface Rule Update (only if host/display rules materially change)
- [ ] 9.1 Playwright Host/Display Sync
- [ ] 9.2 Playwright Refresh Rehydrate
- [ ] 10.1 Manual Round Escape Hatch
- [ ] 10.2 Score Override UI
- [ ] 10.3 Game Reset Flow
- [ ] 10.4 Basic Error Screen for Invalid Content
- [ ] 10.5 Redo Escape Hatch (Host)

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
-   Render round turn progress (for example, Team 2 of 4)
-   Preserve reconnect rehydrate correctness for active team turn context
Verification:
-   Host/display component tests cover active team + turn progress rendering
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
