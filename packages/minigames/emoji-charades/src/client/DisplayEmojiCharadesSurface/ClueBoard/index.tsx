import { MAX_EMOJIS_PER_SUBJECT } from "../../../runtime/types/index.js";
import * as styles from "./styles.js";

export type ClueBoardProps = {
  emojiSequence: string[];
  isDimmed: boolean;
};

// The fixed 6x5 wall of DESIGN.md §2.6: every slot the cap allows is on screen
// from the first tap, so the clue fills a board the room already knows.
export const ClueBoard = ({
  emojiSequence,
  isDimmed
}: ClueBoardProps): JSX.Element => {
  const slots = Array.from({ length: MAX_EMOJIS_PER_SUBJECT }, (_, index) => index);
  const newestIndex = emojiSequence.length - 1;

  return (
    <div className={isDimmed ? `${styles.board} ${styles.boardDimmed}` : styles.board}>
      {slots.map((slotIndex) => {
        const emoji = emojiSequence[slotIndex];

        if (emoji === undefined) {
          return <div key={slotIndex} className={styles.slotEmpty} />;
        }

        return (
          <div
            key={slotIndex}
            className={
              slotIndex === newestIndex ? styles.slotNewest : styles.slotFilled
            }
          >
            {emoji}
          </div>
        );
      })}
    </div>
  );
};
