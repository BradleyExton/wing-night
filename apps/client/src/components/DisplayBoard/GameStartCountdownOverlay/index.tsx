import { gameStartCountdownOverlayCopy } from "./copy";
import * as styles from "./styles";

type GameStartCountdownOverlayProps = {
  remainingSeconds: number;
};

export const GameStartCountdownOverlay = ({
  remainingSeconds
}: GameStartCountdownOverlayProps): JSX.Element => {
  return (
    <div className={styles.overlay} aria-live="polite" aria-atomic>
      <section className={styles.countdownCard}>
        <p className={styles.kicker}>{gameStartCountdownOverlayCopy.kickerLabel}</p>
        <p className={styles.countValue}>
          {gameStartCountdownOverlayCopy.countLabel(remainingSeconds)}
        </p>
        <p className={styles.readyLabel}>
          {gameStartCountdownOverlayCopy.roundIntroReadyLabel}
        </p>
      </section>
    </div>
  );
};
