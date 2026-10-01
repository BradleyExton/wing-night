import { resolveBrawlCourseTotal } from "@wingnight/shared";

import type { BrawlRuntimeBlock } from "../types/index.js";

// A KO keeps what it earned, so every refereed block counts; a skipped block never had a result.
export const resolveGoonsDown = (blocks: readonly BrawlRuntimeBlock[]): number => {
  return blocks.reduce((total, block) => total + (block.result?.goons ?? 0), 0);
};

/** The worth of the whole course the team fights: every goon on every block. */
export const resolveGoonsTotal = (courseSeed: number, blocksPerTurn: number): number => {
  return resolveBrawlCourseTotal({ seed: courseSeed, blocks: blocksPerTurn });
};

/**
 * Worth is the whole currency: what the team put down against everything the course held. A
 * clean course is full points and there is nothing above it. Near misses are built in — 24 of 27
 * worth is 13 of 15 points.
 */
export const resolveBrawlPoints = (
  goonsDown: number,
  goonsTotal: number,
  pointsMax: number
): number => {
  const share = Math.min(1, Math.max(0, goonsDown / Math.max(1, goonsTotal)));

  return Math.max(0, Math.round(pointsMax * share));
};
