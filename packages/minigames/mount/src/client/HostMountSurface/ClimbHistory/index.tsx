import type { MountMinigameClimb } from "@wingnight/shared";

import { climbHistoryCopy } from "./copy.js";
import * as styles from "./styles.js";

// One row per climb of the turn: who climbed and how it ended — mounted, or how far of the way to
// the line — with the climb in hand lit.
export const ClimbHistory = ({
  climbs,
  activeClimbIndex
}: {
  climbs: MountMinigameClimb[];
  activeClimbIndex: number | null;
}): JSX.Element => (
  <div className={styles.container}>
    <span className={styles.title}>{climbHistoryCopy.title}</span>
    {climbs.map((climb) => (
      <span
        key={climb.climbIndex}
        className={`${styles.entry}${climb.climbIndex === activeClimbIndex ? ` ${styles.entryActive}` : ""}`}
        data-mount-history={climb.climbIndex}
      >
        <span>{climb.player?.name ?? climbHistoryCopy.houseHen}</span>
        <span className={styles.outcome}>
          {climb.status === "done"
            ? climbHistoryCopy.outcome(climb.skipped ? null : (climb.result?.outcome ?? null), climb.result?.share ?? 0)
            : climbHistoryCopy.pending}
        </span>
      </span>
    ))}
  </div>
);
