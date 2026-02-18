import { Phase, type MinigameDisplayView, type MinigameType } from "@wingnight/shared";

import { displayPlaceholderCopy } from "../copy";
import * as styles from "./styles";

type MinigameSurfaceProps = {
  phase: Phase;
  minigameType: MinigameType | null;
  minigameDisplayView: MinigameDisplayView | null;
  activeTurnTeamName: string | null;
};

export const MinigameSurface = ({
  phase,
  minigameType,
  minigameDisplayView,
  activeTurnTeamName
}: MinigameSurfaceProps): JSX.Element | null => {
  if (phase === Phase.MINIGAME_INTRO) {
    return (
      <div className={styles.section}>
        <h2 className={styles.title}>{displayPlaceholderCopy.minigameSectionTitle}</h2>
        <p className={styles.description}>
          {displayPlaceholderCopy.minigameIntroDescription(minigameType ?? "TRIVIA")}
        </p>
      </div>
    );
  }

  if (phase !== Phase.MINIGAME_PLAY) {
    return null;
  }

  if (
    minigameDisplayView === null ||
    minigameDisplayView.minigame !== "TRIVIA" ||
    activeTurnTeamName === null
  ) {
    return (
      <div className={styles.section}>
        <h2 className={styles.title}>{displayPlaceholderCopy.triviaTurnTitle}</h2>
        <p className={styles.description}>{displayPlaceholderCopy.waitingForStateLabel}</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>{displayPlaceholderCopy.triviaTurnTitle}</h2>
      <p className={styles.description}>
        {displayPlaceholderCopy.activeTeamLabel(activeTurnTeamName)}
      </p>
      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>{displayPlaceholderCopy.triviaQuestionLabel}</p>
          <p className={styles.metaValue}>
            {minigameDisplayView.currentPrompt?.question ??
              displayPlaceholderCopy.waitingForStateLabel}
          </p>
        </div>
      </div>
    </div>
  );
};
