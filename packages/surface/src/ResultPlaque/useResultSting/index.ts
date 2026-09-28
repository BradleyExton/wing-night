import { createHouseSoundboard, type HouseCueName, type HouseSoundboard } from "@wingnight/audio";
import { useEffect, useRef } from "react";

import type { ResultPlaqueTone } from "../index.js";

// Pure: which house cue a result card sounds. `neutral` says nothing — a split
// ruling or a plain finish is not a moment the room cheers or groans at.
export const resolveResultSting = (
  tone: ResultPlaqueTone
): Extract<HouseCueName, "hit" | "miss"> | null => {
  if (tone === "hit") {
    return "hit";
  }

  return tone === "miss" ? "miss" : null;
};

// The reveal sting: every result card on the TV sounds its tone as it lands,
// which is what gives seven games a correct and an incorrect sound at once.
// It fires on mount and again on a change of tone, because SONG_GUESS's card
// is up while the host is still ruling and turns from neutral to hit as the
// marks land. A card that mounts on a reconnect mid-reveal stings once — a
// small price against the machinery of knowing.
//
// `silent` is for a game with a bespoke ending of its own (FAPPY's air horn),
// so the room does not hear its fanfare and the house sting on top of it.
export const useResultSting = (tone: ResultPlaqueTone, silent: boolean): void => {
  const soundboardRef = useRef<HouseSoundboard | null>(null);

  useEffect(() => {
    if (silent) {
      return;
    }

    const cue = resolveResultSting(tone);

    if (cue === null) {
      return;
    }

    soundboardRef.current ??= createHouseSoundboard();
    soundboardRef.current.play(cue);
  }, [silent, tone]);
};
