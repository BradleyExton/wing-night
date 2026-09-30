import { resolveRevealDurationMs } from "@wingnight/minigames-core";
import type { DrawingPromptReveal } from "@wingnight/shared";
import { useRevealWindow } from "@wingnight/surface";

import { resolveRevealKey } from "../DisplayDrawingSurface/heldSketch/index.js";

// The reveal window, shared by both DRAWING surfaces: the prompt text is up
// for the server's window, timed from when THIS surface saw the reveal (see
// `useRevealWindow` for why arrival, not the server's expiry stamp).
export const useIsRevealVisible = (reveal: DrawingPromptReveal | null): boolean => {
  return useRevealWindow(
    resolveRevealKey(reveal),
    reveal === null ? 0 : resolveRevealDurationMs(reveal)
  );
};
