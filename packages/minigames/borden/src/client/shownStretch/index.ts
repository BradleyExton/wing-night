import type { BordenMinigameStretch, BordenMinigameViewFields } from "@wingnight/shared";

/**
 * The stretch a screen draws: the one in hand once it has a frame; before that, the one just
 * finished, whose last frame the handoff is held over; and with neither (the fences on the line)
 * the stretch in hand itself, drawn as its pair standing at the start.
 */
export const resolveShownStretch = (
  view: Pick<BordenMinigameViewFields, "stretches" | "stretchIndex">
): BordenMinigameStretch | null => {
  const inHand = view.stretches[view.stretchIndex] ?? null;

  if (inHand !== null && inHand.frame !== null) {
    return inHand;
  }

  const last = view.stretches[view.stretchIndex - 1] ?? null;

  if (last !== null && last.frame !== null) {
    return last;
  }

  return inHand ?? last;
};

/**
 * The worth banked over the game as a screen shows it: the view's sum, with the running stretch's
 * share replaced by the frame this screen is drawing, so the tally climbs as the turret goes down
 * on screen rather than with the room's next frame.
 */
export const resolveLiveBanked = (
  view: Pick<BordenMinigameViewFields, "banked">,
  shown: BordenMinigameStretch | null,
  drawnBanked: number | null
): number => {
  if (shown === null || shown.status !== "running" || drawnBanked === null) {
    return view.banked;
  }

  return view.banked - shown.banked + drawnBanked;
};
