import { hostControlPanelCopy } from "../../../HostControlPanel/copy";
import type { MinigameHostRendererProps } from "../../types";
import { hostTriviaSurfaceCopy } from "./copy";
import * as styles from "./styles";

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
      hostControlPanelCopy.noAssignedTeamLabel
    );
  }

  return activeTeamName ?? hostControlPanelCopy.noAssignedTeamLabel;
};

export const HostTriviaSurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  triviaAttemptDisabled,
  onRecordTriviaAttempt
}: MinigameHostRendererProps): JSX.Element => {
  const resolvedActiveTeamName = resolveActiveTeamName({
    minigameHostView,
    teamNameByTeamId,
    activeTeamName
  });
  const isPlayPhase = phase === "play";
  const currentPrompt = minigameHostView?.currentPrompt ?? null;
  const attemptsRemaining = minigameHostView?.attemptsRemaining ?? 0;
  const attemptsExhausted = attemptsRemaining <= 0;
  const disableAttemptButtons =
    !isPlayPhase ||
    triviaAttemptDisabled ||
    attemptsExhausted ||
    currentPrompt === null;

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
            <p className={styles.metaLabel}>{hostControlPanelCopy.activeRoundTeamTitle}</p>
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
              onRecordTriviaAttempt(true);
            }}
          >
            {hostTriviaSurfaceCopy.correctButtonLabel}
          </button>
          <button
            className={styles.actionButton}
            type="button"
            disabled={disableAttemptButtons}
            onClick={(): void => {
              onRecordTriviaAttempt(false);
            }}
          >
            {hostTriviaSurfaceCopy.incorrectButtonLabel}
          </button>
        </div>
      )}
    </div>
  );
};
