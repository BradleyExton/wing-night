import type { RoomState } from "@wingnight/shared";

import { displayBoardCopy } from "../../copy";
import * as styles from "./styles";

type EatingStageBodyProps = {
  currentRoundConfig: RoomState["currentRoundConfig"];
  activeTeamName: string | null;
  liveEatingRemainingSeconds: number;
  totalEatingSeconds: number | null;
};

const URGENT_THRESHOLD_SECONDS = 10;

export const EatingStageBody = ({
  currentRoundConfig,
  activeTeamName,
  liveEatingRemainingSeconds,
  totalEatingSeconds
}: EatingStageBodyProps): JSX.Element => {
  const isUrgent = liveEatingRemainingSeconds <= URGENT_THRESHOLD_SECONDS;
  const heatFillPercent =
    totalEatingSeconds !== null && totalEatingSeconds > 0
      ? Math.max(0, Math.min(100, (liveEatingRemainingSeconds / totalEatingSeconds) * 100))
      : 100;
  const timerLabelText =
    currentRoundConfig !== null
      ? displayBoardCopy.eatingPhaseLabel(currentRoundConfig.sauce)
      : displayBoardCopy.eatingPhaseFallbackLabel;

  return (
    <div className={styles.container}>
      <div className={styles.metaRow}>
        <div className={styles.metaCol}>
          {currentRoundConfig !== null && (
            <>
              <span className={styles.metaAccent}>
                {displayBoardCopy.roundChipLabel(currentRoundConfig.round)}
              </span>
              <span>
                {currentRoundConfig.label} · {currentRoundConfig.sauce}
              </span>
            </>
          )}
        </div>
        <div className={`${styles.metaCol} ${styles.metaColRight}`}>
          {activeTeamName !== null && (
            <>
              <span>{displayBoardCopy.eatingActiveTeamLabel}</span>
              <span className={styles.metaAccentTeam}>{activeTeamName}</span>
            </>
          )}
        </div>
      </div>
      <div className={styles.timerArea}>
        <p className={`${styles.timer} ${isUrgent ? styles.timerUrgent : ""}`.trim()}>
          {displayBoardCopy.eatingTimerValue(liveEatingRemainingSeconds)}
        </p>
        <p className={styles.timerLabel}>{timerLabelText}</p>
      </div>
      <div className={styles.heatTrack}>
        <div
          className={styles.heatFill}
          style={{ width: `${heatFillPercent}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
};
