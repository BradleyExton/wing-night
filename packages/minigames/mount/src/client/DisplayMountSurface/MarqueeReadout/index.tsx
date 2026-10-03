import type { RefObject } from "react";
import { resolveMountClimbTicks, type MountMinigameDisplayView } from "@wingnight/shared";

import { formatClimbClock } from "../../climbClock/index.js";
import { marqueeReadoutCopy } from "./copy.js";
import * as styles from "./styles.js";

type MarqueeReadoutProps = {
  view: MountMinigameDisplayView;
  /** The climb the WALL is showing, which lags the tablet through a handoff. */
  shownClimbIndex: number;
  holderName: string;
  /** Written by the mirror's paint loop, sixty times a second. */
  clockRef: RefObject<HTMLSpanElement>;
};

// What the room reads off the sign while a climb is on (spec §0.5): the climb and whose hands, the
// climb's clock (the replay's, written every frame), the line's holder and its height, and the
// points the turn has banked so far.
export const MarqueeReadout = ({ view, shownClimbIndex, holderName, clockRef }: MarqueeReadoutProps): JSX.Element => {
  const isFinished = view.phase === "finished";
  const climb = view.climbs[shownClimbIndex] ?? null;
  const playerName = climb?.player?.name ?? null;
  const startingTicks = climb?.climbTicks ?? resolveMountClimbTicks(view.rules, view.pile.hens.length);

  return (
    <>
      <span>
        {marqueeReadoutCopy.climbCounter(shownClimbIndex + 1, view.climbsPerTurn)}
        {playerName !== null && !isFinished && (
          <>
            {marqueeReadoutCopy.climbNameSeparator}
            <span className={styles.climbName} data-mount-climb-name>
              {playerName}
            </span>
          </>
        )}
      </span>
      {!isFinished && (
        <>
          <span ref={clockRef} className={styles.clock} data-mount-clock={startingTicks} data-last-ten="false">
            {formatClimbClock(startingTicks)}
          </span>
          <span>{marqueeReadoutCopy.clockLabel}</span>
        </>
      )}
      <span className={styles.lineHolder} data-mount-line-chip>
        {marqueeReadoutCopy.lineHolder(holderName)}
      </span>
      <span>
        {marqueeReadoutCopy.lineLabel}
        {marqueeReadoutCopy.climbNameSeparator}
        <span className={styles.lineHeight}>{marqueeReadoutCopy.lineHeight(view.pile.highLine.height)}</span>
      </span>
      <span className={styles.points} data-mount-points={view.pointsSoFar}>
        {marqueeReadoutCopy.points(view.pointsSoFar)}
      </span>
      <span>{marqueeReadoutCopy.pointsLabel}</span>
    </>
  );
};
