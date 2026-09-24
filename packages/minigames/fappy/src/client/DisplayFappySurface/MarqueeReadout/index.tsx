import type { FappyMinigameDisplayView } from "@wingnight/shared";

import { resolveLivePoints, resolveRelayChase } from "../../pressure/index.js";
import { formatRelayClock, formatRelayClockSeconds } from "../../useRelayClock/index.js";
import { marqueeReadoutCopy } from "./copy.js";
import * as styles from "./styles.js";

// The clock turns to heat with this much of the limit left.
const URGENT_REMAINING_MS = 15_000;

type MarqueeReadoutProps = {
  view: FappyMinigameDisplayView;
  // Which leg the WALL is showing, which lags the relay through a handoff.
  shownLegIndex: number;
  // The wall clock, ticking; every live cue is timed against it.
  elapsedMs: number | null;
  // What the relay scored, once it has: the wall plus the skip penalty.
  shownElapsedMs: number | null;
  isOver: boolean;
};

// The four things the room reads off the sign while a relay runs: which leg,
// how many gates, the clock — and, new with the pressure pass, what the clock
// is SPENDING. A clock with no price on it is just a number going up; the stake
// beside it is what makes the last ten seconds feel like the last ten seconds.
export const MarqueeReadout = ({
  view,
  shownLegIndex,
  elapsedMs,
  shownElapsedMs,
  isOver
}: MarqueeReadoutProps): JSX.Element => {
  const remainingMs = view.limitSeconds * 1000 - (elapsedMs ?? 0);
  const clockClassName =
    elapsedMs !== null && !isOver && remainingMs <= URGENT_REMAINING_MS
      ? styles.marqueeClockUrgent
      : shownElapsedMs !== null && shownElapsedMs > view.parSeconds * 1000
        ? styles.marqueeClockPastPar
        : "";
  const livePoints = resolveLivePoints(view, elapsedMs);
  const chase = resolveRelayChase(view);

  return (
    <>
      <span className={styles.marqueeLeg}>
        {marqueeReadoutCopy.legCounter(shownLegIndex + 1, view.legsPerTurn)}
      </span>
      <span className={styles.marqueeGates}>
        {marqueeReadoutCopy.gatesCounter(
          view.totalGatesCleared,
          view.legsPerTurn * view.gatesPerLeg
        )}
      </span>
      {/* The relay clock is the LEG's and FAPPY's own; the shell's `clock` and
          `clockLine` are the room's, and FAPPY is `timerKey: null` so they draw
          nothing and cost nothing. */}
      <span className={`${styles.marqueeClock} ${clockClassName}`} data-fappy-clock>
        {shownElapsedMs === null
          ? marqueeReadoutCopy.clockIdle
          : formatRelayClock(shownElapsedMs)}
      </span>
      {/* The stake: what the relay is worth on this tick. It sits at the round's
          max with par under it as the line it is protecting, then drains a point
          at a time. Once the relay is over the plaque's number is the real one,
          so this stands down rather than showing a second total. */}
      {livePoints !== null && (
        <span className={styles.marqueePointsCell}>
          <span
            className={`${styles.marqueePoints}${
              livePoints < view.pointsMax ? ` ${styles.marqueePointsDraining}` : ""
            }`}
            data-fappy-live-points={livePoints}
          >
            {marqueeReadoutCopy.livePoints(livePoints)}
          </span>
          <span className={styles.marqueeParHint}>
            {marqueeReadoutCopy.parHint(formatRelayClockSeconds(view.parSeconds * 1000))}
          </span>
        </span>
      )}
      {chase !== null && !isOver && (
        <span className={styles.marqueeBeat} data-fappy-time-to-beat>
          {chase.timeToBeatMs === null
            ? marqueeReadoutCopy.beatPar
            : marqueeReadoutCopy.timeToBeat(formatRelayClockSeconds(chase.timeToBeatMs))}
        </span>
      )}
    </>
  );
};
