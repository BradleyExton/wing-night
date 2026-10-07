import { useEffect, useState } from "react";
import type { MountMinigameDisplayView, MountMinigameHostView } from "@wingnight/shared";

import { MOUNT_BEAT_MS, SKIP_BEAT_MS, STUCK_BEAT_MS } from "../beats/index.js";

/** How a held climb ended. `skipped` is the climb that never happened: nothing to show, only who is next. */
export type ClimbHoldOutcome = "mounted" | "timeout" | "skipped";

export type ClimbHold = {
  /** The climb the surface keeps on screen: the one that just ended. */
  climbIndex: number;
  outcome: ClimbHoldOutcome;
  /** The share it banked, 0..1, and the points the turn gained by it. */
  share: number;
  points: number;
  /** Whether the tablet is changing hands or the team is through. */
  kind: "handoff" | "finish";
  startedAtMs: number;
};

type ClimbView = Pick<
  MountMinigameHostView | MountMinigameDisplayView,
  "climbIndex" | "climbsPerTurn" | "climbs" | "pointsSoFar"
>;

type Tracked = { climbIndex: number | null; pointsSoFar: number; hold: ClimbHold | null };

/**
 * What a change in the climb in hand means for the picture. The view moves its cursor the instant
 * the server has refereed a climb; the surfaces do not, so the room sees how it ended — and whose
 * tablet it is now — before the next hen is stood at the start.
 */
export const resolveClimbHold = (
  previous: Pick<Tracked, "climbIndex" | "pointsSoFar">,
  view: ClimbView,
  nowMs: number
): ClimbHold | null => {
  if (previous.climbIndex === null || view.climbIndex <= previous.climbIndex) {
    return null;
  }

  const ended = view.climbs[previous.climbIndex];

  if (ended === undefined || ended.status !== "done") {
    return null;
  }

  return {
    climbIndex: previous.climbIndex,
    outcome: ended.skipped ? "skipped" : (ended.result?.outcome ?? "timeout"),
    share: ended.result?.share ?? 0,
    points: Math.max(0, view.pointsSoFar - previous.pointsSoFar),
    kind: view.climbIndex >= view.climbsPerTurn ? "finish" : "handoff",
    startedAtMs: nowMs
  };
};

const HOLD_DURATION_MS: Record<ClimbHoldOutcome, number> = {
  mounted: MOUNT_BEAT_MS,
  timeout: STUCK_BEAT_MS,
  skipped: SKIP_BEAT_MS
};

/** The climb a surface should draw: the held one, else the one in hand (the last once the team is through). */
export const resolveShownClimbIndex = (view: Pick<ClimbView, "climbIndex" | "climbsPerTurn">, hold: ClimbHold | null): number => {
  return hold === null ? Math.max(0, Math.min(view.climbIndex, view.climbsPerTurn - 1)) : hold.climbIndex;
};

/**
 * The climb a surface should draw right now, and the hold it is in, if any (`useHeldBlock`'s
 * twin). Derived DURING the render that sees the cursor move, so no frame is ever committed with
 * the next climber drawn and no hold yet. A hold lasts the climb's beat plus the caller's slack
 * (the wall replays behind the tablet); a reset drops it at once.
 */
export const useHeldClimb = (view: ClimbView, slackMs = 0): { shownClimbIndex: number; hold: ClimbHold | null } => {
  const [tracked, setTracked] = useState<Tracked>({ climbIndex: null, pointsSoFar: 0, hold: null });
  let { hold } = tracked;

  if (tracked.climbIndex !== view.climbIndex) {
    const nextHold = resolveClimbHold(tracked, view, Date.now());

    if (nextHold !== null) {
      hold = nextHold;
    } else if (tracked.climbIndex !== null && view.climbIndex < tracked.climbIndex) {
      hold = null;
    }

    // React's derived-state pattern: this render is thrown away and re-run with the new state.
    setTracked({ climbIndex: view.climbIndex, pointsSoFar: view.pointsSoFar, hold });
  } else if (tracked.pointsSoFar !== view.pointsSoFar && hold === null) {
    setTracked({ ...tracked, pointsSoFar: view.pointsSoFar });
  }

  useEffect(() => {
    if (hold === null) {
      return undefined;
    }

    const handle = window.setTimeout(() => {
      setTracked((current) => (current.hold === hold ? { ...current, hold: null } : current));
    }, HOLD_DURATION_MS[hold.outcome] + slackMs);

    return (): void => {
      window.clearTimeout(handle);
    };
  }, [hold, slackMs]);

  return { shownClimbIndex: resolveShownClimbIndex(view, hold), hold };
};
