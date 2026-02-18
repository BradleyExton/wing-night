# AGENTS.md

This document defines engineering standards and guardrails for Wing Night.

Codex and contributors must follow these rules when generating or modifying code.

If a change violates these constraints, it should be refactored before merging.

---

# 1) Codex-First Workflow (Required)

Codex should optimize for small, verifiable changes.

## 1.1 Task Execution Loop
For each task:
1. Read the relevant sections of `SPEC.md`.
2. Make the smallest change that satisfies the task.
3. Add/update tests as required.
4. Run the appropriate verification commands.
5. Ensure the change is modular and follows repo conventions.

## 1.2 Checkpoints
Before starting a task, create a clean checkpoint (git commit or stash).  
After completing a task, ensure the repo is in a working state and tests pass.

## 1.3 Verification Commands (Default)
- Unit/component tests: `pnpm test`
- E2E tests: `pnpm playwright test`
- Typecheck (if present): `pnpm typecheck`
- Lint (if present): `pnpm lint`

Run:
- `pnpm test` for any shared/game-logic changes.
- `pnpm playwright test` only for milestone tasks affecting host/display sync, routing, or reconnect behavior.

---

# 2) Architecture Principles

- Server is authoritative for all game state.
- Clients render state and request mutations only.
- No client-side derived game logic that can diverge from server truth.
- Realtime sync via Socket.IO.
- Clients must rehydrate from full state snapshot on connect/reconnect.
- In-memory state only (MVP).

---

# 3) Monorepo Structure

- Project uses pnpm workspace monorepo.
- Shared contracts and validation live in `packages/shared`.
- Client and server must import types from `packages/shared`.
- Do not duplicate state types in client or server.

## 3.1 Minigame Boundary Rules

- Minigame engine contracts live in `packages/minigames/core`.
- Concrete minigames live in subdirectories of `packages/minigames` other than `core` (for example `packages/minigames/<minigameId>`) and must be framework-agnostic.
- Server adapters/projections for minigames live under `apps/server/src/minigames/**`.
- Display-facing minigame view contracts (for example `selectDisplayView`) must never include answer/secret fields; only host views may include privileged fields. Do not add answer fields to shared snapshot display-view contracts until host-only filtering or secret channels are implemented.

## 3.2 Minigame Projection Guardrails

- Server-owned projections are the only source for `minigameHostView` and `minigameDisplayView` snapshot fields; clients must not assemble or derive these view models.
- Host-only answer/secret payloads must stay in server runtime state and host projections only; never copy privileged fields into display-facing snapshot contracts.
- Any minigame projection change must include tests asserting display-safe payloads remain answer-free.

---

# 4) Component & Utility Structure

- Components and utilities must be small and focused.
- Each component/util lives in its own descriptive folder.
- Use `index.tsx` for components.
- Use `index.ts` for utilities.
- Tests live alongside implementation as `index.test.ts` or `index.test.tsx`.
- Styles must be in `styles.ts` and imported into components.
- Component entry files must import styles via namespace: `import * as styles from "./styles"`.
- Export semantic style keys from `styles.ts` (for example `container`, `heading`, `card`), not `*ClassName`-suffixed names.
- If a util is only used by one component, it may live inside that component’s folder.
- Subcomponents follow the same modular structure.

Everything must remain modular and composable.

## 4.1 UI Decomposition Guardrails (Required)

- `index.tsx` files under `apps/client/src/components/**` should stay under ~220 lines; hard cap is 260 lines unless explicitly allowlisted in lint config.
- `styles.ts` files under `apps/client/src/components/**` should stay under 140 lines.
- If a component renders phase-specific surfaces (for example setup/eating/results), each phase surface should be extracted to a subcomponent once the parent file approaches the cap.
- New UI tasks must not add another major section into an already over-cap component without an accompanying extraction.
- When touching a large component, leave it more modular than you found it (extract at least one coherent subcomponent when practical).

PR expectation for UI changes:
- Include a short "Component map" in the PR description listing parent component + extracted subcomponents.
- Add/adjust tests at the extracted component boundary (not only at the monolithic parent).

---

# 5) Naming Conventions

- Components: PascalCase
- Hooks: useSomething
- Utilities: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Socket events: domain:action (example: game:nextPhase)

Prefer `type` over `interface` unless declaration merging is required.

---

# 6) State Rules

- Single source of truth: server RoomState.
- Client stores only snapshot + local UI state.
- No recalculating scores client-side.
- No hidden derived state.

## 6.1 Team-Turn Contract

- Round execution is per-team: `EATING -> MINIGAME_INTRO -> MINIGAME_PLAY` repeats for each team before `ROUND_RESULTS`.
- `RoomState` team-turn fields (`turnOrderTeamIds`, `roundTurnCursor`, `activeRoundTeamId`, `completedRoundTurnTeamIds`, `activeTurnTeamId`) are server-authored snapshot contract fields. `activeTurnTeamId` is minigame turn state used by minigame UI surfaces and must never be client-authored.
- EATING participation and minigame score mutations must be accepted for the active team only.
- Round points are accumulated across team turns and applied once when entering `ROUND_RESULTS`.

---

# 7) Timers

- Timers must live on server.
- Timer state must include `endsAt` timestamp.
- Client renders countdown but does not control timer truth.

---

# 8) Content Packs

- Content loads via a single contentLoader module.
- Loading order: `content/local/` → `content/sample/`.
- All content must be validated before game start.
- Invalid content blocks start with clear error.
- Never scatter direct JSON loads across components.

---

# 9) Testing Standards

Unit Tests (Vitest):
- Scoring logic
- Game state transitions
- Content validation
- Config parsing

E2E Tests (Playwright):
- Host ↔ Display sync
- Phase transitions
- Refresh rehydrate behavior

Avoid flaky timing-based tests.
Mock timers where possible.

---

# 10) Error Handling

- Use centralized logger utility.
- Log phase transitions and score mutations on server.
- Display must never crash on recoverable errors.
- Fatal content errors should block game start clearly.

---

# 11) Escape Hatch Rule

For any new feature or mini-game:
- Host must be able to skip.
- Host must be able to redo.
- Host must be able to manually override score.

Never remove escape hatches.

---

# 12) TypeScript Rules

- `strict: true`
- No `any` (use `unknown` + validation).
- Use `satisfies` for config objects.
- Shared schemas live in `packages/shared`.

---

# 13) Dependency Discipline

- No new dependency without justification.
- Prefer standard library and small utilities.
- If adding dependency, document reason in PR.

---

# 14) Code Philosophy

- Keep functions pure where possible.
- Prefer small, testable units.
- Avoid deep nesting and large files.
- Optimize for clarity over cleverness.
- Avoid premature abstraction.
- Build for party reliability first.

---

# 15) UI Copy Rules

- Do not hardcode user-facing copy directly inside components.
- For component-specific text, colocate copy in the component folder as `copy.ts`.
- For shared text, use typed feature modules under `apps/client/src/copy/` (for example `host.ts`, `display.ts`, `common.ts`).
- Components should remain presentational and consume copy values via imports.
- Structure copy modules so future i18n integration can be added without rewriting component logic.

---

# 16) UI Theme Rules

- For any client UI styling change, read `DESIGN.md` first and use its canonical semantic color tokens.
- Use Tailwind theme token classes from `apps/client/tailwind.config.ts` in component `styles.ts` files.
- Do not hardcode hex colors in `apps/client/src/components/**/styles.ts`.

---

Wing Night is optimized for real-world playtesting.

Stability > cleverness.  
Clarity > complexity.  
Fun > perfection.
