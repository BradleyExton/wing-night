# TASKS.md

Wing Night -- Codex-First Build Plan

This roadmap is optimized for: - 4 hours per week - Small, verifiable
tasks - Codex execution loops - Stable incremental progress

Each task should: 1. Be small (\< 60 minutes). 2. Have a clear output
artifact. 3. Include verification steps. 4. End in a working state.

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

## 10.2 Score Override UI

## 10.3 Game Reset Flow

## 10.4 Basic Error Screen for Invalid Content

------------------------------------------------------------------------

# Definition of MVP Complete

-   Full 8-round game runs without restart
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
