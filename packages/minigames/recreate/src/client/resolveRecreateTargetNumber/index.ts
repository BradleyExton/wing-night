import type { RecreateSubState } from "@wingnight/shared";

// Counts the target on screen — the tablet's and the TV's — not the one the turn has reached.
// A scored target stays on the tablet — its seal and the real prompt — until
// "Next target", so the count must not run ahead of that reveal.
export const resolveRecreateTargetNumber = (
  subState: RecreateSubState,
  targetsCompletedThisTurn: number,
  targetsPerTurn: number
): number => {
  const targetOnScreen =
    subState === "scored" ? targetsCompletedThisTurn : targetsCompletedThisTurn + 1;

  return Math.min(Math.max(targetOnScreen, 1), targetsPerTurn);
};
