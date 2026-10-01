import type { BrawlMinigameBlock } from "@wingnight/shared";

import { blockHistoryCopy } from "./copy.js";
import * as styles from "./styles.js";

// One row per block of the turn: who fought it and how it ended, with the block in hand lit.
// `activeBlockIndex` is the block the tablet is on.
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
            ? blockHistoryCopy.outcome(block.skipped ? null : (block.result?.outcome ?? null), block.result?.goons ?? 0)
            : blockHistoryCopy.pending}
        </span>
      </span>
    ))}
  </div>
);
