import type { MinigameHostRendererProps } from "@wingnight/minigames-core";

import { hostTriviaSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const NO_ASSIGNED_TEAM_LABEL = "No assigned team";

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
      NO_ASSIGNED_TEAM_LABEL
    );
  }

  return activeTeamName ?? NO_ASSIGNED_TEAM_LABEL;
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
            <p className={styles.metaLabel}>Active Team</p>
            <p className={styles.metaValue}>
              {hostTriviaSurfaceCopy.activeTeamLabel(resolvedActiveTeamName)}
            </p>
          </div>
          {currentPrompt !== null && (
            <>
              <div className={styles.metaBlock}>
                <p className={styles.metaLabel}>{hostTriviaSurfaceCopy.questionLabel}</p>
                <p className={styles.metaValue}>{currentPrompt.question}</p>
              </div>
              <div className={styles.metaBlock}>
                <p className={styles.metaLabel}>{hostTriviaSurfaceCopy.answerLabel}</p>
                <p className={styles.metaValue}>{currentPrompt.answer}</p>
              </div>
            </>
          )}
        </div>
      </div>
      {isPlayPhase && (
        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            type="button"
            disabled={disableAttemptButtons}
            onClick={(): void => {
              onDispatchAction("recordAttempt", { isCorrect: true });
            }}
          >
            {hostTriviaSurfaceCopy.correctButtonLabel}
          </button>
          <button
            className={styles.actionButton}
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
