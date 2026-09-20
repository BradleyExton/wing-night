import { useEffect, useRef, useState } from "react";
import type { SchlonicMinigameDisplayView, SchlonicMinigameHostView } from "@wingnight/shared";

import { CLEARED_BEAT_MS, WIPEOUT_BEAT_MS } from "../beats/index.js";

export type RunHold = {
  /** The run the surface keeps on screen: the one that just ended. */
  runIndex: number;
  /** How it ended, which is what the room is being shown. */
  outcome: "cleared" | "wiped" | "fell";
  /** What it brought home, so the plaque can say so without going back to the run. */
  rings: number;
  /** Whether the tablet is changing hands or the team is through. */
  kind: "handoff" | "finish";
  startedAtMs: number;
};

type RunView = Pick<
  SchlonicMinigameHostView | SchlonicMinigameDisplayView,
  "runIndex" | "runsPerTurn" | "runs"
>;

// What a change in the run in hand means for the picture. The view moves the cursor the instant
// the server has refereed a run; the surfaces do not, so the room sees how it ended — and hears
// whose tablet it is now — before the zone goes back to the start line.
export const resolveRunHold = (
  previousRunIndex: number | null,
  view: RunView,
  nowMs: number
): RunHold | null => {
  if (previousRunIndex === null || view.runIndex <= previousRunIndex) {
    return null;
  }

  const endedRun = view.runs[previousRunIndex];

  if (endedRun === undefined || endedRun.status !== "done") {
    return null;
  }

  return {
    runIndex: previousRunIndex,
    // A skipped run has no result and nothing to show: it reads as the run that never happened.
    outcome: endedRun.result?.outcome ?? "wiped",
    rings: endedRun.result?.rings ?? 0,
    kind: view.runIndex >= view.runsPerTurn ? "finish" : "handoff",
    startedAtMs: nowMs
  };
};

export const resolveHoldDurationMs = (hold: RunHold): number => {
  return hold.outcome === "cleared" ? CLEARED_BEAT_MS : WIPEOUT_BEAT_MS;
};

/**
 * The run index a surface should draw right now, and the hold it is in, if any. A hold lasts the
 * end-of-run beat plus whatever slack the caller needs (the TV's replay runs behind the tablet);
 * a reset drops it at once.
 */
export const useHeldRun = (
  view: RunView,
  slackMs = 0
): { shownRunIndex: number; hold: RunHold | null } => {
  const [hold, setHold] = useState<RunHold | null>(null);
  const previousRunIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const previousRunIndex = previousRunIndexRef.current;

    previousRunIndexRef.current = view.runIndex;

    const nextHold = resolveRunHold(previousRunIndex, view, Date.now());

    if (nextHold !== null) {
      setHold(nextHold);
    } else if (previousRunIndex !== null && view.runIndex < previousRunIndex) {
      setHold(null);
    }
  }, [view.runIndex, view.runs]);

  useEffect(() => {
    if (hold === null) {
      return undefined;
    }

    const handle = window.setTimeout(() => {
      setHold(null);
    }, resolveHoldDurationMs(hold) + slackMs);

    return (): void => {
      window.clearTimeout(handle);
    };
  }, [hold, slackMs]);

  const shownRunIndex =
    hold === null ? Math.min(view.runIndex, view.runsPerTurn - 1) : hold.runIndex;

  return { shownRunIndex, hold };
};
