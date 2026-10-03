import type { BrawlMinigameBlock } from "@wingnight/shared";
import { resolveBrawlBlockWorth } from "@wingnight/shared";

import { blockHistoryCopy } from "./copy.js";
import * as styles from "./styles.js";

// One row per block of the turn: who fought it, how it ended and what it banked (its worth, hearts
// included on a handoff), with the block in hand lit. `activeBlockIndex` is the block the tablet
// is on.
export const BlockHistory = ({
  blocks,
  activeBlockIndex
}: {
  blocks: BrawlMinigameBlock[];
  activeBlockIndex: number | null;
}): JSX.Element => (
  <div className={styles.container}>
    <span className={styles.title}>{blockHistoryCopy.title}</span>
    {blocks.map((block) => (
      <span
        key={block.blockIndex}
        className={`${styles.entry}${block.blockIndex === activeBlockIndex ? ` ${styles.entryActive}` : ""}`}
        data-brawl-history={block.blockIndex}
      >
        <span>{block.player?.name ?? blockHistoryCopy.pending}</span>
        <span>
          {block.status === "done"
            ? blockHistoryCopy.outcome(
                block.skipped ? null : (block.result?.outcome ?? null),
                block.result === null ? 0 : resolveBrawlBlockWorth(block.result)
              )
            : blockHistoryCopy.pending}
        </span>
      </span>
    ))}
  </div>
);
