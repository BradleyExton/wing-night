import type {
  MinigameDevLiveFixture,
  MinigameDevScenario,
  MinigameRuntimePlugin,
  SerializableValue
} from "@wingnight/minigames-core";

// Runs the same pure runtime plugin the server drives during a real game:
// initialize from the dev manifest's live fixture, then replay the
// scenario's setup actions so each scenario is a reachable starting state.
export const createSandboxRuntimeState = (
  runtimePlugin: MinigameRuntimePlugin,
  liveFixture: MinigameDevLiveFixture,
  scenario: MinigameDevScenario
): SerializableValue => {
  let runtimeState: SerializableValue = runtimePlugin.initialize({
    teamIds: [...liveFixture.teamIds],
    activeRoundTeamId: liveFixture.activeRoundTeamId,
    pointsMax: liveFixture.pointsMax,
    pendingPointsByTeamId: { ...liveFixture.pendingPointsByTeamId },
    rules: liveFixture.rules,
    content: liveFixture.content
  });

  for (const envelope of scenario.setupActions ?? []) {
    runtimeState = runtimePlugin.reduceAction({
      state: runtimeState,
      envelope,
      pointsMax: liveFixture.pointsMax,
      rules: liveFixture.rules,
      content: liveFixture.content
    }).state;
  }

  return runtimeState;
};

export const reduceSandboxRuntimeState = (
  runtimePlugin: MinigameRuntimePlugin,
  liveFixture: MinigameDevLiveFixture,
  runtimeState: SerializableValue,
  actionType: string,
  actionPayload: SerializableValue
): SerializableValue => {
  return runtimePlugin.reduceAction({
    state: runtimeState,
    envelope: { actionType, actionPayload },
    pointsMax: liveFixture.pointsMax,
    rules: liveFixture.rules,
    content: liveFixture.content
  }).state;
};
