import type { GameConfigFile } from "../validateGameConfigFile/index.js";

// The most a round's mini-game can bank a team: the round's own `minigameMax`
// when the pack sets one, otherwise `finalRoundMax` for the night's last round
// and `defaultMax` for every other. `roundIndex` is zero-based; one outside the
// night (a game the config never schedules) takes the default.
export const resolveRoundMinigameMax = (
  gameConfig: Pick<GameConfigFile, "rounds" | "minigameScoring">,
  roundIndex: number
): number => {
  const round = gameConfig.rounds[roundIndex];

  if (round?.minigameMax !== undefined) {
    return round.minigameMax;
  }

  if (round !== undefined && roundIndex === gameConfig.rounds.length - 1) {
    return gameConfig.minigameScoring.finalRoundMax;
  }

  return gameConfig.minigameScoring.defaultMax;
};
