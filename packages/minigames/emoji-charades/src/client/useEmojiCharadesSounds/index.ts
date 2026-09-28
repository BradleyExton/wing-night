import { useEffect, useRef } from "react";
import { useHouseSoundboard } from "@wingnight/surface";

import { MAX_EMOJIS_PER_SUBJECT } from "../../runtime/types/index.js";

export type ClueCue = { cue: "pop"; intensity: number } | { cue: "unpop" };

// Pure: what a change in the clue's length sounds like. An emoji added pops, its pitch climbing
// with how full the board is; one taken off unpops. The clue emptying is silent — that is the
// verdict landing or a clear, not a removal — and so is the first reading.
export const resolveClueCue = (
  previousCount: number | undefined,
  count: number
): ClueCue | null => {
  if (previousCount === undefined || count === previousCount) {
    return null;
  }

  if (count > previousCount) {
    return { cue: "pop", intensity: (count - 1) / Math.max(1, MAX_EMOJIS_PER_SUBJECT - 1) };
  }

  return count === 0 ? null : { cue: "unpop" };
};

// The room's sound for a clue, on the TV only. The verdict is the house result card's own sting.
export const useEmojiCharadesSounds = (emojiCount: number): void => {
  const play = useHouseSoundboard();
  const previousCountRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const cue = resolveClueCue(previousCountRef.current, emojiCount);

    previousCountRef.current = emojiCount;

    if (cue === null) {
      return;
    }

    play(cue.cue, cue.cue === "pop" ? cue.intensity : undefined);
  }, [emojiCount, play]);
};
