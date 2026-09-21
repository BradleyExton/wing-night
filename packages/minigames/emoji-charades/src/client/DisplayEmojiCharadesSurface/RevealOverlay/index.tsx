import type { EmojiCharadesSubjectReveal } from "@wingnight/shared";

import { displayEmojiCharadesSurfaceCopy } from "../copy.js";
import * as styles from "./styles.js";

export type RevealOverlayProps = {
  reveal: EmojiCharadesSubjectReveal;
  teamName: string | null;
  pointsAwarded: number;
};

export const RevealOverlay = ({
  reveal,
  teamName,
  pointsAwarded
}: RevealOverlayProps): JSX.Element => {
  const isCorrect = reveal.outcome === "CORRECT";
  const hasAward = isCorrect && teamName !== null;

  return (
    <div className={styles.overlay}>
      <div className={hasAward ? styles.plaqueCorrect : styles.plaqueSkipped}>
        <span
          className={
            isCorrect ? styles.verdictIconCorrect : styles.verdictIconSkipped
          }
          aria-hidden="true"
        >
          {isCorrect ? "✓" : "✗"}
        </span>
        <p className={styles.answer}>
          <span className={isCorrect ? styles.labelCorrect : styles.labelSkipped}>
            {isCorrect
              ? displayEmojiCharadesSurfaceCopy.revealCorrectLabel
              : displayEmojiCharadesSurfaceCopy.revealSkippedLabel}
          </span>
          {reveal.subjectText}
        </p>
        {hasAward && (
          <p className={styles.award}>
            <span className={styles.awardPoints}>
              {displayEmojiCharadesSurfaceCopy.revealAwardLabel(pointsAwarded)}
            </span>
            <span className={styles.awardTeam}>{teamName}</span>
          </p>
        )}
      </div>
    </div>
  );
};
