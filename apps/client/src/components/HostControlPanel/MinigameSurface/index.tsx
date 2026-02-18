import { type MinigameHostView } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type MinigameSurfaceProps = {
  minigameHostView: MinigameHostView | null;
  teamNameByTeamId: Map<string, string>;
  triviaAttemptDisabled: boolean;
  onRecordTriviaAttempt: (isCorrect: boolean) => void;
};

const resolveActiveTeamName = (
  minigameHostView: MinigameHostView,
  teamNameByTeamId: Map<string, string>
): string => {
  if (minigameHostView.activeTurnTeamId === null) {
    return hostControlPanelCopy.noAssignedTeamLabel;
  }

  return (
    teamNameByTeamId.get(minigameHostView.activeTurnTeamId) ??
    hostControlPanelCopy.noAssignedTeamLabel
  );
};

export const MinigameSurface = ({
  minigameHostView,
  teamNameByTeamId,
  triviaAttemptDisabled,
  onRecordTriviaAttempt
}: MinigameSurfaceProps): JSX.Element => {
  if (minigameHostView === null || minigameHostView.minigame !== "TRIVIA") {
    return (
      <section className={styles.card}>
        <h2 className={styles.sectionHeading}>{hostControlPanelCopy.minigameSectionTitle}</h2>
        <p className={styles.sectionDescription}>
          {hostControlPanelCopy.waitingStateLabel}
        </p>
      </section>
    );
  }

  const activeTurnTeamName = resolveActiveTeamName(minigameHostView, teamNameByTeamId);

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionHeading}>{hostControlPanelCopy.minigameSectionTitle}</h2>
      <p className={styles.sectionDescription}>
        {hostControlPanelCopy.triviaSectionDescription}
      </p>
      <div className={styles.triviaMeta}>
        <div>
          <p className={styles.triviaLabel}>
            {hostControlPanelCopy.triviaActiveTeamLabel(activeTurnTeamName)}
          </p>
        </div>
        {minigameHostView.currentPrompt && (
          <>
            <div>
              <p className={styles.triviaLabel}>
                {hostControlPanelCopy.triviaQuestionLabel}
              </p>
              <p className={styles.triviaValue}>{minigameHostView.currentPrompt.question}</p>
            </div>
            <div>
              <p className={styles.triviaLabel}>
                {hostControlPanelCopy.triviaAnswerLabel}
              </p>
              <p className={styles.triviaValue}>{minigameHostView.currentPrompt.answer}</p>
            </div>
          </>
        )}
      </div>
      <div className={styles.triviaActions}>
        <button
          className={styles.actionButton}
          type="button"
          disabled={triviaAttemptDisabled}
          onClick={(): void => {
            onRecordTriviaAttempt(true);
          }}
        >
          {hostControlPanelCopy.triviaCorrectButtonLabel}
        </button>
        <button
          className={styles.actionButton}
          type="button"
          disabled={triviaAttemptDisabled}
          onClick={(): void => {
            onRecordTriviaAttempt(false);
          }}
        >
          {hostControlPanelCopy.triviaIncorrectButtonLabel}
        </button>
      </div>
    </section>
  );
};
