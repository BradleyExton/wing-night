import { playerClaimBadgeCopy } from "./copy";
import * as styles from "./styles";

type PlayerClaimBadgeProps = {
  playerName: string;
  isConnected: boolean;
  releaseDisabled: boolean;
  onRelease: () => void;
};

// Shown on a player's row only once a phone has claimed their face.
export const PlayerClaimBadge = ({
  playerName,
  isConnected,
  releaseDisabled,
  onRelease
}: PlayerClaimBadgeProps): JSX.Element => {
  return (
    <span className={styles.root} data-player-claim={isConnected ? "connected" : "asleep"}>
      <span
        className={isConnected ? styles.pillConnected : styles.pillAsleep}
        role="status"
        aria-label={playerClaimBadgeCopy.statusLabel(playerName, isConnected)}
      >
        <span className={isConnected ? styles.dotConnected : styles.dotAsleep} aria-hidden />
        {isConnected ? playerClaimBadgeCopy.connected : playerClaimBadgeCopy.asleep}
      </span>
      <button
        type="button"
        className={styles.release}
        disabled={releaseDisabled}
        aria-label={playerClaimBadgeCopy.releaseLabel(playerName)}
        onClick={onRelease}
      >
        {playerClaimBadgeCopy.release}
      </button>
    </span>
  );
};
