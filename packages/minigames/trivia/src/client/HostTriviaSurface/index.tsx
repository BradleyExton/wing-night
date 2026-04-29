import type { MinigameHostRendererProps } from "@wingnight/minigames-core";

import { hostTriviaSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const resolveActiveTeamName = ({
  minigameHostView,
  teamNameByTeamId,
  activeTeamName
}: Pick<
  MinigameHostRendererProps,
  "minigameHostView" | "teamNameByTeamId" | "activeTeamName"
>): string => {
  if (minigameHostView?.activeTurnTeamId) {
    return (
      teamNameByTeamId.get(minigameHostView.activeTurnTeamId) ??
      hostTriviaSurfaceCopy.noAssignedTeamLabel
    );
  }

  return activeTeamName ?? hostTriviaSurfaceCopy.noAssignedTeamLabel;
};

export const HostTriviaSurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  canDispatchAction,
  onDispatchAction
}: MinigameHostRendererProps): JSX.Element => {
  const triviaHostView = minigameHostView?.minigame === "TRIVIA" ? minigameHostView : null;
  const resolvedActiveTeamName = resolveActiveTeamName({
    minigameHostView,
    teamNameByTeamId,
    activeTeamName
  });
  const isPlayPhase = phase === "play";
  const currentPrompt = triviaHostView?.currentPrompt ?? null;
  const attemptsRemaining = triviaHostView?.attemptsRemaining ?? 0;
  const attemptsExhausted = attemptsRemaining <= 0;
  const disableAttemptButtons =
    !isPlayPhase || !canDispatchAction || attemptsExhausted || currentPrompt === null;
  const shouldRenderQuestionsLeft = isPlayPhase && currentPrompt !== null;

  return (
    <div className={styles.container}>
      <div>
        <p className={styles.description}>
          {isPlayPhase
            ? hostTriviaSurfaceCopy.playDescription
            : hostTriviaSurfaceCopy.introDescription}
        </p>
        <div className={styles.meta}>
          <div className={styles.metaBlock}>
            <p className={styles.metaLabel}>{hostTriviaSurfaceCopy.activeTeamMetaLabel}</p>
            <p className={styles.metaValue}>{resolvedActiveTeamName}</p>
          </div>
          {shouldRenderQuestionsLeft && (
            <div className={styles.metaBlock}>
              <p className={styles.metaLabel}>
                {hostTriviaSurfaceCopy.questionsLeftMetaLabel}
              </p>
              <p className={styles.metaValue}>
                {hostTriviaSurfaceCopy.questionsLeftLabel(attemptsRemaining)}
              </p>
            </div>
          )}
        </div>
      </div>
      {currentPrompt !== null ? (
        <div className={styles.promptShell}>
          <div className={styles.promptSection}>
            <p className={styles.promptLabel}>{hostTriviaSurfaceCopy.questionLabel}</p>
            <p className={styles.promptValue}>{currentPrompt.question}</p>
          </div>
          <div className={styles.answerSection}>
            <p className={styles.answerLabel}>{hostTriviaSurfaceCopy.answerLabel}</p>
            <p className={styles.answerValue}>{currentPrompt.answer}</p>
          </div>
        </div>
      ) : (
        <p className={styles.statusNote}>{hostTriviaSurfaceCopy.waitingPromptLabel}</p>
      )}
      {isPlayPhase && attemptsExhausted && (
        <p className={styles.statusNote}>{hostTriviaSurfaceCopy.turnCompleteLabel}</p>
      )}
      {isPlayPhase && (
        <div className={styles.actions}>
          <button
            className={styles.correctButton}
            type="button"
            disabled={disableAttemptButtons}
            onClick={(): void => {
              onDispatchAction("recordAttempt", { isCorrect: true });
            }}
          >
            {hostTriviaSurfaceCopy.correctButtonLabel}
          </button>
          <button
            className={styles.incorrectButton}
            type="button"
            disabled={disableAttemptButtons}
            onClick={(): void => {
              onDispatchAction("recordAttempt", { isCorrect: false });
            }}
          >
            {hostTriviaSurfaceCopy.incorrectButtonLabel}
          </button>
        </div>
      )}
    </div>
  );
};
