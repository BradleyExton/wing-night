import type { JoustShotResult } from "@wingnight/shared";

// Shared by the host deck and the TV: what to call a shot, by how much of the
// rack it put on the sand. A miss is a miss; a clean sweep gets the only
// bonus in the game and says so; a tower coming down is its own headline.
export type JoustShotCopy = {
  title: string;
  blurb: string;
};

const MISS: JoustShotCopy = { title: "Whiff", blurb: "The bay claims another." };
const RACK_CLEARED: JoustShotCopy = {
  title: "Rack cleared!",
  blurb: "Nobody left standing. Bonus on the board."
};
const TIMBER: JoustShotCopy = {
  title: "Timber!",
  blurb: "The scaffolding gave way. Everyone on it came down with it."
};
const SINGLE: JoustShotCopy = { title: "One down", blurb: "Clean contact. Off they go." };
const PILE_UP: JoustShotCopy = { title: "Pile-up", blurb: "They went down like dominoes." };

export const resolveShotCopy = (
  shot: Pick<JoustShotResult, "toppledPlayerIds" | "isRackCleared" | "collapsedPerchIndices">
): JoustShotCopy => {
  if (shot.isRackCleared) {
    return RACK_CLEARED;
  }

  if (shot.collapsedPerchIndices.length > 0) {
    return TIMBER;
  }

  if (shot.toppledPlayerIds.length <= 0) {
    return MISS;
  }

  return shot.toppledPlayerIds.length === 1 ? SINGLE : PILE_UP;
};
