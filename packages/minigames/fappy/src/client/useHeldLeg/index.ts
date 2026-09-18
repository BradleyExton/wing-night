import { useEffect, useRef, useState } from "react";
import type { FappyMinigameDisplayView, FappyMinigameHostView } from "@wingnight/shared";

import { HANDOFF_BEAT_MS } from "../beats/index.js";

export type LegHold = {
  // The leg the surface keeps on screen: the one that just cleared.
  legIndex: number;
  // Whether the tablet is changing hands or the relay is through.
  kind: "handoff" | "finish";
  startedAtMs: number;
};

type LegView = Pick<FappyMinigameHostView | FappyMinigameDisplayView, "legIndex" | "legsPerTurn" | "legs">;

// What a change in the leg in hand means for the picture. The view moves on
// the instant a leg clears; the surfaces do not, so the room sees the landing
// and hears whose tablet it is before the corridor wipes.
export const resolveLegHold = (
  previousLegIndex: number | null,
  view: LegView,
  nowMs: number
): LegHold | null => {
  if (previousLegIndex === null || view.legIndex <= previousLegIndex) {
    return null;
  }

  const clearedLeg = view.legs[previousLegIndex];

  if (clearedLeg === undefined || clearedLeg.status !== "cleared") {
    return null;
  }

  return {
    legIndex: previousLegIndex,
    kind: view.legIndex >= view.legsPerTurn ? "finish" : "handoff",
    startedAtMs: nowMs
  };
};

// The leg index a surface should draw right now, and the hold it is in, if
// any. A hold lasts the handoff beat plus whatever slack the caller needs
// (the TV's replay runs behind the tablet); a reset drops it at once.
export const useHeldLeg = (
  view: LegView,
  slackMs = 0
): { shownLegIndex: number; hold: LegHold | null } => {
  const [hold, setHold] = useState<LegHold | null>(null);
  const previousLegIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const previousLegIndex = previousLegIndexRef.current;

    previousLegIndexRef.current = view.legIndex;

    const nextHold = resolveLegHold(previousLegIndex, view, Date.now());

    if (nextHold !== null) {
      setHold(nextHold);
    } else if (previousLegIndex !== null && view.legIndex < previousLegIndex) {
      setHold(null);
    }
  }, [view.legIndex]);

  useEffect(() => {
    if (hold === null) {
      return undefined;
    }

    const handle = window.setTimeout(() => {
      setHold(null);
    }, HANDOFF_BEAT_MS + slackMs);

    return (): void => {
      window.clearTimeout(handle);
    };
  }, [hold, slackMs]);

  const shownLegIndex = hold === null ? Math.min(view.legIndex, view.legsPerTurn - 1) : hold.legIndex;

  return { shownLegIndex, hold };
};
