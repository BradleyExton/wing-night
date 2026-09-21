import type { SchlonicMinigameRun } from "@wingnight/shared";

// Whose run this is, as the room would say it. A run with no player on it is
// the house hen's, and every surface that asks spells that out its own way —
// so this answers null rather than guessing a label.
export const resolveRunPlayerName = (
  run: SchlonicMinigameRun | null | undefined
): string | null => {
  return run?.player?.name ?? null;
};
