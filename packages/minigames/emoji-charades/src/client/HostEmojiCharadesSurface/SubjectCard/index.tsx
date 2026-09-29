import { MAX_EMOJIS_PER_SUBJECT } from "../../../runtime/types/index.js";
import { hostEmojiCharadesSurfaceCopy } from "../copy.js";
import * as styles from "./styles.js";

export type SubjectCardProps = {
  subjectId: string | null;
  subjectText: string | null;
  // Null on the intro beat, where there is no clue yet and the card hugs its
  // subject rather than filling the deck.
  emojiSequence: string[] | null;
};

// The subject the clue-giver is drawing in emoji, and the clue so far. The
// same card on both beats: a panel in the host's own control deck at intro,
// the head of the takeover's deck column at play.
export const SubjectCard = ({
  subjectId,
  subjectText,
  emojiSequence
}: SubjectCardProps): JSX.Element => {
  return (
    <div className={emojiSequence === null ? styles.cardIntro : styles.card}>
      <div key={subjectId ?? "waiting"} className={styles.subjectHead}>
        <p className={styles.subjectLabel}>
          {hostEmojiCharadesSurfaceCopy.subjectLabel}
        </p>
        {subjectText === null ? (
          <p className={styles.subjectWaiting}>
            {hostEmojiCharadesSurfaceCopy.waitingSubjectLabel}
          </p>
        ) : (
          <p className={styles.subjectValueFor(subjectText)}>
            {subjectText}
          </p>
        )}
      </div>

      {emojiSequence !== null && (
        <div className={styles.clueWell}>
          <p className={styles.clueHeader}>
            <span className={styles.clueLabel}>
              {hostEmojiCharadesSurfaceCopy.clueLabel}
            </span>
            <span className={styles.clueCount}>
              {hostEmojiCharadesSurfaceCopy.clueCountLabel(
                emojiSequence.length,
                MAX_EMOJIS_PER_SUBJECT
              )}
            </span>
          </p>
          {emojiSequence.length > 0 ? (
            <p className={styles.clue} aria-label={hostEmojiCharadesSurfaceCopy.clueLabel}>
              {emojiSequence.map((emoji, index) => (
                <span key={`${index}-${emoji}`} className={styles.clueEmoji}>
                  {emoji}
                </span>
              ))}
            </p>
          ) : (
            <p className={styles.clueEmpty}>
              {hostEmojiCharadesSurfaceCopy.emptySequenceLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
