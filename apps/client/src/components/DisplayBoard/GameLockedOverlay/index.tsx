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
          <Lock aria-hidden />
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
            <p className={styles.countdownNumber}>
              {gameLockedOverlayCopy.formatCountdownNumber(remainingSeconds)}
            </p>
          </div>
          <p className={styles.countdownLine}>
            <span className={styles.countdownLineLabel}>
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
