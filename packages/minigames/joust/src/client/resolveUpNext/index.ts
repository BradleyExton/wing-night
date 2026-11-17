import type { JoustMinigameHostView } from "@wingnight/shared";

import { resolveActiveShooter } from "../../runtime/lineup/index.js";

type UpNextView = Pick<
  JoustMinigameHostView,
  "phase" | "shotIndex" | "shotsPerTurn" | "teammates" | "lineup" | "downPlayerIds"
>;

/**
 * Who steps up when the landed shot's beat runs out: named on the plaque's hold so the next
 * shooter is already off the sofa when the server calls them. Null while aiming, once the turn is
 * over, and on the turn's last shot — its own last, or the one that left nobody standing — the
 * same test the runtime's next shot makes.
 */
export const resolveUpNextName = (view: UpNextView): string | null => {
  const nextShotIndex = view.shotIndex + 1;
  const standingCount = view.lineup.length - view.downPlayerIds.length;

  if (view.phase !== "resolved" || nextShotIndex >= view.shotsPerTurn || standingCount <= 0) {
    return null;
  }

  return resolveActiveShooter(view.teammates, nextShotIndex)?.name ?? null;
};
