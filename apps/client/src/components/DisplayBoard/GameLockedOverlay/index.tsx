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
    <div className={styles.overlay}>
      <section className={styles.panel} aria-live={isCountdownVisible ? "polite" : undefined}>
        <p className={styles.brand}>{gameLockedOverlayCopy.brandLabel}</p>
        <h2 className={styles.title}>{gameLockedOverlayCopy.title}</h2>
        <p className={styles.description}>
          {isCountdownVisible
            ? gameLockedOverlayCopy.countdownDescription
            : gameLockedOverlayCopy.lockedDescription}
        </p>
        {isCountdownVisible && (
          <div className={styles.countdownStack}>
            <p className={styles.countdownLabel}>
              {gameLockedOverlayCopy.countdownLabel}
            </p>
            <p className={styles.countValue}>
              {gameLockedOverlayCopy.countLabel(remainingSeconds)}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
