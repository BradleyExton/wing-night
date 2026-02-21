import type { DisplayRoomStateSnapshot } from "@wingnight/shared";

import { displayBoardCopy } from "../../copy";
import * as styles from "./styles";

type MinigameStageBodyProps = {
  phaseLabel: string;
  currentRoundConfig: DisplayRoomStateSnapshot["currentRoundConfig"];
  shouldRenderTeamTurnContext: boolean;
  activeTeamName: string | null;
  isTriviaTurnPhase: boolean;
  shouldRenderTriviaPrompt: boolean;
  currentTriviaQuestion: string | null;
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

export const MinigameStageBody = ({
  phaseLabel,
  currentRoundConfig,
  shouldRenderTeamTurnContext,
  activeTeamName,
  isTriviaTurnPhase,
  shouldRenderTriviaPrompt,
  currentTriviaQuestion
}: MinigameStageBodyProps): JSX.Element => {
  return (
    <>
      <h2 className={styles.title}>{displayBoardCopy.phaseContextTitle(phaseLabel)}</h2>
      <p className={styles.fallbackText}>
        {currentRoundConfig
          ? displayBoardCopy.roundMinigameSummary(currentRoundConfig.minigame)
          : displayBoardCopy.roundFallbackLabel}
      </p>
      {shouldRenderTeamTurnContext && activeTeamName !== null && (
        <TurnMeta activeTeamName={activeTeamName} />
      )}
      {shouldRenderTriviaPrompt && currentTriviaQuestion !== null && (
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <p className={styles.metaLabel}>{displayBoardCopy.triviaQuestionLabel}</p>
            <p className={styles.metaValue}>{currentTriviaQuestion}</p>
          </div>
        </div>
      )}
      {isTriviaTurnPhase && !shouldRenderTriviaPrompt && (
        <p className={styles.fallbackText}>{displayBoardCopy.triviaTurnTitle}</p>
      )}
    </>
  );
};
