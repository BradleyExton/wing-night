import { useEffect, useState } from "react";
import { resolveRevealDurationMs } from "@wingnight/minigames-core";
import type { DrawingPromptReveal } from "@wingnight/shared";

import { resolveRevealKey } from "../DisplayDrawingSurface/heldSketch/index.js";

// The reveal window, shared by both DRAWING surfaces: the prompt text is
// visible for the server's window, timed from when THIS surface saw the
// reveal, and then it disappears again.
//
// Timed from arrival rather than measured against `expiresAtMs`, because that
// stamp is on the SERVER's clock while the comparison would be on the TV's or
// the tablet's — see `resolveRevealDurationMs`. Three devices, three clocks, a
// 2000ms window: a surface running two seconds fast found every window already
// closed and showed nobody an answer, and a slow one held the answer up long
// after the room had moved on. Neither said anything about it.
//
// The trade is that a surface joining mid-window gives the reveal its full
// length rather than the remainder. That is the right way round: the window
// exists so the room can read the answer, and reading it a beat late beats
// not reading it at all.
//
// Lived in both surfaces as two identical copies before it lived here, which
// is how they came to carry the same bug twice.
export const useIsRevealVisible = (
  reveal: DrawingPromptReveal | null
): boolean => {
  const [visibleRevealKey, setVisibleRevealKey] = useState<string | null>(null);
  const revealKey = resolveRevealKey(reveal);
  const durationMs = reveal === null ? 0 : resolveRevealDurationMs(reveal);

  useEffect(() => {
    if (revealKey === null || durationMs <= 0) {
      return undefined;
    }

    setVisibleRevealKey(revealKey);

    const expiryTimer = setTimeout(() => {
      setVisibleRevealKey(null);
    }, durationMs);

    return (): void => {
      clearTimeout(expiryTimer);
    };
  }, [durationMs, revealKey]);

  return revealKey !== null && visibleRevealKey === revealKey;
};
