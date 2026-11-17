import { useEffect, useState } from "react";
import type { JoustAim } from "@wingnight/shared";

import { upCalloutCopy } from "./copy.js";
import * as styles from "./styles.js";

/** How long the callout holds on a fresh band before it gets out of the shooter's way. */
export const JOUST_UP_CALLOUT_MS = 2400;

// A band pulled further than this has been found: the shooter needs the lane, not their name.
const DRAWN_BAND_MAGNITUDE = 0.05;

type UpCalloutProps = {
  // Whoever has the band, or null when nobody does (the turn is over).
  shooterName: string | null;
  // Which shot it is: a new one calls the next shooter up, however the room got there.
  shotIndex: number;
  // Only while aiming, and only on a slack band: a drawn one means they have found it already.
  isAiming: boolean;
  aim: JoustAim;
  surface: "display" | "host";
};

/**
 * "Sara — up now", dropped over the lane the moment the next shooter is called up: the walk-off
 * and the line stepping up say it in the scene, this says it in words. Client-only and keyed on
 * the shot, like FAPPY's handoff beat: a screen that joins mid-band shows it once and lets it go.
 */
export const UpCallout = ({
  shooterName,
  shotIndex,
  isAiming,
  aim,
  surface
}: UpCalloutProps): JSX.Element | null => {
  const [expiredShotIndex, setExpiredShotIndex] = useState<number | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setExpiredShotIndex(shotIndex);
    }, JOUST_UP_CALLOUT_MS);

    return (): void => {
      window.clearTimeout(handle);
    };
  }, [shotIndex]);

  const isBandDrawn = Math.hypot(aim.x, aim.y) > DRAWN_BAND_MAGNITUDE;

  if (!isAiming || isBandDrawn || shooterName === null || expiredShotIndex === shotIndex) {
    return null;
  }

  return surface === "display" ? (
    <div className={styles.displayOverlay} data-joust-up-callout="display">
      <div className={styles.displayCard}>
        <span className={styles.displayName}>{shooterName}</span>
        <span className={styles.displayLine}>{upCalloutCopy.line}</span>
      </div>
    </div>
  ) : (
    <div className={styles.hostOverlay} data-joust-up-callout="host">
      <span className={styles.hostLead}>{upCalloutCopy.lead}</span>
      <span className={styles.hostName}>{shooterName}</span>
    </div>
  );
};
