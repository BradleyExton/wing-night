import { useCallback } from "react";
import { resolveSfxTakesUrl } from "@wingnight/shared";
import { useGameSoundboard } from "@wingnight/surface";

import {
  BRAWL_HONK_GOON_INTENSITY,
  BRAWL_SFX_FOLDER,
  createBrawlSoundboard,
  type BrawlCueName
} from "../audio/index.js";
import type { BrawlDisplayEvent, BrawlDisplayEventHandler } from "../useBrawlMirror/index.js";

type BrawlSoundsInput = {
  serverOrigin: string | null;
  // False on a tablet with a TV beside it: the TV is the room's speaker, so the tablet asks for
  // no takes and plays nothing. True on the TV, and on a surface playing solo.
  isSpeaker?: boolean;
};

export type BrawlSounds = {
  /** Hand to the mirror as its `onEvent`; stable for the life of the surface. */
  onMirrorEvent: BrawlDisplayEventHandler;
};

/**
 * What a cue sounds at for one event: a goose's honk at a goon's heft and the boss's at full, so
 * the room hears the big one coming; everything else at the board's own level. Pure.
 */
export const resolveBrawlCue = (event: BrawlDisplayEvent): { cue: BrawlCueName; intensity?: number } => {
  if (event.kind === "honk") {
    return { cue: "honk", intensity: event.goonKind === "boss" ? 1 : BRAWL_HONK_GOON_INTENSITY };
  }

  return { cue: event.kind };
};

/**
 * The room's sound for one team's street, on the TV only (docs/minigames/brawl-spec.md §0.10):
 * every event the mirror reads off its replay, and every beat as the wall starts it, rung through
 * BRAWL's board. The handler's identity is STABLE for the life of the surface, deliberately: the
 * mirror's loop closes over the handler it was set up with (`useSchlonicSounds`).
 */
export const useBrawlSounds = ({ serverOrigin, isSpeaker = true }: BrawlSoundsInput): BrawlSounds => {
  const play = useGameSoundboard({
    createBoard: createBrawlSoundboard,
    takesUrl: resolveSfxTakesUrl(BRAWL_SFX_FOLDER, serverOrigin),
    isSpeaker
  });

  const onMirrorEvent = useCallback<BrawlDisplayEventHandler>(
    (event): void => {
      const { cue, intensity } = resolveBrawlCue(event);

      play(cue, intensity);
    },
    [play]
  );

  return { onMirrorEvent };
};
