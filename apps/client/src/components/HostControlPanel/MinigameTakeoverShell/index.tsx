import { type MinigameHostView, type MinigameType } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import { MinigameSurface } from "../MinigameSurface";
import * as styles from "./styles";

type MinigameTakeoverShellProps = {
  hostMode: "minigame_intro" | "minigame_play";
  minigameHostView: MinigameHostView | null;
  activeRoundTeamName: string;
  teamNameByTeamId: Map<string, string>;
  triviaAttemptDisabled: boolean;
  onRecordTriviaAttempt: (isCorrect: boolean) => void;
};

const resolveMinigameLabel = (
  minigameHostView: MinigameHostView | null
): MinigameType => {
  return minigameHostView?.minigame ?? hostControlPanelCopy.minigameFallbackType;
};

const resolveCompatibilityMismatchMessage = (
  minigameHostView: MinigameHostView | null
): string | null => {
  if (minigameHostView?.compatibilityStatus !== "MISMATCH") {
    return null;
  }

  return (
    minigameHostView.compatibilityMessage ??
    hostControlPanelCopy.minigameContractMismatchFallbackLabel
  );
};

export const MinigameTakeoverShell = ({
  hostMode,
  minigameHostView,
  activeRoundTeamName,
  teamNameByTeamId,
  triviaAttemptDisabled,
  onRecordTriviaAttempt
}: MinigameTakeoverShellProps): JSX.Element => {
  const minigameLabel = resolveMinigameLabel(minigameHostView);
  const compatibilityMismatchMessage = resolveCompatibilityMismatchMessage(minigameHostView);

  if (hostMode === "minigame_intro") {
    return (
      <section className={styles.container} data-host-minigame-takeover="intro">
        <div className={styles.introBody}>
          <h2 className={styles.heading}>{hostControlPanelCopy.minigameSectionTitle}</h2>
          <p className={styles.description}>
            {hostControlPanelCopy.minigameIntroDescription(minigameLabel)}
          </p>
          {compatibilityMismatchMessage !== null && (
            <p className={styles.mismatchMessage}>{compatibilityMismatchMessage}</p>
          )}
          <div className={styles.contextGrid}>
            <div className={styles.contextCard}>
              <p className={styles.contextLabel}>
                {hostControlPanelCopy.activeRoundTeamTitle}
              </p>
              <p className={styles.contextValue}>{activeRoundTeamName}</p>
            </div>
            <div className={styles.contextCard}>
              <p className={styles.contextLabel}>
                {hostControlPanelCopy.headerMinigameContextTitle}
              </p>
              <p className={styles.contextValue}>{minigameLabel}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.container} data-host-minigame-takeover="play">
      <div className={styles.playBody}>
        <MinigameSurface
          minigameHostView={minigameHostView}
          teamNameByTeamId={teamNameByTeamId}
          triviaAttemptDisabled={triviaAttemptDisabled}
          onRecordTriviaAttempt={onRecordTriviaAttempt}
        />
      </div>
    </section>
  );
};
