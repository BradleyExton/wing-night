import type { SpectatorBetSettlementView } from "../resolveSpectatorBetView";
import { spectatorBetSettlementCopy } from "./copy";
import * as styles from "./styles";

type SpectatorBetSettlementProps = {
  settlement: SpectatorBetSettlementView;
  // The body's own entrance classes, so the band arrives on the beat the body gives it.
  beatClassName: string;
};

const resolveCallersLine = (settlement: SpectatorBetSettlementView): JSX.Element | string => {
  if (settlement.outcome === "push") {
    return spectatorBetSettlementCopy.push;
  }

  if (settlement.callerNames.length === 0) {
    return spectatorBetSettlementCopy.nobody;
  }

  return (
    <>
      {spectatorBetSettlementCopy.calledItLabel}{" "}
      <span className={styles.callerNames}>{spectatorBetSettlementCopy.callers(settlement.callerNames)}</span>
    </>
  );
};

// The watchers' bet settled on the turn's results: the line, what the team scored, the side it
// fell, and who called it. The turn's results are a results screen, so its score may show here.
export const SpectatorBetSettlement = ({ settlement, beatClassName }: SpectatorBetSettlementProps): JSX.Element => (
  <>
    <div className={`${beatClassName} ${styles.band}`} data-spectator-bet-settlement={settlement.outcome}>
      <span className={styles.cell}>
        <span className={styles.label}>{spectatorBetSettlementCopy.lineLabel}</span>
        <span className={styles.value}>{spectatorBetSettlementCopy.formatLine(settlement.line)}</span>
      </span>
      <span className={styles.cell}>
        <span className={styles.label}>{spectatorBetSettlementCopy.scoredLabel}</span>
        <span className={styles.value}>{settlement.turnPoints}</span>
      </span>
      <span className={styles.cell}>
        <span className={styles.label}>{spectatorBetSettlementCopy.wentLabel}</span>
        <span className={styles.side}>{spectatorBetSettlementCopy.outcome(settlement.outcome)}</span>
      </span>
    </div>
    <p className={`${beatClassName} ${styles.callers}`} data-spectator-bet-callers>
      {resolveCallersLine(settlement)}
    </p>
  </>
);
