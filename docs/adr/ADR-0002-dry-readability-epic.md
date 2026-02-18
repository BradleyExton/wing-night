# ADR-0002: DRY Readability Epic (R4)

Status: Accepted
Date: 2026-02-18

## Context

Wing Night has stabilized core gameplay, host/display sync, and minigame boundaries. The codebase now includes repeated patterns across client request utilities, socket authorization handlers, server broadcast plumbing, and content loading shells.

Not all duplication should be removed. This epic targets duplication that is semantically identical and repeated frequently enough to create maintenance risk, while preserving explicit phase/minigame UI surfaces and avoiding configuration-heavy abstractions.

## Decision

Implement one DRY/readability epic as stacked PR slices (`R4.1` to `R4.8`) with the following boundaries:

1. De-duplicate host-secret-gated client request flow through one internal helper.
2. De-duplicate server socket authorization gate flow through one internal helper.
3. De-duplicate server snapshot broadcast plumbing through one local wrapper.
4. De-duplicate content loader fallback/read plumbing with a shared loader shell.
5. Simplify copy pass-through aliases and centralize shared formatters.
6. De-duplicate countdown math and remove dead duplicate style exports.

## Guardrails

1. Only abstract logic repeated in at least three call sites with identical semantics.
2. Do not introduce behavior-switch props or multi-flag configuration objects.
3. Keep phase-specific UI surfaces explicit when behavior diverges.
4. Keep shared contracts and room-state behavior unchanged.
5. Keep external function signatures stable unless explicitly noted.

## Non-Goals

1. No changes to shared socket contracts or shared snapshot types.
2. No room-state phase machine behavior changes.
3. No component mergers that increase prop branching complexity.
4. No Cypress/Playwright strategy decision changes in this epic.

## Consequences

### Positive

1. Lower maintenance risk in high-churn request/auth code paths.
2. Better readability through smaller, intention-revealing helpers.
3. Reduced chance of divergent behavior across equivalent event handlers.

### Cost / Tradeoffs

1. Additional internal helpers increase indirection if overused.
2. Test updates are required to preserve behavior parity through refactors.
3. Over-abstraction risk must be managed per PR by guardrails.

## Verification Strategy

Per slice: `pnpm test`.

End-of-epic gate:

1. `pnpm test`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm playwright test`

## Rollout

Tracked in `TASKS.md` as:

1. `R4.1 Epic Spec + Tracker Wiring`
2. `R4.2 Client Host-Secret Request Helper`
3. `R4.3 Server Authorized Mutation Gate Helper`
4. `R4.4 Server Broadcast Wrapper`
5. `R4.5 Content Loader Base Utility`
6. `R4.6 Copy Simplification`
7. `R4.7 Countdown Math + Dead Style Cleanup`
8. `R4.8 Epic Hardening + Final Regression Gate`

## Implementation Outcome (2026-02-18)

Completed slices:

1. `R4.1 Epic Spec + Tracker Wiring`
2. `R4.2 Client Host-Secret Request Helper`
3. `R4.3 Server Authorized Mutation Gate Helper`
4. `R4.4 Server Broadcast Wrapper`
5. `R4.5 Content Loader Base Utility`
6. `R4.6 Copy Simplification`
7. `R4.7 Countdown Math + Dead Style Cleanup`

Verification outcomes:

1. `pnpm test`: pass
2. `pnpm lint`: pass
3. `pnpm typecheck`: pass
4. `pnpm playwright test`: blocked (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "playwright" not found`)

Residual risk:

1. End-to-end regression parity is unverified in this workspace until Playwright is wired as an executable command and tests are present/configured.
