import { hostControlPanelCopy } from "../../../components/HostControlPanel/copy";
import { MinigameSurface } from "../../../components/HostControlPanel/MinigameSurface";
import type { HostTakeoverRendererProps } from "../../registry";
import * as styles from "./styles";

const resolveCompatibilityMismatchMessage = (
  minigameHostView: HostTakeoverRendererProps["minigameHostView"]
): string | null => {
  if (minigameHostView?.compatibilityStatus !== "MISMATCH") {
    return null;
  }

  return (
    minigameHostView.compatibilityMessage ??
    hostControlPanelCopy.minigameContractMismatchFallbackLabel
  );
};

export const HostTakeoverRenderer = ({
  hostMode,
  minigameId,
  minigameHostView,
  activeRoundTeamName,
  teamNameByTeamId,
  triviaAttemptDisabled,
  onRecordTriviaAttempt
}: HostTakeoverRendererProps): JSX.Element => {
  const compatibilityMismatchMessage = resolveCompatibilityMismatchMessage(minigameHostView);

  if (hostMode === "minigame_intro") {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>{hostControlPanelCopy.minigameSectionTitle}</h2>
        <p className={styles.description}>
          {hostControlPanelCopy.minigameIntroDescription(minigameId)}
        </p>
        {compatibilityMismatchMessage !== null && (
          <p className={styles.mismatchMessage}>{compatibilityMismatchMessage}</p>
        )}
        <div className={styles.contextGrid}>
          <div className={styles.contextCard}>
            <p className={styles.contextLabel}>{hostControlPanelCopy.activeRoundTeamTitle}</p>
            <p className={styles.contextValue}>{activeRoundTeamName}</p>
          </div>
          <div className={styles.contextCard}>
            <p className={styles.contextLabel}>
              {hostControlPanelCopy.headerMinigameContextTitle}
            </p>
            <p className={styles.contextValue}>{minigameId}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.playBody}>
      <MinigameSurface
        minigameHostView={minigameHostView}
        teamNameByTeamId={teamNameByTeamId}
        triviaAttemptDisabled={triviaAttemptDisabled}
        onRecordTriviaAttempt={onRecordTriviaAttempt}
      />
    </div>
  );
};
