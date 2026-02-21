import { displayBoardCopy } from "../../../components/DisplayBoard/copy";
import type { DisplayTakeoverRendererProps } from "../../registry";
import * as styles from "./styles";

const resolveFallbackMessage = (
  roomState: DisplayTakeoverRendererProps["roomState"]
): string => {
  return roomState !== null
    ? displayBoardCopy.roundFallbackLabel
    : displayBoardCopy.waitingForStateLabel;
};

export const DisplayTakeoverRenderer = ({
  roomState,
  phaseLabel,
  isMinigamePlayPhase,
  minigameId,
  activeTeamName
}: DisplayTakeoverRendererProps): JSX.Element => {
  const currentTriviaQuestion =
    roomState?.minigameDisplayView?.minigame === "TRIVIA"
      ? (roomState.minigameDisplayView.currentPrompt?.question ?? null)
      : null;
  const fallbackMessage = resolveFallbackMessage(roomState);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.phaseBadge}>{phaseLabel}</p>
        <h1 className={styles.heading}>{displayBoardCopy.minigameSectionTitle}</h1>
        <p className={styles.subtext}>{displayBoardCopy.minigameIntroDescription(minigameId)}</p>
      </header>

      <section className={styles.body}>
        {activeTeamName !== null && (
          <div className={styles.contextCard}>
            <p className={styles.contextLabel}>{displayBoardCopy.activeTeamLabel}</p>
            <p className={styles.contextValue}>
              {displayBoardCopy.activeTeamValue(activeTeamName)}
            </p>
          </div>
        )}

        {isMinigamePlayPhase ? (
          currentTriviaQuestion !== null ? (
            <div className={styles.questionCard}>
              <p className={styles.questionLabel}>{displayBoardCopy.triviaQuestionLabel}</p>
              <p className={styles.questionValue}>{currentTriviaQuestion}</p>
            </div>
          ) : (
            <p className={styles.fallbackText}>{fallbackMessage}</p>
          )
        ) : (
          <p className={styles.fallbackText}>
            {displayBoardCopy.roundMinigameSummary(minigameId)}
          </p>
        )}
      </section>
    </div>
  );
};
