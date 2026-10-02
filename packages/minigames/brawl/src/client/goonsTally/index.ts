import type { BrawlOutcome } from "@wingnight/shared";
import { BRAWL_WORLD, resolveBrawlBlockWorth, resolveBrawlHeartsCarried } from "@wingnight/shared";

/** The worth banked over the course's worth, as the chrome writes it: "4 / 57". */
export const formatGoonsTally = (down: number, total: number): string => `${down} / ${total}`;

/**
 * The worth banked, written straight into the chrome from the paint loop: what the team banked
 * before this block plus what the hen has put down in it so far. The view only banks a block once
 * it is refereed, and the room is watching the goons go down now (SCHLONIC's `wingTally`).
 *
 * It rewrites the text node React rendered rather than replacing it, so a later render from the
 * view (a reset, the next block's echo) still lands on the node that is on screen.
 */
export const paintGoonsTally = (element: HTMLElement | null, down: number, total: number): void => {
  if (element === null) {
    return;
  }

  const text = formatGoonsTally(down, total);
  const node = element.firstChild;

  if (node !== null && node.nodeType === 3 && node.nextSibling === null) {
    if (node.nodeValue !== text) {
      node.nodeValue = text;
    }

    return;
  }

  if (element.textContent !== text) {
    element.textContent = text;
  }
};

/**
 * What a turn banked before this block: the floor the live tally counts up from. Each refereed
 * block is worth what the referee says — its goons and clean waves, and its hearts if she walked
 * off — so the live count agrees with the view the moment the block is refereed. A heart bought
 * for this block or an earlier one is already paid for (`heartPrice` each), so the floor is the
 * bank after the purchase, as the view's `goonsDown` is.
 */
export const resolveGoonsBanked = (
  blocks: readonly {
    blockIndex: number;
    result: { outcome: BrawlOutcome; goons: number; hearts: number } | null;
    heartBought: boolean;
  }[],
  blockIndex: number,
  heartPrice: number
): number => {
  return blocks.reduce((total, entry) => {
    const earned = entry.blockIndex < blockIndex && entry.result !== null ? resolveBrawlBlockWorth(entry.result) : 0;
    const paid = entry.blockIndex <= blockIndex && entry.heartBought ? heartPrice : 0;

    return total + earned - paid;
  }, 0);
};

/**
 * The share of the handoff beat over which the lit hearts fly into the tally: the first one goes
 * at `HEART_CARRY_FROM`, the last has gone by `HEART_CARRY_TO`, and the hen walks on to the next
 * teammate with the row dark and the number up by what they were worth.
 */
export const HEART_CARRY_FROM = 0.2;
export const HEART_CARRY_TO = 0.6;

/**
 * How many of the hearts she walked off with have reached the tally by `progress` (0 → 1) of the
 * cleared beat. Pure: the paint loop writes `hearts - carried` on the row and
 * `carried × heartWorth` on top of the tally, so the two move together.
 */
export const resolveHeartsCarried = (hearts: number, progress: number): number => {
  if (hearts <= 0 || progress < HEART_CARRY_FROM) {
    return 0;
  }

  const share = Math.min(1, (progress - HEART_CARRY_FROM) / (HEART_CARRY_TO - HEART_CARRY_FROM));

  return Math.min(hearts, 1 + Math.floor(share * hearts));
};

/**
 * What the carried hearts add to the tally: three of them at the most. A bought fourth heart goes
 * out with the rest at the handoff but adds nothing, because the referee never banks it back.
 */
export const resolveHeartsWorth = (hearts: number): number => resolveBrawlHeartsCarried(hearts) * BRAWL_WORLD.heartWorth;
