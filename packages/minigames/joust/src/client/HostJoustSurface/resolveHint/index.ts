import type { MinigameSeat } from "@wingnight/minigames-core";
import type { JoustMinigameHostView } from "@wingnight/shared";

import { hostJoustSurfaceCopy } from "../copy.js";

// The line under the buttons while the team is shooting. Solo there is no TV, so the lane on the
// phone is the replay; everywhere else the room watches it on the TV. While a shot is landing it
// also names whoever steps up next (`upNextName`), so they are moving before they are called.
export const resolveHint = (
  seat: MinigameSeat,
  joustPhase: JoustMinigameHostView["phase"],
  canAct: boolean,
  upNextName: string | null
): string => {
  if (joustPhase === "aiming") {
    return canAct ? hostJoustSurfaceCopy.aimingHint : hostJoustSurfaceCopy.aimingLockedHint;
  }

  if (joustPhase === "resolved") {
    const replaying = seat === "solo" ? hostJoustSurfaceCopy.soloReplayingHint : hostJoustSurfaceCopy.replayingHint;

    return upNextName === null ? replaying : hostJoustSurfaceCopy.upNextHint(replaying, upNextName);
  }

  return hostJoustSurfaceCopy.turnOverLabel;
};
