import type { MinigameDevManifest } from "../index.js";

const DEFAULT_TEAM_ID = "team-alpha";
const DEFAULT_TEAM_NAME = "Team Alpha";
const DEFAULT_POINTS_MAX = 15;

// The unsupported message is owned by the runtime plugin created via
// createUnsupportedMinigameRuntimePlugin; the dev manifest only supplies the
// live initialization fixture and a single stub scenario.
export const createUnsupportedDevManifest = (): MinigameDevManifest => {
  return {
    defaultScenarioId: "unsupported",
    live: {
      teamIds: [DEFAULT_TEAM_ID],
      teamNameByTeamId: {
        [DEFAULT_TEAM_ID]: DEFAULT_TEAM_NAME
      },
      activeRoundTeamId: DEFAULT_TEAM_ID,
      pointsMax: DEFAULT_POINTS_MAX,
      pendingPointsByTeamId: {
        [DEFAULT_TEAM_ID]: 0
      },
      rules: null,
      content: null
    },
    scenarios: [
      {
        id: "unsupported",
        label: "Unsupported Stub",
        phase: "play"
      }
    ]
  };
};
