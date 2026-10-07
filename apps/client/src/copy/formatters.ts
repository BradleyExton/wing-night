import { Phase, resolveMinigameDefinition, type MinigameType } from "@wingnight/shared";

export const formatPhaseLabel = (phase: Phase): string => {
  if (phase === Phase.MINIGAME_INTRO) {
    return "Team Round Intro";
  }

  return phase
    .toLowerCase()
    .split("_")
    .map((segment) => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`)
    .join(" ");
};

export const formatClockSeconds = (remainingSeconds: number): string => {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

// A game's guest-facing name. The enum key is an identifier and never reaches a screen.
export const formatMinigameName = (minigame: MinigameType): string =>
  resolveMinigameDefinition(minigame).displayName;

// A spectator bet's line: always on a half-point today (`resolveSpectatorBetLine`), but a whole
// line reads whole. The one spelling the phone, the TV and the tablet share.
export const formatSpectatorBetLine = (line: number): string =>
  Number.isInteger(line) ? String(line) : line.toFixed(1);
