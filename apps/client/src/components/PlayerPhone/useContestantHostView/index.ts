import { useEffect, useSyncExternalStore } from "react";
import type { ContestantMinigameHostView } from "@wingnight/shared";

import type { ContestantLegController } from "../../../utils/contestantLeg";

const subscribeToNothing = (): (() => void) => () => undefined;

// The game's host view while this phone holds the leg in hand, and null otherwise. Letting go of
// the leg forgets the view, so the next leg this phone is handed waits for its own view rather
// than painting the last one for a frame.
export const useContestantHostView = (
  controller: ContestantLegController | null,
  isHoldingLeg: boolean
): ContestantMinigameHostView | null => {
  const hostView = useSyncExternalStore(
    controller?.subscribe ?? subscribeToNothing,
    () => controller?.getHostView() ?? null,
    () => controller?.getHostView() ?? null
  );

  useEffect(() => {
    if (!isHoldingLeg) {
      controller?.forgetHostView();
    }
  }, [controller, isHoldingLeg]);

  return isHoldingLeg ? hostView : null;
};
