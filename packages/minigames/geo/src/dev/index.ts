import type { MinigameDevManifest } from "@wingnight/minigames-core";

export const geoDevManifest: MinigameDevManifest = {
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
        minigame: "GEO",
        activeTurnTeamId: "team-alpha",
        attemptsRemaining: 0,
        promptCursor: 0,
        pendingPointsByTeamId: {
          "team-alpha": 0
        },
        currentPrompt: null,
        status: "UNSUPPORTED",
        message: "GEO host UI is not implemented yet."
      },
      minigameDisplayView: {
        minigame: "GEO",
        activeTurnTeamId: "team-alpha",
        promptCursor: 0,
        pendingPointsByTeamId: {
          "team-alpha": 0
        },
        currentPrompt: null,
        status: "UNSUPPORTED",
        message: "GEO display UI is not implemented yet."
      }
    }
  ]
};
