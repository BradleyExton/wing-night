import type { JoustShotResult } from "@wingnight/shared";

import { shotHistoryCopy } from "./copy.js";
import * as styles from "./styles.js";

// One chip per pull of the band this turn, including the pulls still to come:
// a slot stays pending until a shot lands in it, and a shot that toppled
// somebody is lit.
export const ShotHistory = ({
  shots,
  shotsPerTurn
}: {
  shots: JoustShotResult[];
  shotsPerTurn: number;
}): JSX.Element => {
  const slots = Array.from({ length: shotsPerTurn }, (_unused, index) => {
    return shots[index] ?? null;
  });

  return (
    <div className={styles.container}>
      <span className={styles.title}>{shotHistoryCopy.title}</span>
      {slots.map((shot, index) => (
        <span
          key={index}
          className={`${styles.chip}${
            shot !== null && shot.toppledPlayerIds.length > 0 ? ` ${styles.chipHit}` : ""
          }`}
        >
          {shot === null ? shotHistoryCopy.pending : shotHistoryCopy.points(shot.points)}
        </span>
      ))}
    </div>
  );
};
