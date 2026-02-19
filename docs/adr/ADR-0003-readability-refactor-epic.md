# ADR-0003: Readability/DRY Refactor Epic (R5)

Status: Accepted
Date: 2026-02-19

## Context

Wing Night gameplay behavior, room-state contracts, and host/display sync behavior are stable.
Most readability pressure now comes from concentrated modules:

1. `apps/server/src/roomState/index.ts`
2. `apps/server/src/socketServer/registerRoomStateHandlers/index.ts`
3. `apps/client/src/components/HostControlPanel/index.tsx`
4. Large scenario-dense server test files

The goal is to reduce maintenance risk and onboarding cost without changing observable behavior.

## Decision

Execute one readability/DRY epic as stacked slices (`R5.1` to `R5.11`):

1. Epic wiring (ADR + task tracker)
2. Room-state domain split
3. Room-state guard/mutation wrapper cleanup
4. Phase side-effect extraction
5. Socket handler registration cleanup
6. Host control panel decomposition
7. Display stage selector cleanup
8. Content loader parse/root helper cleanup
9. Server test suite decomposition
10. Server complexity guardrails
11. Final hardening/regression gate

## Guardrails

1. Keep server-authoritative game behavior unchanged.
2. Keep shared contracts and socket payload shapes unchanged.
3. Preserve minigame secrecy boundaries (`minigameDisplayView` answer-free).
4. Favor explicit, small helpers over configurable abstractions.
5. Maintain stable exported signatures for existing public entry files.

## Non-Goals

1. No phase-machine behavior changes.
2. No new game features.
3. No contract redesign across `packages/shared`.
4. No minigame protocol changes.

## Consequences

### Positive

1. Lower cognitive load in high-churn server/client orchestration code.
2. Better separation by domain (setup/scoring/timer/phase/socket wiring).
3. More focused tests that are easier to navigate.

### Cost / Tradeoffs

1. More files and indirection for internal logic.
2. Requires careful regression verification to avoid behavior drift.
3. Temporary churn while module boundaries settle.

## Verification Strategy

Per slice: run required checks for changed surfaces.

Epic hardening gate:

1. `pnpm test`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm playwright test`

## Rollout

Tracked in `TASKS.md` as:

1. `R5.1 Epic Wiring`
2. `R5.2 RoomState Domain Split`
3. `R5.3 RoomState Guard/Mutation Wrapper`
4. `R5.4 Phase Side-Effect Extraction`
5. `R5.5 Socket Handler Registration Cleanup`
6. `R5.6 HostControlPanel Decomposition`
7. `R5.7 Display Stage Selector Cleanup`
8. `R5.8 Content Loader Parse/Root Helper`
9. `R5.9 Test Suite Decomposition`
10. `R5.10 Server Complexity Guardrails`
11. `R5.11 Epic Hardening Gate`
