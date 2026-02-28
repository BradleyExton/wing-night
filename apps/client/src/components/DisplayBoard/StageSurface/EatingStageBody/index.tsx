import type { RoomState } from "@wingnight/shared";

import { displayBoardCopy } from "../../copy";
import { TurnMeta } from "../TurnMeta";
import * as styles from "./styles";

type EatingStageBodyProps = {
  phaseLabel: string;
  currentRoundConfig: RoomState["currentRoundConfig"];
  shouldRenderTeamTurnContext: boolean;
  activeTeamName: string | null;
  liveEatingRemainingSeconds: number;
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
