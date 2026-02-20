import type { MinigameDisplayRendererProps } from "../../types";
import { displayTriviaSurfaceCopy } from "./copy";
import * as styles from "./styles";

export const DisplayTriviaSurface = ({
  phase,
  minigameDisplayView
}: MinigameDisplayRendererProps): JSX.Element => {
  const currentPrompt = minigameDisplayView?.currentPrompt ?? null;
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
