import type { BordenMinigameStretch } from "@wingnight/shared";

/** The worth banked over the game so far: every stretch's own, the one in hand counted as it stands. */
export const resolveBordenBanked = (stretches: readonly Pick<BordenMinigameStretch, "banked">[]): number => {
  return stretches.reduce((total, stretch) => total + stretch.banked, 0);
};

/** Everything the base holds for this crew: each stretch as it was dealt for its pair. */
export const resolveBordenTotal = (stretches: readonly Pick<BordenMinigameStretch, "total">[]): number => {
  return stretches.reduce((total, stretch) => total + stretch.total, 0);
};

/**
 * Worth over the course is the whole score (spec §0.3): what the crew banked — shooters down,
 * hearts carried through a gate — against everything the base held. A clean base is full points
 * and there is nothing above it. Near misses are built in: a base is worth seventy-odd, so the
 * points move one at a time.
 */
export const resolveBordenPoints = (banked: number, total: number, pointsMax: number): number => {
  const share = Math.min(1, Math.max(0, banked / Math.max(1, total)));

  return Math.max(0, Math.round(pointsMax * share));
};
