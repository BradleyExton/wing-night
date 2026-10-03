import { resolveBrawlBlockWorth, resolveBrawlCourseTotal } from "@wingnight/shared";

import type { BrawlRuntimeBlock } from "../types/index.js";

/**
 * What the turn has spent on fourth hearts: `heartPrice` for every block a teammate bought one
 * on, whether that block was then fought, lost or skipped — the heart was bought, and it stays paid.
 */
export const resolveHeartsPaid = (blocks: readonly Pick<BrawlRuntimeBlock, "heartBought">[], heartPrice: number): number => {
  return blocks.reduce((total, block) => total + (block.heartBought ? heartPrice : 0), 0);
};

/**
 * The worth banked over the turn so far: every refereed block's goons and clean waves, plus the
 * hearts she walked off a CLEARED block with, three at the most (`resolveBrawlBlockWorth`), less
 * every fourth heart the team bought. A KO keeps what it earned and banks no hearts; a skipped
 * block never had a result. Never below nought: a heart is only for sale to a team that can pay.
 */
export const resolveGoonsDown = (blocks: readonly BrawlRuntimeBlock[], heartPrice: number): number => {
  const earned = blocks.reduce((total, block) => {
    return total + (block.result === null ? 0 : resolveBrawlBlockWorth(block.result));
  }, 0);

  return earned - resolveHeartsPaid(blocks, heartPrice);
};

/** The worth of the whole course the team fights: every goon, every clean wave and every heart on every block. */
export const resolveGoonsTotal = (courseSeed: number, blocksPerTurn: number): number => {
  return resolveBrawlCourseTotal({ seed: courseSeed, blocks: blocksPerTurn });
};

/**
 * Worth is the whole currency: what the team banked against everything the course held. A
 * perfect course is full points and there is nothing above it; the bonuses are inside the max,
 * not on top, and a bought heart only ever lowers the numerator. Near misses are built in — on
 * the default seed's 61-worth course, 53 is 13 of 15 points.
 */
export const resolveBrawlPoints = (
  goonsDown: number,
  goonsTotal: number,
  pointsMax: number
): number => {
  const share = Math.min(1, Math.max(0, goonsDown / Math.max(1, goonsTotal)));

  return Math.max(0, Math.round(pointsMax * share));
};
