import type { RoomState } from "@wingnight/shared";

import { displayBoardCopy } from "../../copy";
import * as styles from "./styles";

type EatingStageBodyProps = {
  phaseLabel: string;
  currentRoundConfig: RoomState["currentRoundConfig"];
  shouldRenderTeamTurnContext: boolean;
  activeTeamName: string | null;
  liveEatingRemainingSeconds: number;
};

type TurnMetaProps = {
  activeTeamName: string;
};

const TurnMeta = ({ activeTeamName }: TurnMetaProps): JSX.Element => {
  return (
    <div className={styles.turnMeta}>
      <p className={styles.turnLabel}>{displayBoardCopy.activeTeamLabel}</p>
      <p className={styles.turnValue}>{displayBoardCopy.activeTeamValue(activeTeamName)}</p>
    </div>
  );
};

export const EatingStageBody = ({
  phaseLabel,
  currentRoundConfig,
  shouldRenderTeamTurnContext,
  activeTeamName,
  liveEatingRemainingSeconds
}: EatingStageBodyProps): JSX.Element => {
  return (
    <>
      <h2 className={styles.title}>{displayBoardCopy.phaseContextTitle(phaseLabel)}</h2>
      <p className={styles.fallbackText}>
        {currentRoundConfig
          ? displayBoardCopy.roundSauceSummary(currentRoundConfig.sauce)
          : displayBoardCopy.roundFallbackLabel}
      </p>
      {shouldRenderTeamTurnContext && activeTeamName !== null && (
        <TurnMeta activeTeamName={activeTeamName} />
      )}
      <div className={styles.timerWrap}>
        <p className={styles.timerLabel}>{displayBoardCopy.eatingTimerLabel}</p>
        <p className={styles.timerValue}>
          {displayBoardCopy.eatingTimerValue(liveEatingRemainingSeconds)}
        </p>
      </div>
    </>
  );
};
