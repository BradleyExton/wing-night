import { SPECTATOR_BET_STATUSES, type SpectatorBets } from "@wingnight/shared";

import { spectatorBetCountCopy } from "./copy";
import * as styles from "./styles";

type SpectatorBetCountProps = {
  spectatorBets: SpectatorBets | null;
};

// How many watchers have called the turn, while their window is open. Nothing to press: a bet needs
// no host, and skip and undo already cover the turn it rides on.
export const SpectatorBetCount = ({ spectatorBets }: SpectatorBetCountProps): JSX.Element | null => {
  if (spectatorBets === null || spectatorBets.status !== SPECTATOR_BET_STATUSES.OPEN) {
    return null;
  }

  return (
    <p className={styles.pill} data-host-spectator-bets={spectatorBets.betCount}>
      <span className={styles.label}>{spectatorBetCountCopy.label}</span>
      <span>{spectatorBetCountCopy.line(spectatorBets.line)}</span>
      <span className={styles.separator} aria-hidden>
        {spectatorBetCountCopy.separator}
      </span>
      <span className={styles.count}>{spectatorBetCountCopy.count(spectatorBets.betCount)}</span>
    </p>
  );
};
