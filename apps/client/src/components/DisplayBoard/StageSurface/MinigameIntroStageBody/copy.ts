import type { MinigameHandset } from "@wingnight/minigames-core";
import { CONTESTANT_CONTROLLERS } from "@wingnight/shared";

import { formatMinigameName } from "../../../../copy/formatters";

export const minigameIntroStageCopy = {
  eyebrow: "on the wings",
  playingLabel: "playing",
  minigameName: formatMinigameName,
  fallbackTeamName: "Next Team",
  fallbackMinigameLabel: "Pending",
  rosterSeparator: "·",
  // An arcade relay's briefing tells the team what to pick up: the one tablet, passed hand to
  // hand, or every player's own phone, which comes alive on their leg.
  handsetLine: (handset: MinigameHandset): string =>
    handset === CONTESTANT_CONTROLLERS.PHONE ? "Grab your phones" : "Grab the tablet"
} as const;
