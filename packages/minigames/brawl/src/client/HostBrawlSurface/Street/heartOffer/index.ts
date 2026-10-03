import type { BrawlMinigameHostView } from "@wingnight/shared";

import { canBuyBrawlHeart } from "../../../../runtime/guards/index.js";

/** What the cards say when the offer stands: the price, and what the team has to pay it with. */
export type HeartOffer = { heartPrice: number; banked: number };

/**
 * Whether the handoff pick's cards are up (docs/minigames/brawl-spec.md §0.6), and what they say.
 * Up only while the tablet may act on the block in hand — not through a handoff's beat, when the
 * street still shows the block just ended — and only while the server would take the buy
 * (`canBuyBrawlHeart`, the reducer's own test): a block after the first, on the line, not bought,
 * with the price in the bank. `closedBlockIndex` is the block whose cards the holder closed —
 * "Keep the three", or a thumb on the street — which is client state, never an action. Pure.
 */
export const resolveHeartOffer = ({
  view,
  blockIndex,
  isArmed,
  closedBlockIndex
}: {
  view: Pick<BrawlMinigameHostView, "blockIndex" | "blocks" | "goonsDown" | "heartPrice">;
  /** The block the street shows. */
  blockIndex: number;
  isArmed: boolean;
  closedBlockIndex: number | null;
}): HeartOffer | null => {
  if (!isArmed || blockIndex !== view.blockIndex || closedBlockIndex === blockIndex) {
    return null;
  }

  const isOffered = canBuyBrawlHeart({
    block: view.blocks[view.blockIndex] ?? null,
    banked: view.goonsDown,
    heartPrice: view.heartPrice
  });

  return isOffered ? { heartPrice: view.heartPrice, banked: view.goonsDown } : null;
};
