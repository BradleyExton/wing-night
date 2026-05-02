# Drawing Minigame Spec (MVP)

Status: Draft for implementation

Last updated: 2026-04-29

## 1) Goals

- Ship a full `DRAWING` minigame that fits the existing Wing Night turn loop.
- Keep server authoritative for minigame state and scoring.
- Provide high-quality drawing feel on the host tablet.
- Keep display answer-safe during active drawing.
- Show the prompt text on display briefly after the tablet marks correct or incorrect.

## 2) Locked Product Decisions

- Scoring: `+1` point per correct prompt.
- Multiple prompts run in a single team turn; the phase timer is the only turn constraint.
- Prompt catalog is content-driven (JSON files), not entered in-app.
- Prompts are shuffled on `initialize` and stepped through sequentially (no repeats until list exhausted).
- Display reveals prompt text briefly after tablet marks `Correct` or `Incorrect`.
- Reveal window is display-client-driven (`now < expiresAtMs`); server state is cleared on the next result action or `beginStroke`.
- A teammate is selected to draw and physically holds the host tablet.
- Prompt text is always visible on the tablet while drawing; the TV display never shows it during active drawing.
- Coordinates are stored normalized (0–1); tablet normalizes on capture, display scales to its own canvas size.
- Fixed color palette (~6 colors) and a single fixed brush size, hardcoded in the UI.
- Undo removes exactly one stroke; clear canvas removes all strokes.
- Strokes hold only the current prompt's drawing; canvas clears on every result action.
- `DrawingHostView | DrawingDisplayView` are added as new discriminated union members; trivia and geo types are untouched.
- Sample content ships with ~60 playable prompts, flat catalog, no difficulty field.

## 3) Non-Goals (MVP)

- No free-text answer checking.
- No AI judging.
- No persistent drawing history across rounds.
- No player device drawing input.
- No per-turn prompt count limit (`promptsPerTurn` is not used).

## 4) Game Flow In MINIGAME_PLAY

For the active team turn:

1. Runtime shuffles the prompt list and loads the drawing content.
2. Team selects a teammate to draw; that person holds the host tablet.
3. Tablet shows the current prompt text and canvas.
4. Drawer draws on the tablet canvas; strokes appear in real time on the TV display.
5. Tablet operator taps `Correct` or `Incorrect`.
6. Runtime briefly reveals the resolved prompt text on the TV display.
7. Runtime clears the canvas and advances to the next prompt.
8. Turn continues until the phase timer fires; host advances phase using existing phase controls.
9. `skipPrompt` advances to the next prompt with no score change and no reveal.

## 5) Config And Content Contracts

## 5.1 `gameConfig.json`

No drawing-specific rules are required. `DrawingMinigameRules` type is not added.
`MinigameRules` requires no `drawing` key.

Example `gameConfig.json`:

```json
{
  "minigameRules": {
    "trivia": { "questionsPerTurn": 1 }
  }
}
```

## 5.2 Drawing content file

Add shared content schema:

- `packages/shared/src/content/drawing/index.ts`

Add sample content:

- `content/sample/minigames/drawing.json`

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

Sample content ships with ~60 prompts covering a range of topics (food, animals, objects, actions).

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

File: `apps/server/src/contentLoader/loadMinigameContent/index.ts`

- Drawing runtime plugin declares `content.fileName = "minigames/drawing.json"`.
- Existing plugin content loading path remains unchanged.

## 6) Runtime Contract

File: `packages/minigames/drawing/src/runtime/index.ts`

## 6.1 State model

```ts
type DrawingPoint = {
  x: number; // normalized 0–1
  y: number; // normalized 0–1
  t: number; // timestamp ms
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
  shuffledPromptIds: string[];
  pendingPointsByTeamId: Record<string, number>;
  strokes: DrawingStroke[];
  activeStrokeId: string | null;
  reveal: PromptReveal | null;
};
```

Constants:

- `PROMPT_REVEAL_MS = 2000`
- `MAX_STROKES = 60`
- `MAX_POINTS_PER_STROKE = 500`
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
- `beginStroke`:
  - Clears `reveal` if present.
  - Creates new stroke if `strokes.length < MAX_STROKES`.
- `appendStrokePoints` appends sanitized points to active stroke (capped at `MAX_POINTS_PER_STROKE`, batch capped at `MAX_APPEND_POINTS_PER_ACTION`).
- `endStroke` clears `activeStrokeId`.
- `undoStroke` removes last stroke.
- `clearCanvas` removes all strokes and clears `activeStrokeId`.
- `markCorrect`:
  - Increment active team pending points by 1, clamp to `pointsMax`.
  - Emit prompt reveal with `outcome = CORRECT`, `expiresAtMs = now + PROMPT_REVEAL_MS`.
  - Advance `promptCursor`.
  - Clear canvas.
- `markIncorrect`:
  - No score change.
  - Emit prompt reveal with `outcome = INCORRECT`, `expiresAtMs = now + PROMPT_REVEAL_MS`.
  - Advance `promptCursor`.
  - Clear canvas.
- `skipPrompt`:
  - No score change.
  - No reveal.
  - Advance `promptCursor`.
  - Clear canvas.

## 6.4 Prompt rotation

- `promptCursor` indexes into `shuffledPromptIds`, wrapping by list length.
- `shuffledPromptIds` is populated on `initialize` by shuffling `content.prompts`.
- If prompt list is empty at runtime, reducer accepts drawing actions but blocks result actions.

## 7) Host And Display Projection

- Server projections remain the only source for `minigameHostView` and `minigameDisplayView`.
- Display payload must remain answer-safe.

## 7.1 Contract update strategy

Add `DrawingHostView` and `DrawingDisplayView` as new discriminated union members in:

`packages/shared/src/roomState/index.ts`

Trivia and geo view types are not changed.

## 7.2 Drawing host view

```ts
type DrawingHostView = {
  minigame: "DRAWING";
  activeTurnTeamId: string | null;
  promptCursor: number;
  currentPrompt: { id: string; prompt: string } | null;
  pendingPointsByTeamId: Record<string, number>;
  strokes: DrawingStroke[];
  activeStrokeId: string | null;
  reveal: PromptReveal | null;
};
```

Host view includes `currentPrompt` (the prompt text visible on the tablet). It is never sent to the display.

## 7.3 Drawing display view

```ts
type DrawingDisplayView = {
  minigame: "DRAWING";
  activeTurnTeamId: string | null;
  pendingPointsByTeamId: Record<string, number>;
  strokes: DrawingStroke[];
  reveal: PromptReveal | null;
};
```

Display view excludes `currentPrompt`, `activeStrokeId`, and `promptCursor`.

Display behavior:

- If `reveal !== null` and `now < reveal.expiresAtMs`, show `reveal.promptText` with outcome badge.
- Otherwise, hide prompt text.

## 8) Client Rendering Spec

## 8.1 Host drawing quality

Use:

- Native `<canvas>`.
- Pointer Events for input capture.
- `perfect-freehand` for stroke smoothing and pressure-like feel.

Coordinate capture:

- Normalize pointer `x` and `y` to 0–1 relative to canvas dimensions at capture time.

Render strategy:

- Local optimistic stroke rendering for immediate feel.
- Batched network dispatch for canonical server state.
- Reconcile host view from server snapshots.

Batching rules:

- Append points at max ~15 sends/sec.
- Each `appendStrokePoints` action capped by `MAX_APPEND_POINTS_PER_ACTION`.

## 8.2 Display rendering

- Render server-projected strokes only.
- Scale normalized coordinates to display canvas dimensions on render.
- No local prediction needed.
- Maintain no-scroll, viewport-safe layout.

## 8.3 Components

Files under:

- `packages/minigames/drawing/src/client/HostDrawingSurface/`
- `packages/minigames/drawing/src/client/DisplayDrawingSurface/`

Required controls on host play surface:

- Prompt text (always visible)
- Correct button
- Incorrect button
- Skip button
- Undo stroke button
- Clear canvas button
- Color palette (~6 colors)

Intro surface:

- Show rules summary and active team context.

## 9) Dev Sandbox Requirements

File: `packages/minigames/drawing/src/dev/index.ts`

Add scenarios:

- Intro idle
- Play empty canvas
- Play in-progress drawing
- Play resolved-correct reveal
- Play resolved-incorrect reveal

## 10) Server And Socket Integration

Existing envelopes already support generic action dispatch.

Key paths:

- `apps/server/src/socketServer/index.ts`
- `apps/server/src/roomState/index.ts`
- `apps/server/src/minigames/runtime/index.ts`

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
- Drawing runtime reducer action behavior.
- Points clamping per active team.
- Prompt shuffle and progression.
- Display-safe projection (no prompt text leakage before resolve).

## 12.2 Component tests

- Host surface controls render correctly for each state (empty canvas, in-progress, reveal).
- Display reveal lifecycle rendering.

## 12.3 E2E tests (Playwright)

Cover:

- Drawer draws on tablet and display syncs strokes.
- Tablet marks correct and score updates.
- Prompt briefly appears on display, then hides.
- Refresh/reconnect rehydrates current canvas state.

## 13) Acceptance Criteria

- DRAWING runtime no longer returns unsupported stub state.
- Team selects a drawer who holds the tablet; prompt is visible on tablet, hidden on display.
- Correct answers add exactly `+1` pending point.
- Phase timer governs turn length; no prompt count gate.
- Display only shows prompt text during brief post-result reveal window.
- Display never receives `currentPrompt` or any host-only field.
- Strokes use normalized 0–1 coordinates and render correctly on both tablet and TV.
- Existing test suites pass, plus new drawing coverage.

## 14) Incremental Delivery Steps

1. Shared contracts and content schema (drawing content file + validators).
2. Drawing runtime reducer with tests.
3. Host/display surfaces with smoothing, color palette, and controls.
4. Dev sandbox scenarios for drawing.
5. E2E sync/rehydrate coverage.
