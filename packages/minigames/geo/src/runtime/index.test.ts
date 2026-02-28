import assert from "node:assert/strict";
import test from "node:test";

import { MINIGAME_API_VERSION } from "@wingnight/shared";

import { geoMinigameId, geoMinigameMetadata, geoRuntimePlugin } from "./index.js";

test("geo runtime metadata advertises expected API version", () => {
  assert.equal(geoMinigameId, "GEO");
  assert.equal(geoMinigameMetadata.minigameApiVersion, MINIGAME_API_VERSION);
  assert.equal(geoMinigameMetadata.intro.displayName, "Geo Dash");
  assert.ok(geoMinigameMetadata.intro.howToPlay.length > 0);
});

test("geo runtime plugin projects unsupported host and display views", () => {
  const runtimeState = geoRuntimePlugin.initialize({
    teamIds: ["team-alpha"],
    activeRoundTeamId: "team-alpha",
    pointsMax: 10,
    pendingPointsByTeamId: { "team-alpha": 4 },
    rules: null,
    content: null
  });

  assert.notEqual(runtimeState, null);

  const hostView = geoRuntimePlugin.selectHostView({
    state: runtimeState,
    rules: null,
    content: null
  });
  const displayView = geoRuntimePlugin.selectDisplayView({
    state: runtimeState,
    rules: null,
    content: null
  });

  assert.deepEqual(hostView, {
    minigame: "GEO",
    activeTurnTeamId: "team-alpha",
    attemptsRemaining: 0,
    promptCursor: 0,
    pendingPointsByTeamId: { "team-alpha": 4 },
    currentPrompt: null,
    status: "UNSUPPORTED",
    message: "GEO gameplay runtime is not implemented yet."
  });
  assert.deepEqual(displayView, {
    minigame: "GEO",
    activeTurnTeamId: "team-alpha",
    promptCursor: 0,
    pendingPointsByTeamId: { "team-alpha": 4 },
    currentPrompt: null,
    status: "UNSUPPORTED",
    message: "GEO gameplay runtime is not implemented yet."
  });
});
