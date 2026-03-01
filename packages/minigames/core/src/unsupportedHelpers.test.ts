import assert from "node:assert/strict";
import test from "node:test";

import { MINIGAME_API_VERSION } from "@wingnight/shared";

import {
  createUnsupportedDevManifest,
  createUnsupportedMinigameRuntimePlugin,
  resolveUnsupportedActiveTeamName,
  type MinigamePluginMetadata
} from "./index.js";

const metadata: MinigamePluginMetadata = {
  minigameApiVersion: MINIGAME_API_VERSION,
  capabilities: {
    supportsHostRenderer: true,
    supportsDisplayRenderer: true,
    supportsDevScenarios: true
  }
};

test("createUnsupportedMinigameRuntimePlugin projects unsupported host/display views", () => {
  const plugin = createUnsupportedMinigameRuntimePlugin({
    minigameId: "GEO",
    metadata,
    unsupportedMessage: "Unavailable"
  });

  const runtimeState = plugin.initialize({
    teamIds: ["team-1"],
    activeRoundTeamId: "team-1",
    pointsMax: 5,
    pendingPointsByTeamId: { "team-1": 3 },
    rules: null,
    content: null
  });

  assert.notEqual(runtimeState, null);
  assert.deepEqual(
    plugin.selectHostView({ state: runtimeState, rules: null, content: null }),
    {
      minigame: "GEO",
      activeTurnTeamId: "team-1",
      attemptsRemaining: 0,
      promptCursor: 0,
      pendingPointsByTeamId: { "team-1": 3 },
      currentPrompt: null,
      status: "UNSUPPORTED",
      message: "Unavailable"
    }
  );
  assert.deepEqual(
    plugin.selectDisplayView({ state: runtimeState, rules: null, content: null }),
    {
      minigame: "GEO",
      activeTurnTeamId: "team-1",
      promptCursor: 0,
      pendingPointsByTeamId: { "team-1": 3 },
      currentPrompt: null,
      status: "UNSUPPORTED",
      message: "Unavailable"
    }
  );
});

test("createUnsupportedDevManifest builds the default unsupported scenario", () => {
  const manifest = createUnsupportedDevManifest({
    minigameId: "DRAWING",
    hostUnsupportedMessage: "Host unsupported",
    displayUnsupportedMessage: "Display unsupported"
  });

  assert.equal(manifest.defaultScenarioId, "unsupported");
  assert.equal(manifest.scenarios.length, 1);
  assert.equal(manifest.scenarios[0]?.minigameHostView?.status, "UNSUPPORTED");
  assert.equal(manifest.scenarios[0]?.minigameDisplayView?.status, "UNSUPPORTED");
});

test("resolveUnsupportedActiveTeamName prefers active turn team id when available", () => {
  const resolvedTeamName = resolveUnsupportedActiveTeamName({
    activeTeamName: "Fallback Team",
    minigameHostView: {
      minigame: "GEO",
      activeTurnTeamId: "team-2",
      attemptsRemaining: 0,
      promptCursor: 0,
      pendingPointsByTeamId: {},
      currentPrompt: null
    },
    teamNameByTeamId: new Map([["team-2", "Active Team"]]),
    fallbackLabel: "No team"
  });

  assert.equal(resolvedTeamName, "Active Team");
});
