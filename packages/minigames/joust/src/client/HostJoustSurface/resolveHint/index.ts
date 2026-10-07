import type { MinigameSeat } from "@wingnight/minigames-core";
import type { JoustMinigameHostView } from "@wingnight/shared";

import { hostJoustSurfaceCopy } from "../copy.js";

// The line under the buttons while the team is shooting. Solo there is no TV, so the lane on the
// phone is the replay; everywhere else the room watches it on the TV.
export const resolveHint = (seat: MinigameSeat, joustPhase: JoustMinigameHostView["phase"], canAct: boolean): string => {
  if (joustPhase === "aiming") {
    return canAct ? hostJoustSurfaceCopy.aimingHint : hostJoustSurfaceCopy.aimingLockedHint;
  }

  if (joustPhase === "resolved") {
    return seat === "solo" ? hostJoustSurfaceCopy.soloReplayingHint : hostJoustSurfaceCopy.replayingHint;
  }

  return hostJoustSurfaceCopy.turnOverLabel;
};
