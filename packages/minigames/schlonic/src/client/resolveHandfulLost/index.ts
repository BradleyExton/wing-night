import type { SchlonicFrame, SchlonicInput, SchlonicZone } from "@wingnight/shared";
import { advanceSchlonic, createSchlonicRunStart } from "@wingnight/shared";

/**
 * What the hen was holding when a hole took it: the terminal frame carries nothing (the wings
 * were the health bar), so it is read off the tick before, re-run from the log. That is the
 * handful the raccoon makes off with. A wipeout is a hit taken empty-handed, so it lost nothing
 * it was still holding; a cleared run lost nothing at all.
 */
export const resolveHandfulLost = (
  zone: SchlonicZone,
  inputs: readonly SchlonicInput[],
  frame: SchlonicFrame
): number => {
  if (frame.outcome !== "fell" || frame.tick <= 0) {
    return 0;
  }

  return advanceSchlonic(createSchlonicRunStart(zone), zone, inputs, frame.tick - 1).wings;
};
