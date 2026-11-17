import type { BrawlMinigameBlock } from "@wingnight/shared";

/** The worth banked over the turn so far: every block's own, the one in hand counted as it stands. */
export const resolveBrawlBanked = (blocks: readonly Pick<BrawlMinigameBlock, "banked">[]): number => {
  return blocks.reduce((total, block) => total + block.banked, 0);
};

/**
 * Everything the course holds for this team: each block's kit as it was dealt for the crew that
 * fought it, and the blocks still to come as they would be dealt for the crew as it stands.
 */
export const resolveBrawlTotal = (blocks: readonly Pick<BrawlMinigameBlock, "total">[]): number => {
  return blocks.reduce((total, block) => total + block.total, 0);
};

/**
 * Worth is the whole currency: what the team banked against everything its street held. A
 * perfect course is full points and there is nothing above it. Near misses are built in — a crew
 * of five's course is worth a couple of hundred, so the points move one at a time.
 */
export const resolveBrawlPoints = (banked: number, total: number, pointsMax: number): number => {
  const share = Math.min(1, Math.max(0, banked / Math.max(1, total)));

  return Math.max(0, Math.round(pointsMax * share));
};
