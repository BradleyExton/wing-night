import type { MinigameDevManifest } from "@wingnight/minigames-core";

export const drawingDevManifest: MinigameDevManifest = {
  defaultScenarioId: "unsupported",
  scenarios: [
    {
      id: "unsupported",
      label: "Unsupported Stub",
      phase: "play",
      activeTeamName: "Team Alpha",
      teamNameByTeamId: {
        "team-alpha": "Team Alpha"
      },
      minigameHostView: {
        minigame: "DRAWING",
        activeTurnTeamId: "team-alpha",
        attemptsRemaining: 0,
        promptCursor: 0,
        pendingPointsByTeamId: {
          "team-alpha": 0
        },
        currentPrompt: null,
        status: "UNSUPPORTED",
        message: "DRAWING host UI is not implemented yet."
      },
      minigameDisplayView: {
        minigame: "DRAWING",
        activeTurnTeamId: "team-alpha",
        promptCursor: 0,
        pendingPointsByTeamId: {
          "team-alpha": 0
        },
        currentPrompt: null,
        status: "UNSUPPORTED",
        message: "DRAWING display UI is not implemented yet."
      }
    }
  ]
};
