import assert from "node:assert/strict";
import test from "node:test";

import { MINIGAME_API_VERSION } from "@wingnight/shared";

import {
  drawingMinigameId,
  drawingMinigameMetadata,
  drawingRuntimePlugin
} from "./index.js";

test("drawing runtime metadata advertises expected API version", () => {
  assert.equal(drawingMinigameId, "DRAWING");
  assert.equal(drawingMinigameMetadata.minigameApiVersion, MINIGAME_API_VERSION);
});

test("drawing runtime plugin projects unsupported host and display views", () => {
  const runtimeState = drawingRuntimePlugin.initialize({
    teamIds: ["team-alpha"],
    activeRoundTeamId: "team-alpha",
    pointsMax: 10,
    pendingPointsByTeamId: { "team-alpha": 2 },
    rules: null,
    content: null
  });

  assert.notEqual(runtimeState, null);

  const hostView = drawingRuntimePlugin.selectHostView({
    state: runtimeState,
    rules: null,
    content: null
  });
  const displayView = drawingRuntimePlugin.selectDisplayView({
    state: runtimeState,
    rules: null,
    content: null
  });

  assert.deepEqual(hostView, {
    minigame: "DRAWING",
    activeTurnTeamId: "team-alpha",
    attemptsRemaining: 0,
    promptCursor: 0,
    pendingPointsByTeamId: { "team-alpha": 2 },
    currentPrompt: null,
    status: "UNSUPPORTED",
    message: "DRAWING gameplay runtime is not implemented yet."
  });
  assert.deepEqual(displayView, {
    minigame: "DRAWING",
    activeTurnTeamId: "team-alpha",
    promptCursor: 0,
    pendingPointsByTeamId: { "team-alpha": 2 },
    currentPrompt: null,
    status: "UNSUPPORTED",
    message: "DRAWING gameplay runtime is not implemented yet."
  });
});
