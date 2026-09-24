import type { FappyMinigameHostView } from "@wingnight/shared";

import { resolveLivePoints } from "../../pressure/index.js";
import { formatRelayClockSeconds } from "../../useRelayClock/index.js";
import { pointsMeterCopy } from "./copy.js";
import * as styles from "./styles.js";

// What the relay is worth if it ended on this tick. The host had the clock and
// the round's par but no way to turn one into the other, so "are we still fine?"
// was a question the tablet could not answer — this is that answer, next to the
// clock it is spending. Nothing while the relay is over: the finish card's
// number is the real one by then, and two point totals on one screen is one too
// many.
export const PointsMeter = ({
  view,
  elapsedMs
}: {
  view: FappyMinigameHostView;
  elapsedMs: number | null;
}): JSX.Element | null => {
  const livePoints = resolveLivePoints(view, elapsedMs);

  if (livePoints === null) {
    return null;
  }

  return (
    <span className={styles.container} data-fappy-live-points={livePoints}>
      <span
        className={`${styles.points}${livePoints < view.pointsMax ? ` ${styles.pointsDraining}` : ""}`}
      >
        {pointsMeterCopy.livePoints(livePoints)}
      </span>
      <span className={styles.parHint}>
        {pointsMeterCopy.parHint(formatRelayClockSeconds(view.parSeconds * 1000))}
      </span>
    </span>
  );
};
