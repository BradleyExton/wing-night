import type { FappyMinigameLeg } from "@wingnight/shared";

import { legHistoryCopy } from "./copy.js";
import * as styles from "./styles.js";

// One chip per leg of the relay: cleared, in hand, or still to fly, with the
// crash count on any leg that cost the team a restart. `activeLegIndex` is
// null once the relay is over, so nothing reads as still in hand.
//
// The crash count carries `data-fappy-crashes` because this strip is the only
// place the number is said: the deck's leg card used to repeat it in words,
// and on one chrome row beside these chips that was the same fact twice.
export const LegHistory = ({
  legs,
  activeLegIndex
}: {
  legs: FappyMinigameLeg[];
  activeLegIndex: number | null;
}): JSX.Element => {
  return (
    <div className={styles.container}>
      <span className={styles.title}>{legHistoryCopy.title}</span>
      {legs.map((leg) => {
        const isActive = leg.legIndex === activeLegIndex;
        const chipClassName = `${styles.chip}${
          leg.status === "cleared"
            ? ` ${styles.chipCleared}`
            : isActive
              ? ` ${styles.chipActive}`
              : ""
        }`;

        return (
          <span key={leg.legIndex} className={chipClassName}>
            {leg.status === "cleared" ? legHistoryCopy.cleared : legHistoryCopy.pending}
            {leg.crashes > 0 && (
              <span data-fappy-crashes={leg.crashes}>{legHistoryCopy.crashes(leg.crashes)}</span>
            )}
          </span>
        );
      })}
    </div>
  );
};
