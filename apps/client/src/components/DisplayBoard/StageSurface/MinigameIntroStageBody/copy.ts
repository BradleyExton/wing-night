import { formatMinigameName } from "../../../../copy/formatters";

export const minigameIntroStageCopy = {
  eyebrow: "on the wings",
  playingLabel: "playing",
  stakesLabel: "up to",
  stakesValue: (points: number): string => `${points} pts`,
  minigameName: formatMinigameName,
  fallbackTeamName: "Next Team",
  fallbackMinigameLabel: "Pending",
  rosterSeparator: "·"
} as const;
