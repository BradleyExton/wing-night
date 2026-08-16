import { Lock } from "lucide-react";

import { gameLockedOverlayCopy } from "./copy";
import * as styles from "./styles";

type GameLockedOverlayProps = {
  remainingSeconds: number | null;
};

export const GameLockedOverlay = ({
  remainingSeconds
}: GameLockedOverlayProps): JSX.Element => {
  const isCountdownVisible = remainingSeconds !== null;

  return (
    <div className={styles.overlay} aria-live={isCountdownVisible ? "polite" : undefined}>
      <div className={styles.lockFrame}>
        <span className={styles.lockIcon}>
          <Lock className={styles.lockIconSvg} aria-hidden />
        </span>
      </div>
      <h2 className={styles.heading}>
        {gameLockedOverlayCopy.headingLead}{" "}
        <span className={styles.headingAccent}>
          {gameLockedOverlayCopy.headingAccent}
        </span>
      </h2>
      {isCountdownVisible ? (
        <>
          <div className={styles.ringFrame}>
            {/* Stable hook for the e2e frame-sequence capture: the standings
                surface renders bare team scores alongside this overlay, so a
                text selector for a lone digit is ambiguous. */}
            <p className={styles.countdownNumber} data-countdown-value>
              {gameLockedOverlayCopy.formatCountdownNumber(remainingSeconds)}
            </p>
          </div>
          <p className={styles.countdownLine}>
            <span className={styles.countdownLineLabel} data-countdown-label>
              {gameLockedOverlayCopy.countdownPrefix}
            </span>
            {gameLockedOverlayCopy.formatCountdownWord(remainingSeconds)}
          </p>
        </>
      ) : (
        <p className={styles.readyLabel}>{gameLockedOverlayCopy.readyLabel}</p>
      )}
    </div>
  );
};
