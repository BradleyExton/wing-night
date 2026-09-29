import { useEffect, useState } from "react";

import { resolveCountdownParts, teaserCountdownCopy } from "./copy";
import * as styles from "./styles";

type TeaserCountdownProps = {
  // The night's start as an ISO string, or null while the date is still to be set.
  startsAt: string | null;
};

const TICK_MS = 1000;

// The time to the night, in the show's scoreboard face: four tiles, days to seconds. Before a
// date is set it holds the same tiles with the date still to come, so the lobby's layout is the
// layout it will have.
export const TeaserCountdown = ({ startsAt }: TeaserCountdownProps): JSX.Element => {
  const [nowMs, setNowMs] = useState<number | null>(null);
  const startsAtMs = startsAt === null ? Number.NaN : Date.parse(startsAt);
  const isScheduled = Number.isFinite(startsAtMs);

  useEffect(() => {
    if (!isScheduled) {
      return undefined;
    }

    setNowMs(Date.now());
    const tick = window.setInterval(() => {
      setNowMs(Date.now());
    }, TICK_MS);

    return (): void => {
      window.clearInterval(tick);
    };
  }, [isScheduled]);

  const parts =
    isScheduled && nowMs !== null ? resolveCountdownParts(startsAtMs - nowMs) : null;

  return (
    <div className={styles.container}>
      <div className={styles.tiles}>
        {teaserCountdownCopy.units.map((unit) => (
          <div key={unit.key} className={styles.tile}>
            <span className={styles.value}>
              {parts === null ? teaserCountdownCopy.unsetValue : parts[unit.key]}
            </span>
            <span className={styles.unit}>{unit.label}</span>
          </div>
        ))}
      </div>
      <p className={styles.caption}>
        {isScheduled
          ? teaserCountdownCopy.scheduledCaption(startsAtMs)
          : teaserCountdownCopy.unsetCaption}
      </p>
    </div>
  );
};
