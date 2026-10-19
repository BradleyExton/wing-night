import { resolveRevealDurationMs, type MinigameRevealWindow } from "@wingnight/minigames-core";

import { useRevealWindow } from "../useRevealWindow/index.js";

// Whether a game's reveal is up: for the server's window, timed from when THIS
// surface saw the reveal (see `useRevealWindow` for why arrival, not the
// server's expiry stamp). `resolveRevealKey` is the game's own name for the
// reveal, with the revealed-at stamp folded in.
//
// One copy for every game. DRAWING and EMOJI CHARADES each carried their own,
// and the clock-skew bug that read `expiresAtMs` against the surface's clock
// got written into both.
export const useIsRevealVisible = <Reveal extends MinigameRevealWindow>(
  reveal: Reveal | null,
  resolveRevealKey: (reveal: Reveal | null) => string | null
): boolean => {
  return useRevealWindow(
    resolveRevealKey(reveal),
    reveal === null ? 0 : resolveRevealDurationMs(reveal)
  );
};
