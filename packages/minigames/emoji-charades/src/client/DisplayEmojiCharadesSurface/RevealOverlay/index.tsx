import type { EmojiCharadesSubjectReveal } from "@wingnight/shared";
import { ResultPlaque } from "@wingnight/surface";

import { displayEmojiCharadesSurfaceCopy } from "../copy.js";
import * as styles from "./styles.js";

export type RevealOverlayProps = {
  reveal: EmojiCharadesSubjectReveal;
  teamName: string | null;
  pointsAwarded: number;
};

// The verdict window is the house `<ResultPlaque>` (DESIGN.md §2.2E), the same
// card DRAWING reveals its answer on.
export const RevealOverlay = ({
  reveal,
  teamName,
  pointsAwarded
}: RevealOverlayProps): JSX.Element => {
  const isCorrect = reveal.outcome === "CORRECT";
  const hasAward = isCorrect && teamName !== null;

  return (
    <div className={styles.overlay}>
      <ResultPlaque
        tone={isCorrect ? "hit" : "miss"}
        kicker={
          isCorrect
            ? displayEmojiCharadesSurfaceCopy.revealCorrectLabel
            : displayEmojiCharadesSurfaceCopy.revealSkippedLabel
        }
        title={reveal.subjectText}
        points={hasAward ? displayEmojiCharadesSurfaceCopy.revealAwardLabel(pointsAwarded) : null}
        pointsCaption={hasAward ? teamName : null}
      />
    </div>
  );
};
