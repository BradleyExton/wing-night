import type { MinigameType } from "@wingnight/shared";

import type { MinigameDevManifest } from "../index.js";

type CreateUnsupportedDevManifestOptions = {
  minigameId: MinigameType;
  hostUnsupportedMessage: string;
  displayUnsupportedMessage: string;
};

const DEFAULT_TEAM_ID = "team-alpha";
const DEFAULT_TEAM_NAME = "Team Alpha";

export const createUnsupportedDevManifest = ({
  minigameId,
  hostUnsupportedMessage,
  displayUnsupportedMessage
}: CreateUnsupportedDevManifestOptions): MinigameDevManifest => {
  return {
    defaultScenarioId: "unsupported",
    scenarios: [
      {
        id: "unsupported",
        label: "Unsupported Stub",
        phase: "play",
        activeTeamName: DEFAULT_TEAM_NAME,
        teamNameByTeamId: {
          [DEFAULT_TEAM_ID]: DEFAULT_TEAM_NAME
        },
        minigameHostView: {
          minigame: minigameId,
          activeTurnTeamId: DEFAULT_TEAM_ID,
          attemptsRemaining: 0,
          promptCursor: 0,
          pendingPointsByTeamId: {
            [DEFAULT_TEAM_ID]: 0
          },
          currentPrompt: null,
          status: "UNSUPPORTED",
          message: hostUnsupportedMessage
        },
        minigameDisplayView: {
          minigame: minigameId,
          activeTurnTeamId: DEFAULT_TEAM_ID,
          promptCursor: 0,
          pendingPointsByTeamId: {
            [DEFAULT_TEAM_ID]: 0
          },
          currentPrompt: null,
          status: "UNSUPPORTED",
          message: displayUnsupportedMessage
        }
      }
    ]
  };
};
