import type { SpectatorBetReadoutView } from "../resolveSpectatorBetView";
import { spectatorBetReadoutCopy } from "./copy";
import * as styles from "./styles";

type SpectatorBetReadoutProps = {
  readout: SpectatorBetReadoutView;
};

// "OVER / UNDER 7.5 · 3 bets in": the turn's score line while the watchers' window is open. The
// caller places it; it carries the readout's type and nothing about where it sits.
export const SpectatorBetReadout = ({ readout }: SpectatorBetReadoutProps): JSX.Element => (
  <p className={styles.readout} data-spectator-bet-readout={readout.betCount}>
    <span>{spectatorBetReadoutCopy.label}</span>
    <span className={styles.figure}>{spectatorBetReadoutCopy.formatLine(readout.line)}</span>
    <span className={styles.separator} aria-hidden>
      {spectatorBetReadoutCopy.separator}
    </span>
    <span>{spectatorBetReadoutCopy.betCount(readout.betCount)}</span>
  </p>
);
