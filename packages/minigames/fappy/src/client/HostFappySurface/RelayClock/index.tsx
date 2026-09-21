import type { FappyMinigameHostView } from "@wingnight/shared";

import { formatRelayClock } from "../../useRelayClock/index.js";
import { relayClockCopy } from "./copy.js";
import * as styles from "./styles.js";

// The clock turns to heat with this much of the limit left.
const URGENT_REMAINING_MS = 15_000;

export const RelayClock = ({
  view,
  elapsedMs
}: {
  view: FappyMinigameHostView;
  elapsedMs: number | null;
}): JSX.Element => {
  const remainingMs = view.limitSeconds * 1000 - (elapsedMs ?? 0);
  const clockClassName =
    elapsedMs !== null && remainingMs <= URGENT_REMAINING_MS
      ? styles.containerUrgent
      : elapsedMs !== null && elapsedMs > view.parSeconds * 1000
        ? styles.containerPastPar
        : "";

  return (
    <span className={`${styles.container} ${clockClassName}`} data-fappy-clock>
      {elapsedMs === null ? relayClockCopy.idle : formatRelayClock(elapsedMs)}
      <span className={styles.limit}>{relayClockCopy.limit(view.limitSeconds)}</span>
    </span>
  );
};
