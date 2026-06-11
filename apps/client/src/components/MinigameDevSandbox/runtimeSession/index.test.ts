import assert from "node:assert/strict";
import test from "node:test";
import type {
  MinigameRuntimeSelectorInput,
  SerializableValue
} from "@wingnight/minigames-core";
import { geoDevManifest } from "@wingnight/minigames-geo/dev";
import { geoRuntimePlugin } from "@wingnight/minigames-geo/runtime";
import { triviaDevManifest } from "@wingnight/minigames-trivia/dev";
import { triviaRuntimePlugin } from "@wingnight/minigames-trivia/runtime";

import { resolveScenarioById } from "../sandboxState";
import { createSandboxRuntimeState, reduceSandboxRuntimeState } from "./index";

const geoSelectorInput = (
  state: SerializableValue
): MinigameRuntimeSelectorInput => {
  return {
    state,
    rules: geoDevManifest.live.rules,
    content: geoDevManifest.live.content
  };
};

test("geo sandbox session initializes the default scenario from the live fixture", () => {
  const runtimeState = createSandboxRuntimeState(
    geoRuntimePlugin,
    geoDevManifest.live,
    resolveScenarioById(geoDevManifest.scenarios, "play-guessing")
  );

  const hostView = geoRuntimePlugin.selectHostView(geoSelectorInput(runtimeState));

  assert.equal(hostView?.minigame, "GEO");
  assert.equal(
    hostView?.minigame === "GEO" ? hostView.currentPrompt?.title : null,
    "Eiffel Tower"
  );
  assert.equal(
    hostView?.minigame === "GEO" ? hostView.currentSubState : null,
    "guessing"
  );
});

test("geo sandbox session plays guess, submit, and next prompt through the real reducer", () => {
  let runtimeState = createSandboxRuntimeState(
    geoRuntimePlugin,
    geoDevManifest.live,
    resolveScenarioById(geoDevManifest.scenarios, "play-guessing")
  );

  runtimeState = reduceSandboxRuntimeState(
    geoRuntimePlugin,
    geoDevManifest.live,
    runtimeState,
    "setGuess",
    { lat: 48.5, lng: 2.6 }
  );
  runtimeState = reduceSandboxRuntimeState(
    geoRuntimePlugin,
    geoDevManifest.live,
    runtimeState,
    "submitGuess",
    {}
  );

  const hostView = geoRuntimePlugin.selectHostView(geoSelectorInput(runtimeState));

  assert.equal(
    hostView?.minigame === "GEO" ? hostView.currentSubState : null,
    "submitted"
  );
  assert.equal(
    hostView?.minigame === "GEO" ? hostView.lastResult?.pointsAwarded : null,
    1
  );
  assert.equal(
    hostView?.minigame === "GEO" ? hostView.pendingPointsByTeamId["team-alpha"] : null,
    5
  );

  runtimeState = reduceSandboxRuntimeState(
    geoRuntimePlugin,
    geoDevManifest.live,
    runtimeState,
    "nextPrompt",
    {}
  );

  const nextHostView = geoRuntimePlugin.selectHostView(geoSelectorInput(runtimeState));

  assert.equal(
    nextHostView?.minigame === "GEO" ? nextHostView.currentPrompt?.title : null,
    "Statue of Liberty"
  );
});

test("geo sandbox display view stays answer-free while guessing", () => {
  const runtimeState = createSandboxRuntimeState(
    geoRuntimePlugin,
    geoDevManifest.live,
    resolveScenarioById(geoDevManifest.scenarios, "play-guess-placed")
  );

  const displayView = geoRuntimePlugin.selectDisplayView(geoSelectorInput(runtimeState));

  assert.equal(displayView?.minigame, "GEO");
  assert.doesNotMatch(JSON.stringify(displayView), /answer/i);
});

test("geo turn-complete scenario replays a full three-prompt turn", () => {
  const runtimeState = createSandboxRuntimeState(
    geoRuntimePlugin,
    geoDevManifest.live,
    resolveScenarioById(geoDevManifest.scenarios, "play-turn-complete")
  );

  const hostView = geoRuntimePlugin.selectHostView(geoSelectorInput(runtimeState));

  assert.equal(
    hostView?.minigame === "GEO" ? hostView.promptsCompletedThisTurn : null,
    3
  );
  assert.equal(
    hostView?.minigame === "GEO" ? hostView.currentSubState : null,
    "submitted"
  );
});

test("unknown sandbox actions leave the runtime state unchanged", () => {
  const runtimeState = createSandboxRuntimeState(
    geoRuntimePlugin,
    geoDevManifest.live,
    resolveScenarioById(geoDevManifest.scenarios, "play-guessing")
  );

  const nextRuntimeState = reduceSandboxRuntimeState(
    geoRuntimePlugin,
    geoDevManifest.live,
    runtimeState,
    "unknownAction",
    {}
  );

  assert.deepEqual(nextRuntimeState, runtimeState);
});

test("trivia sandbox session records attempts through the real reducer", () => {
  let runtimeState = createSandboxRuntimeState(
    triviaRuntimePlugin,
    triviaDevManifest.live,
    resolveScenarioById(triviaDevManifest.scenarios, "play-default")
  );

  const selectorInput = {
    rules: triviaDevManifest.live.rules,
    content: triviaDevManifest.live.content
  };
  const initialHostView = triviaRuntimePlugin.selectHostView({
    state: runtimeState,
    ...selectorInput
  });

  assert.equal(
    initialHostView?.minigame === "TRIVIA" ? initialHostView.attemptsRemaining : null,
    3
  );

  runtimeState = reduceSandboxRuntimeState(
    triviaRuntimePlugin,
    triviaDevManifest.live,
    runtimeState,
    "recordAttempt",
    { isCorrect: true }
  );

  const hostView = triviaRuntimePlugin.selectHostView({
    state: runtimeState,
    ...selectorInput
  });

  assert.equal(
    hostView?.minigame === "TRIVIA" ? hostView.attemptsRemaining : null,
    2
  );
  assert.equal(
    hostView?.minigame === "TRIVIA" ? hostView.pendingPointsByTeamId["team-alpha"] : null,
    1
  );
  assert.equal(
    hostView?.minigame === "TRIVIA"
      ? hostView.currentPrompt?.question
      : null,
    "What compound gives chili peppers their heat?"
  );
});
