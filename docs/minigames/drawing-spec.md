# Drawing Minigame Spec (MVP)

Status: Draft for implementation

Last updated: 2026-02-23

## 1) Goals

- Ship a full `DRAWING` minigame that fits the existing Wing Night turn loop.
- Keep server authoritative for minigame state and scoring.
- Provide high-quality drawing feel on host devices.
- Keep display answer-safe during active drawing.
- Show the prompt text on display briefly after host marks correct or incorrect.

## 2) Locked Product Decisions

- Scoring: `+1` point per correct prompt.
- Multiple prompts run in a single team turn.
- Prompt count per turn is configured in `gameConfig`.
- Prompt catalog is content-driven (JSON files), not entered in-app.
- Display reveals prompt text briefly after host clicks `Correct` or `Incorrect`.

## 3) Non-Goals (MVP)

- No free-text answer checking.
- No AI judging.
- No persistent drawing history across rounds.
- No player device drawing input.

## 4) Game Flow In MINIGAME_PLAY

For the active team turn:

1. Runtime loads `promptsPerTurn` and the drawing prompt list.
2. Host sees the current prompt and canvas.
3. Host/player draws on host canvas.
4. Host clicks `Correct` or `Incorrect`.
5. Runtime briefly reveals resolved prompt text on display.
6. Runtime clears canvas and advances to next prompt.
7. Turn continues until `promptsUsedThisTurn === promptsPerTurn`.
8. At limit, drawing actions remain available (undo/clear), but result actions are disabled.
9. Host advances phase using existing phase controls.

## 5) Config And Content Contracts

## 5.1 `gameConfig.json` additions

File: `/Users/bradleyexton/.codex/worktrees/c8b1/wing-night/packages/shared/src/content/gameConfig/index.ts`

Add drawing rules:

```ts
export type DrawingMinigameRules = {
  promptsPerTurn: number; // positive integer
};

export type MinigameRules = {
  trivia?: TriviaMinigameRules;
  drawing?: DrawingMinigameRules;
};
```

Validation rules:

- `promptsPerTurn` required when `DRAWING` appears in any round.
- `promptsPerTurn` must be a positive integer.

Example `gameConfig.json`:

```json
{
  "minigameRules": {
    "trivia": { "questionsPerTurn": 1 },
    "drawing": { "promptsPerTurn": 3 }
  }
}
```

## 5.2 Drawing content file

Add shared content schema:

- `/Users/bradleyexton/.codex/worktrees/c8b1/wing-night/packages/shared/src/content/drawing/index.ts`

Add sample content:

- `/Users/bradleyexton/.codex/worktrees/c8b1/wing-night/content/sample/minigames/drawing.json`

Schema:

```ts
type DrawingPrompt = {
  id: string;
  prompt: string;
};

type DrawingContentFile = {
  prompts: DrawingPrompt[];
};
```

Validation rules:

- `prompts` required.
- At least 1 prompt.
- Each prompt must include non-empty `id` and `prompt`.
- Prompt ids must be unique.

Example:

```json
{
  "prompts": [
    { "id": "pizza", "prompt": "Pizza slice" },
    { "id": "skateboard", "prompt": "Skateboard" },
    { "id": "campfire", "prompt": "Campfire" }
  ]
}
```

## 5.3 Loader integration

File: `/Users/bradleyexton/.codex/worktrees/c8b1/wing-night/apps/server/src/contentLoader/loadMinigameContent/index.ts`

- Drawing runtime plugin declares `content.fileName = "minigames/drawing.json"`.
- Existing plugin content loading path remains unchanged.

## 6) Runtime Contract

File: `/Users/bradleyexton/.codex/worktrees/c8b1/wing-night/packages/minigames/drawing/src/runtime/index.ts`

## 6.1 State model

```ts
type DrawingPoint = {
  x: number;
  y: number;
  t: number;
};

type DrawingStroke = {
  strokeId: string;
  points: DrawingPoint[];
  color: string;
  size: number;
};

type PromptReveal = {
  promptId: string;
  promptText: string;
  outcome: "CORRECT" | "INCORRECT";
  revealedAtMs: number;
  expiresAtMs: number;
};

type DrawingRuntimeState = {
  activeTurnTeamId: string | null;
  promptCursor: number;
  promptsUsedThisTurn: number;
  promptsPerTurn: number;
  pendingPointsByTeamId: Record<string, number>;
  strokes: DrawingStroke[];
  activeStrokeId: string | null;
  reveal: PromptReveal | null;
};
```

Constants:

- `PROMPT_REVEAL_MS = 2000`
- `MAX_STROKES = 120`
- `MAX_POINTS_PER_STROKE = 2000`
- `MAX_APPEND_POINTS_PER_ACTION = 64`

## 6.2 Action types

Use existing `minigame:action` envelope with DRAWING-specific `actionType` values:

- `beginStroke`
- `appendStrokePoints`
- `endStroke`
- `undoStroke`
- `clearCanvas`
- `markCorrect`
- `markIncorrect`
- `skipPrompt`

Payload shapes:

```ts
type BeginStrokePayload = {
  strokeId: string;
  color: string;
  size: number;
  start: DrawingPoint;
};

type AppendStrokePointsPayload = {
  strokeId: string;
  points: DrawingPoint[];
};

type EndStrokePayload = {
  strokeId: string;
};
```

`undoStroke`, `clearCanvas`, `markCorrect`, `markIncorrect`, `skipPrompt` use empty object payload `{}`.

## 6.3 Reducer rules

- Ignore actions when runtime state is invalid.
- Ignore drawing mutation when turn prompt limit reached.
- `beginStroke` creates new stroke if limits allow.
- `appendStrokePoints` appends sanitized points to active stroke.
- `endStroke` clears `activeStrokeId`.
- `undoStroke` removes last stroke.
- `clearCanvas` removes all strokes and active stroke.
- `markCorrect`:
  - Increment active team pending points by 1.
  - Clamp to `pointsMax`.
  - Emit prompt reveal with `outcome = CORRECT`.
  - Advance prompt cursor and prompts used.
  - Clear canvas.
- `markIncorrect`:
  - No score change.
  - Emit prompt reveal with `outcome = INCORRECT`.
  - Advance prompt cursor and prompts used.
  - Clear canvas.
- `skipPrompt`:
  - No score change.
  - No reveal.
  - Advance prompt cursor and prompts used.
  - Clear canvas.

## 6.4 Prompt rotation

- Prompt index wraps by `content.prompts.length`.
- If prompt list is empty at runtime, reducer accepts drawing actions but blocks result actions.

## 7) Host And Display Projection

Rule source: `/Users/bradleyexton/.codex/worktrees/c8b1/wing-night/AGENTS.md`

- Server projections remain the only source for `minigameHostView` and `minigameDisplayView`.
- Display payload must remain answer-safe.

## 7.1 Contract update strategy

Current shared minigame view types are trivia-shaped.

File: `/Users/bradleyexton/.codex/worktrees/c8b1/wing-night/packages/shared/src/roomState/index.ts`

Refactor to discriminated unions by minigame type:

- `TriviaHostView | GeoHostView | DrawingHostView`
- `TriviaDisplayView | GeoDisplayView | DrawingDisplayView`

This avoids shoehorning drawing canvas/reveal fields into trivia fields.

## 7.2 Drawing host view

Host view includes:

- `minigame: "DRAWING"`
- `activeTurnTeamId`
- `promptCursor`
- `promptsUsedThisTurn`
- `promptsPerTurn`
- `currentPrompt: { id, prompt } | null`
- `pendingPointsByTeamId`
- `strokes`
- `activeStrokeId`
- `reveal`

## 7.3 Drawing display view

Display view includes:

- `minigame: "DRAWING"`
- `activeTurnTeamId`
- `promptCursor`
- `promptsUsedThisTurn`
- `promptsPerTurn`
- `pendingPointsByTeamId`
- `strokes`
- `reveal`

Display view excludes:

- Future prompt text while still active.
- Any hidden/host-only data.

Display behavior:

- If `reveal !== null` and now < `expiresAtMs`, show `reveal.promptText` with outcome badge.
- Otherwise, hide prompt text.

## 8) Client Rendering Spec

## 8.1 Host drawing quality

Use:

- Native `<canvas>`.
- Pointer Events for input capture.
- `perfect-freehand` for stroke smoothing and pressure-like feel.

Render strategy:

- Local optimistic stroke rendering for immediate feel.
- Batched network dispatch for canonical server state.
- Reconcile host view from server snapshots.

Batching rules:

- Append points at max ~15 sends/sec.
- Each `appendStrokePoints` action capped by `MAX_APPEND_POINTS_PER_ACTION`.

## 8.2 Display rendering

- Render server-projected strokes only.
- No local prediction needed.
- Maintain no-scroll, viewport-safe layout.

## 8.3 Components

Files under:

- `/Users/bradleyexton/.codex/worktrees/c8b1/wing-night/packages/minigames/drawing/src/client/HostDrawingSurface/`
- `/Users/bradleyexton/.codex/worktrees/c8b1/wing-night/packages/minigames/drawing/src/client/DisplayDrawingSurface/`

Required controls on host play surface:

- Correct button
- Incorrect button
- Skip button
- Undo stroke button
- Clear canvas button
- Prompt progress label (`X / promptsPerTurn`)

Intro surface:

- Show rules summary and active team context.

## 9) Dev Sandbox Requirements

File: `/Users/bradleyexton/.codex/worktrees/c8b1/wing-night/packages/minigames/drawing/src/dev/index.ts`

Add scenarios:

- Intro idle
- Play empty canvas
- Play in-progress drawing
- Play resolved-correct reveal
- Play resolved-incorrect reveal
- Play prompt-limit reached

## 10) Server And Socket Integration

Existing envelopes already support generic action dispatch.

Key paths:

- `/Users/bradleyexton/.codex/worktrees/c8b1/wing-night/apps/server/src/socketServer/index.ts`
- `/Users/bradleyexton/.codex/worktrees/c8b1/wing-night/apps/server/src/roomState/index.ts`
- `/Users/bradleyexton/.codex/worktrees/c8b1/wing-night/apps/server/src/minigames/runtime/index.ts`

No new socket event names are required.

## 11) Dependency Plan

Required addition:

- `perfect-freehand` (client drawing smoothness).

No additional runtime server dependencies.

Not selected for MVP:

- `react-konva` (React 19 peer expectation, current app is React 18).
- `fabric` and `tldraw` (heavier than needed for this game loop).

## 12) Testing Plan

## 12.1 Unit tests

Add/extend tests for:

- Drawing content validation.
- Game config drawing rules validation.
- Drawing runtime reducer action behavior.
- Points clamping per active team.
- Prompt progression and per-turn limits.
- Display-safe projection (no hidden prompt leakage before resolve).

## 12.2 Component tests

- Host surface actions disabled/enabled by phase and prompt limit.
- Display reveal lifecycle rendering.

## 12.3 E2E tests (Playwright)

Cover:

- Host draws and display syncs.
- Host marks correct and score updates.
- Prompt briefly appears on display, then hides.
- Refresh/reconnect rehydrate preserves canonical canvas state.

## 13) Acceptance Criteria

- DRAWING runtime no longer returns unsupported stub state.
- Host can run multiple prompts in one team turn.
- Correct answers add exactly `+1` pending point.
- `promptsPerTurn` is enforced from config.
- Display only shows prompt text during brief post-result reveal window.
- Display never receives host-only secret fields.
- Existing test suites pass, plus new drawing coverage.

## 14) Incremental Delivery Steps

1. Shared contracts and validators (game config + drawing content).
2. Drawing runtime reducer with tests.
3. Host/display surfaces with smoothing and controls.
4. Dev sandbox scenarios for drawing.
5. E2E sync/rehydrate coverage.

