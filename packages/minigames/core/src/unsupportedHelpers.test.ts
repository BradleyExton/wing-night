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
    minigameId: "DRAWING",
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
      minigame: "DRAWING",
      activeTurnTeamId: "team-1",
      pendingPointsByTeamId: { "team-1": 3 },
      status: "UNSUPPORTED",
      message: "Unavailable"
    }
  );
  assert.deepEqual(
    plugin.selectDisplayView({ state: runtimeState, rules: null, content: null }),
    {
      minigame: "DRAWING",
      activeTurnTeamId: "team-1",
      pendingPointsByTeamId: { "team-1": 3 },
      status: "UNSUPPORTED",
      message: "Unavailable"
    }
  );
});

test("createUnsupportedDevManifest builds a live fixture with one stub scenario", () => {
  const manifest = createUnsupportedDevManifest();

  assert.equal(manifest.defaultScenarioId, "unsupported");
  assert.equal(manifest.scenarios.length, 1);
  assert.equal(manifest.scenarios[0]?.phase, "play");
  assert.deepEqual(manifest.live.teamIds, ["team-alpha"]);
  assert.equal(manifest.live.activeRoundTeamId, "team-alpha");
  assert.equal(manifest.live.content, null);
  assert.equal(manifest.live.rules, null);
});

test("unsupported runtime plugin renders views from the unsupported dev manifest fixture", () => {
  const plugin = createUnsupportedMinigameRuntimePlugin({
    minigameId: "DRAWING",
    metadata,
    unsupportedMessage: "Unavailable"
  });
  const manifest = createUnsupportedDevManifest();

  const runtimeState = plugin.initialize({
    teamIds: manifest.live.teamIds,
    activeRoundTeamId: manifest.live.activeRoundTeamId,
    pointsMax: manifest.live.pointsMax,
    pendingPointsByTeamId: manifest.live.pendingPointsByTeamId,
    rules: manifest.live.rules,
    content: manifest.live.content
  });

  assert.notEqual(runtimeState, null);

  const hostView = plugin.selectHostView({
    state: runtimeState,
    rules: manifest.live.rules,
    content: manifest.live.content
  });

  assert.equal(
    hostView?.minigame === "DRAWING" ? hostView.status : null,
    "UNSUPPORTED"
  );
});

test("resolveUnsupportedActiveTeamName prefers active turn team id when available", () => {
  const resolvedTeamName = resolveUnsupportedActiveTeamName({
    activeTeamName: "Fallback Team",
    minigameHostView: {
      minigame: "DRAWING",
      activeTurnTeamId: "team-2",
      pendingPointsByTeamId: {}
    },
    teamNameByTeamId: new Map([["team-2", "Active Team"]]),
    fallbackLabel: "No team"
  });

  assert.equal(resolvedTeamName, "Active Team");
});
