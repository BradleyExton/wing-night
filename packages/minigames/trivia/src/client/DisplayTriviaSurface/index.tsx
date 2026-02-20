import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";

import { displayTriviaSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

export const DisplayTriviaSurface = ({
  phase,
  minigameDisplayView
}: MinigameDisplayRendererProps): JSX.Element => {
  const triviaDisplayView =
    minigameDisplayView?.minigame === "TRIVIA" ? minigameDisplayView : null;
  const currentPrompt = triviaDisplayView?.currentPrompt ?? null;
  const isPlayPhase = phase === "play";

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        {isPlayPhase
          ? displayTriviaSurfaceCopy.playDescription
          : displayTriviaSurfaceCopy.introDescription}
      </p>
      {currentPrompt !== null ? (
        <div className={styles.promptBlock}>
          <p className={styles.promptLabel}>{displayTriviaSurfaceCopy.questionLabel}</p>
          <p className={styles.promptValue}>{currentPrompt.question}</p>
        </div>
      ) : (
        <p className={styles.fallbackTitle}>{displayTriviaSurfaceCopy.triviaTurnTitle}</p>
      )}
    </div>
  );
};
