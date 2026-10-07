import { useCallback } from "react";
import { resolveSfxTakesUrl } from "@wingnight/shared";
import { useGameSoundboard } from "@wingnight/surface";

import { MOUNT_SFX_FOLDER, createMountSoundboard } from "../audio/index.js";
import type { MountDisplayEventHandler } from "../mirrorEvents/index.js";

type MountSoundsInput = {
  serverOrigin: string | null;
  // False on a tablet with a TV beside it: the TV is the room's speaker. True on the TV, and on a
  // surface playing solo.
  isSpeaker?: boolean;
};

/**
 * The room's sound for a climb, on the TV only (spec §0.7): every event the mirror reads off its
 * replay and every ending as the wall starts its beat, rung through the board. The handler's
 * identity is STABLE for the life of the surface: the mirror's loop closes over the one it was set
 * up with (`useBrawlSounds`).
 */
export const useMountSounds = ({ serverOrigin, isSpeaker = true }: MountSoundsInput): { onEvent: MountDisplayEventHandler } => {
  const play = useGameSoundboard({
    createBoard: createMountSoundboard,
    takesUrl: resolveSfxTakesUrl(MOUNT_SFX_FOLDER, serverOrigin),
    isSpeaker
  });

  const onEvent = useCallback<MountDisplayEventHandler>(
    (event): void => {
      play(event.kind);
    },
    [play]
  );

  return { onEvent };
};
