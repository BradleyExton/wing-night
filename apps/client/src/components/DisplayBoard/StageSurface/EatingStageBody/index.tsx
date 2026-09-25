import type { RoomState, TeamTheme } from "@wingnight/shared";

import { TeamWordmark } from "../../../TeamWordmark";

import { isTimerTimeUp, isTimerUrgent } from "../../../../utils/timerUrgency";
import { displayBoardCopy } from "../../copy";
import * as styles from "./styles";

type EatingStageBodyProps = {
  currentRoundConfig: RoomState["currentRoundConfig"];
  activeTeamName: string | null;
  // The team on the wings, in its own genre face — the name the whole room
  // has to see while the clock runs (docs/team-identity.md).
  activeTeamTheme: TeamTheme | null;
  liveEatingRemainingSeconds: number;
  totalEatingSeconds: number | null;
};

export const EatingStageBody = ({
  currentRoundConfig,
  activeTeamName,
  activeTeamTheme,
  liveEatingRemainingSeconds,
  totalEatingSeconds
}: EatingStageBodyProps): JSX.Element => {
  const isUrgent = isTimerUrgent(liveEatingRemainingSeconds);
  const isTimeUp = isTimerTimeUp(liveEatingRemainingSeconds);
  const heatFillPercent =
    totalEatingSeconds !== null && totalEatingSeconds > 0
      ? Math.max(0, Math.min(100, (liveEatingRemainingSeconds / totalEatingSeconds) * 100))
      : 100;
  const timerLabelText = isTimeUp
    ? displayBoardCopy.eatingTimesUpLabel
    : currentRoundConfig !== null
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
                {displayBoardCopy.roundLabelSauceSummary(
                  currentRoundConfig.label,
                  currentRoundConfig.sauce
                )}
              </span>
            </>
          )}
        </div>
        <div className={`${styles.metaCol} ${styles.metaColRight}`}>
          {activeTeamName !== null && (
            <>
              <span>{displayBoardCopy.eatingActiveTeamLabel}</span>
              {activeTeamTheme !== null ? (
                <TeamWordmark
                  name={activeTeamName}
                  theme={activeTeamTheme}
                  sizeClassName={styles.teamWordmark}
                />
              ) : (
                <span className={styles.metaAccentTeam}>{activeTeamName}</span>
              )}
            </>
          )}
        </div>
      </div>
      <div className={styles.timerArea}>
        <p className={`${styles.timer} ${isUrgent ? styles.timerUrgent : ""}`.trim()}>
          {displayBoardCopy.eatingTimerValue(liveEatingRemainingSeconds)}
        </p>
        <p className={isTimeUp ? styles.timerLabelTimeUp : styles.timerLabel}>
          {timerLabelText}
        </p>
      </div>
      <div className={styles.heatTrack}>
        <div
          className={styles.heatFill}
          ref={styles.applyHeatFillWidth(heatFillPercent)}
          aria-hidden
        />
      </div>
    </div>
  );
};
