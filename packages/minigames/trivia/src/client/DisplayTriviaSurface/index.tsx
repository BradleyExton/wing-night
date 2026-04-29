import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";

import { displayTriviaSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

export const DisplayTriviaSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName
}: MinigameDisplayRendererProps): JSX.Element => {
  const triviaDisplayView =
    minigameDisplayView?.minigame === "TRIVIA" ? minigameDisplayView : null;
  const currentPrompt = triviaDisplayView?.currentPrompt ?? null;
  const isPlayPhase = phase === "play";

  if (!isPlayPhase) {
    return (
      <div className={styles.introContainer}>
        <p className={styles.introText}>{displayTriviaSurfaceCopy.introMessage}</p>
      </div>
    );
  }

  if (currentPrompt === null) {
    return (
      <div className={styles.introContainer}>
        <p className={styles.fallbackTitle}>{displayTriviaSurfaceCopy.waitingMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.question}>{currentPrompt.question}</p>
      <span className={styles.underline} aria-hidden="true" />
      {activeTeamName !== null && (
        <p className={styles.activeTeam}>
          <span className={styles.activeTeamLabel}>
            {displayTriviaSurfaceCopy.activeTeamLabel}
          </span>
          {activeTeamName}
        </p>
      )}
    </div>
  );
};
