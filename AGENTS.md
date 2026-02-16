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

---

# 4) Component & Utility Structure

- Components and utilities must be small and focused.
- Each component/util lives in its own descriptive folder.
- Use `index.tsx` for components.
- Use `index.ts` for utilities.
- Tests live alongside implementation as `index.test.ts` or `index.test.tsx`.
- Styles must be in `styles.ts` and imported into components.
- If a util is only used by one component, it may live inside that component’s folder.
- Subcomponents follow the same modular structure.

Everything must remain modular and composable.

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
- Store copy in dedicated typed modules (for example `copy/index.ts`) and import into UI layers.
- Components should remain presentational and consume copy values via imports.
- Structure copy modules so future i18n integration can be added without rewriting component logic.

---

Wing Night is optimized for real-world playtesting.

Stability > cleverness.  
Clarity > complexity.  
Fun > perfection.
