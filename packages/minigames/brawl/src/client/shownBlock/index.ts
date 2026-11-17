import type { BrawlMinigameBlock, BrawlMinigameViewFields } from "@wingnight/shared";

/**
 * The block a screen draws: the one in hand once it has a frame; before that, the one just
 * finished, whose last frame is what its ending is held over; and with neither (block one on the
 * line) the block in hand itself, drawn as its crew assembling.
 */
export const resolveShownBlock = (view: Pick<BrawlMinigameViewFields, "blocks" | "blockIndex">): BrawlMinigameBlock | null => {
  const inHand = view.blocks[view.blockIndex] ?? null;

  if (inHand !== null && inHand.frame !== null) {
    return inHand;
  }

  const last = view.blocks[view.blockIndex - 1] ?? null;

  if (last !== null && last.frame !== null) {
    return last;
  }

  return inHand ?? last;
};

/**
 * The worth banked over the turn as a screen shows it: the view's sum, with the running block's
 * share replaced by the frame the screen is drawing — so the tally climbs with the goon going
 * down on screen rather than with the server's next frame.
 */
export const resolveLiveBanked = (
  view: Pick<BrawlMinigameViewFields, "banked">,
  shown: BrawlMinigameBlock | null,
  drawnBanked: number | null
): number => {
  if (shown === null || shown.status !== "running" || drawnBanked === null) {
    return view.banked;
  }

  return view.banked - shown.banked + drawnBanked;
};
