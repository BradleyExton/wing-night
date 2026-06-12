import assert from "node:assert/strict";
import test from "node:test";

import {
  MINIGAME_API_VERSION,
  type DrawingContentFile,
  type DrawingMinigameDisplayView,
  type DrawingMinigameHostView,
  type DrawingPoint
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import {
  drawingMinigameId,
  drawingMinigameMetadata,
  drawingRuntimePlugin
} from "./index.js";
import { parseDrawingContentFile } from "./content/index.js";
import {
  MAX_APPEND_POINTS_PER_ACTION,
  MAX_POINTS_PER_STROKE,
  MAX_STROKES,
  PROMPT_REVEAL_MS,
  type DrawingRuntimeState
} from "./types/index.js";

const drawingContentFixture: DrawingContentFile = {
  prompts: [
    { id: "pizza", prompt: "Pizza slice" },
    { id: "campfire", prompt: "Campfire" },
    { id: "skateboard", prompt: "Skateboard" }
  ]
};

const point = (x: number, y: number, t = 0): DrawingPoint => ({ x, y, t });

const initializeState = (
  overrides: Partial<{
    teamIds: string[];
    activeRoundTeamId: string | null;
    pointsMax: number;
    pendingPointsByTeamId: Record<string, number>;
    content: SerializableValue | null;
  }> = {}
): DrawingRuntimeState => {
  const state = drawingRuntimePlugin.initialize({
    teamIds: overrides.teamIds ?? ["team-1", "team-2"],
    activeRoundTeamId:
      overrides.activeRoundTeamId === undefined
        ? "team-1"
        : overrides.activeRoundTeamId,
    pointsMax: overrides.pointsMax ?? 15,
    pendingPointsByTeamId: overrides.pendingPointsByTeamId ?? {},
    rules: null,
    content:
      overrides.content === undefined ? drawingContentFixture : overrides.content
  });

  assert.notEqual(state, null);
  return state as DrawingRuntimeState;
};

const reduce = (
  state: SerializableValue,
  actionType: string,
  actionPayload: SerializableValue,
  options: Partial<{
    pointsMax: number;
    content: SerializableValue | null;
  }> = {}
): { state: SerializableValue; didMutate: boolean } => {
  return drawingRuntimePlugin.reduceAction({
    state,
    envelope: { actionType, actionPayload },
    pointsMax: options.pointsMax ?? 15,
    rules: null,
    content:
      options.content === undefined ? drawingContentFixture : options.content
  });
};

const beginStroke = (
  state: SerializableValue,
  strokeId: string,
  start: DrawingPoint = point(0.5, 0.5)
): DrawingRuntimeState => {
  const result = reduce(state, "beginStroke", {
    strokeId,
    color: "#FFFFFF",
    size: 0.025,
    start
  });

  assert.equal(result.didMutate, true);
  return result.state as DrawingRuntimeState;
};

test("drawing runtime metadata advertises expected API version", () => {
  assert.equal(drawingMinigameId, "DRAWING");
  assert.equal(drawingMinigameMetadata.minigameApiVersion, MINIGAME_API_VERSION);
  assert.equal(drawingMinigameMetadata.capabilities.supportsHostRenderer, true);
});

test("runtime plugin declares the drawing content file", () => {
  assert.equal(drawingRuntimePlugin.content?.fileName, "minigames/drawing.json");
});

test("parseDrawingContentFile rejects invalid content", () => {
  assert.throws(() => parseDrawingContentFile("not json", "drawing.json"));
  assert.throws(() =>
    parseDrawingContentFile(JSON.stringify({ prompts: [] }), "drawing.json")
  );
  assert.throws(() =>
    parseDrawingContentFile(
      JSON.stringify({
        prompts: [
          { id: "dup", prompt: "One" },
          { id: "dup", prompt: "Two" }
        ]
      }),
      "drawing.json"
    )
  );

  const parsed = parseDrawingContentFile(
    JSON.stringify(drawingContentFixture),
    "drawing.json"
  );
  assert.equal(parsed.prompts.length, 3);
});

test("initialize seeds an empty canvas with shuffled prompt ids", () => {
  const state = initializeState({ pendingPointsByTeamId: { "team-2": 3 } });

  assert.equal(state.activeTurnTeamId, "team-1");
  assert.equal(state.promptCursor, 0);
  assert.deepEqual(
    [...state.shuffledPromptIds].sort(),
    ["campfire", "pizza", "skateboard"]
  );
  assert.deepEqual(state.pendingPointsByTeamId, { "team-2": 3 });
  assert.deepEqual(state.strokes, []);
  assert.equal(state.activeStrokeId, null);
  assert.equal(state.reveal, null);
});

test("initialize falls back to the first team when no round team is active", () => {
  const state = initializeState({ activeRoundTeamId: null });
  assert.equal(state.activeTurnTeamId, "team-1");
});

test("beginStroke starts a new active stroke", () => {
  const state = initializeState();
  const nextState = beginStroke(state, "stroke-1", point(0.25, 0.75, 10));

  assert.equal(nextState.strokes.length, 1);
  assert.equal(nextState.activeStrokeId, "stroke-1");
  assert.deepEqual(nextState.strokes[0]?.points, [point(0.25, 0.75, 10)]);
});

test("beginStroke rejects duplicate stroke ids and malformed payloads", () => {
  const state = beginStroke(initializeState(), "stroke-1");

  const duplicate = reduce(state, "beginStroke", {
    strokeId: "stroke-1",
    color: "#FFFFFF",
    size: 0.025,
    start: point(0.1, 0.1)
  });
  assert.equal(duplicate.didMutate, false);

  const malformed = reduce(state, "beginStroke", { strokeId: "stroke-2" });
  assert.equal(malformed.didMutate, false);
});

test("beginStroke is rejected once the stroke cap is reached", () => {
  let state: DrawingRuntimeState = initializeState();

  for (let index = 0; index < MAX_STROKES; index += 1) {
    state = beginStroke(state, `stroke-${index}`);
  }

  const overflow = reduce(state, "beginStroke", {
    strokeId: "stroke-overflow",
    color: "#FFFFFF",
    size: 0.025,
    start: point(0.5, 0.5)
  });
  assert.equal(overflow.didMutate, false);
});

test("appendStrokePoints appends clamped points to the active stroke only", () => {
  const state = beginStroke(initializeState(), "stroke-1");

  const wrongStroke = reduce(state, "appendStrokePoints", {
    strokeId: "stroke-unknown",
    points: [point(0.5, 0.5)]
  });
  assert.equal(wrongStroke.didMutate, false);

  const appended = reduce(state, "appendStrokePoints", {
    strokeId: "stroke-1",
    points: [point(2, -1, 5), point(0.5, 0.25, 6)]
  });
  assert.equal(appended.didMutate, true);

  const appendedState = appended.state as DrawingRuntimeState;
  assert.deepEqual(appendedState.strokes[0]?.points.slice(1), [
    point(1, 0, 5),
    point(0.5, 0.25, 6)
  ]);
});

test("appendStrokePoints caps the batch and the stroke point total", () => {
  let state = beginStroke(initializeState(), "stroke-1");

  const oversizedBatch = Array.from(
    { length: MAX_APPEND_POINTS_PER_ACTION + 10 },
    (_, index) => point(0.5, 0.5, index)
  );
  const batchResult = reduce(state, "appendStrokePoints", {
    strokeId: "stroke-1",
    points: oversizedBatch
  });
  state = batchResult.state as DrawingRuntimeState;
  assert.equal(state.strokes[0]?.points.length, 1 + MAX_APPEND_POINTS_PER_ACTION);

  while ((state.strokes[0]?.points.length ?? 0) < MAX_POINTS_PER_STROKE) {
    const fillResult = reduce(state, "appendStrokePoints", {
      strokeId: "stroke-1",
      points: oversizedBatch
    });

    if (!fillResult.didMutate) {
      break;
    }

    state = fillResult.state as DrawingRuntimeState;
  }

  assert.equal(state.strokes[0]?.points.length, MAX_POINTS_PER_STROKE);

  const overflow = reduce(state, "appendStrokePoints", {
    strokeId: "stroke-1",
    points: [point(0.5, 0.5)]
  });
  assert.equal(overflow.didMutate, false);
});

test("endStroke clears the active stroke id", () => {
  const state = beginStroke(initializeState(), "stroke-1");

  const mismatched = reduce(state, "endStroke", { strokeId: "stroke-2" });
  assert.equal(mismatched.didMutate, false);

  const ended = reduce(state, "endStroke", { strokeId: "stroke-1" });
  assert.equal(ended.didMutate, true);
  assert.equal((ended.state as DrawingRuntimeState).activeStrokeId, null);
});

test("undoStroke removes the most recent stroke", () => {
  let state = beginStroke(initializeState(), "stroke-1");
  state = beginStroke(state, "stroke-2");

  const undone = reduce(state, "undoStroke", {});
  assert.equal(undone.didMutate, true);

  const undoneState = undone.state as DrawingRuntimeState;
  assert.deepEqual(
    undoneState.strokes.map((stroke) => stroke.strokeId),
    ["stroke-1"]
  );
  // The undone stroke was the active one, so the active id resets too.
  assert.equal(undoneState.activeStrokeId, null);

  const emptyUndo = reduce(initializeState(), "undoStroke", {});
  assert.equal(emptyUndo.didMutate, false);
});

test("clearCanvas removes every stroke", () => {
  let state = beginStroke(initializeState(), "stroke-1");
  state = beginStroke(state, "stroke-2");

  const cleared = reduce(state, "clearCanvas", {});
  assert.equal(cleared.didMutate, true);

  const clearedState = cleared.state as DrawingRuntimeState;
  assert.deepEqual(clearedState.strokes, []);
  assert.equal(clearedState.activeStrokeId, null);

  const emptyClear = reduce(clearedState, "clearCanvas", {});
  assert.equal(emptyClear.didMutate, false);
});

test("markCorrect awards one point, reveals the prompt, and resets the canvas", () => {
  const initialState = initializeState({
    pendingPointsByTeamId: { "team-1": 2 }
  });
  const state = beginStroke(initialState, "stroke-1");
  const expectedPromptId = state.shuffledPromptIds[0];

  const result = reduce(state, "markCorrect", {});
  assert.equal(result.didMutate, true);

  const nextState = result.state as DrawingRuntimeState;
  assert.equal(nextState.pendingPointsByTeamId["team-1"], 3);
  assert.equal(nextState.promptCursor, 1);
  assert.deepEqual(nextState.strokes, []);
  assert.equal(nextState.activeStrokeId, null);
  assert.equal(nextState.reveal?.promptId, expectedPromptId);
  assert.equal(nextState.reveal?.outcome, "CORRECT");
  assert.equal(
    nextState.reveal !== null &&
      nextState.reveal.expiresAtMs - nextState.reveal.revealedAtMs ===
        PROMPT_REVEAL_MS,
    true
  );
});

test("markCorrect clamps pending points at pointsMax", () => {
  const state = initializeState({
    pointsMax: 3,
    pendingPointsByTeamId: { "team-1": 3 }
  });

  const result = reduce(state, "markCorrect", {}, { pointsMax: 3 });
  assert.equal(result.didMutate, true);
  assert.equal(
    (result.state as DrawingRuntimeState).pendingPointsByTeamId["team-1"],
    3
  );
});

test("markIncorrect reveals without awarding points", () => {
  const state = initializeState({ pendingPointsByTeamId: { "team-1": 2 } });

  const result = reduce(state, "markIncorrect", {});
  assert.equal(result.didMutate, true);

  const nextState = result.state as DrawingRuntimeState;
  assert.equal(nextState.pendingPointsByTeamId["team-1"], 2);
  assert.equal(nextState.reveal?.outcome, "INCORRECT");
  assert.equal(nextState.promptCursor, 1);
});

test("skipPrompt advances without scoring or revealing", () => {
  const withReveal = reduce(initializeState(), "markIncorrect", {})
    .state as DrawingRuntimeState;
  assert.notEqual(withReveal.reveal, null);

  const skipped = reduce(withReveal, "skipPrompt", {});
  assert.equal(skipped.didMutate, true);

  const skippedState = skipped.state as DrawingRuntimeState;
  assert.equal(skippedState.promptCursor, 2);
  assert.equal(skippedState.reveal, null);
  assert.deepEqual(skippedState.strokes, []);
});

test("beginStroke clears a lingering reveal", () => {
  const revealedState = reduce(initializeState(), "markCorrect", {})
    .state as DrawingRuntimeState;
  assert.notEqual(revealedState.reveal, null);

  const drawingState = beginStroke(revealedState, "stroke-after-reveal");
  assert.equal(drawingState.reveal, null);
});

test("result actions are blocked without prompts while drawing still works", () => {
  const state = initializeState({ content: { prompts: [] } });

  const drawn = reduce(
    state,
    "beginStroke",
    {
      strokeId: "stroke-1",
      color: "#FFFFFF",
      size: 0.025,
      start: point(0.5, 0.5)
    },
    { content: { prompts: [] } }
  );
  assert.equal(drawn.didMutate, true);

  for (const actionType of ["markCorrect", "markIncorrect", "skipPrompt"]) {
    const blocked = reduce(drawn.state, actionType, {}, { content: { prompts: [] } });
    assert.equal(blocked.didMutate, false, actionType);
  }
});

test("prompts step through the shuffled order without repeats until exhausted", () => {
  let state: SerializableValue = initializeState();
  const seenPromptIds: string[] = [];

  for (let index = 0; index < drawingContentFixture.prompts.length; index += 1) {
    const hostView = drawingRuntimePlugin.selectHostView({
      state,
      rules: null,
      content: drawingContentFixture
    }) as DrawingMinigameHostView;

    assert.notEqual(hostView.currentPrompt, null);
    seenPromptIds.push(hostView.currentPrompt?.id ?? "");
    state = reduce(state, "markIncorrect", {}).state;
  }

  assert.deepEqual(
    [...seenPromptIds].sort(),
    ["campfire", "pizza", "skateboard"]
  );

  // The cursor wraps back to the start of the same shuffled order.
  const wrappedView = drawingRuntimePlugin.selectHostView({
    state,
    rules: null,
    content: drawingContentFixture
  }) as DrawingMinigameHostView;
  assert.equal(wrappedView.currentPrompt?.id, seenPromptIds[0]);
});

test("host view exposes the prompt while the display view stays answer-safe", () => {
  const state = beginStroke(initializeState(), "stroke-1");

  const hostView = drawingRuntimePlugin.selectHostView({
    state,
    rules: null,
    content: drawingContentFixture
  }) as DrawingMinigameHostView;
  const displayView = drawingRuntimePlugin.selectDisplayView({
    state,
    rules: null,
    content: drawingContentFixture
  }) as DrawingMinigameDisplayView;

  assert.notEqual(hostView.currentPrompt, null);
  assert.equal(hostView.activeStrokeId, "stroke-1");
  assert.equal(hostView.strokes.length, 1);

  assert.equal(displayView.strokes.length, 1);
  assert.equal(displayView.reveal, null);
  assert.equal("currentPrompt" in displayView, false);
  assert.equal("activeStrokeId" in displayView, false);
  assert.equal("promptCursor" in displayView, false);

  const serializedDisplayView = JSON.stringify(displayView);
  for (const prompt of drawingContentFixture.prompts) {
    assert.equal(serializedDisplayView.includes(prompt.prompt), false);
  }
});

test("display view carries prompt text only inside the post-result reveal", () => {
  const state = initializeState();
  const hostView = drawingRuntimePlugin.selectHostView({
    state,
    rules: null,
    content: drawingContentFixture
  }) as DrawingMinigameHostView;
  const resolvedPromptText = hostView.currentPrompt?.prompt ?? "";

  const revealedState = reduce(state, "markCorrect", {}).state;
  const displayView = drawingRuntimePlugin.selectDisplayView({
    state: revealedState,
    rules: null,
    content: drawingContentFixture
  }) as DrawingMinigameDisplayView;

  assert.equal(displayView.reveal?.promptText, resolvedPromptText);
  assert.equal(displayView.reveal?.outcome, "CORRECT");
});

test("syncPendingPoints adopts the authoritative score map", () => {
  const state = initializeState();
  const syncedState = drawingRuntimePlugin.syncPendingPoints?.({
    state,
    pendingPointsByTeamId: { "team-1": 7, "team-2": 4 }
  }) as DrawingRuntimeState;

  assert.deepEqual(syncedState.pendingPointsByTeamId, {
    "team-1": 7,
    "team-2": 4
  });
});

test("syncContent keeps known prompt order and appends new prompts", () => {
  const state = initializeState();
  const expandedContent: DrawingContentFile = {
    prompts: [...drawingContentFixture.prompts, { id: "robot", prompt: "Robot" }]
  };

  const syncedState = drawingRuntimePlugin.syncContent?.({
    state,
    rules: null,
    content: expandedContent
  }) as DrawingRuntimeState;

  assert.deepEqual(
    syncedState.shuffledPromptIds.slice(0, 3),
    state.shuffledPromptIds
  );
  assert.deepEqual(syncedState.shuffledPromptIds[3], "robot");

  const shrunkenState = drawingRuntimePlugin.syncContent?.({
    state,
    rules: null,
    content: { prompts: [drawingContentFixture.prompts[0]] }
  }) as DrawingRuntimeState;
  assert.deepEqual(shrunkenState.shuffledPromptIds, ["pizza"]);
});

test("reducer ignores foreign runtime state", () => {
  const result = reduce({ someOther: "state" }, "markCorrect", {});
  assert.equal(result.didMutate, false);

  assert.equal(
    drawingRuntimePlugin.selectHostView({
      state: { someOther: "state" },
      rules: null,
      content: drawingContentFixture
    }),
    null
  );
});
