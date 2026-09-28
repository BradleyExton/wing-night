import { useCallback, useRef } from "react";

import {
  createSchlonicSoundboard,
  resolveWingPitch,
  type SchlonicCueName,
  type SchlonicSoundboard
} from "../audio/index.js";
import type { SchlonicMirrorEvent, SchlonicMirrorEventHandler } from "../mirrorEvents/index.js";

// Which cue each thing the mirror replays makes.
const MIRROR_EVENT_CUES: Record<SchlonicMirrorEvent, SchlonicCueName> = {
  jumped: "jump",
  sprung: "spring",
  landed: "land",
  wingTaken: "wing",
  badnikPopped: "badnik",
  hit: "hit",
  cleared: "cleared",
  wiped: "wipeout",
  fell: "fall"
};

/**
 * The room's sound for a run, on the TV only. Returns the handler to hand `useSchlonicMirror` as
 * its `onEvent`. Its identity is STABLE for the life of the surface, deliberately: the mirror's
 * effect carries a hand-narrowed dependency array so a rAF loop is never torn down mid-run, which
 * means its closure holds whatever handler it was set up with.
 *
 * Every cue comes from the mirror, so the wall sounds what the wall shows — the plaques that
 * follow a run are `silent`, because the server has already moved on by the time they land and
 * the mirror is still a few ticks behind it.
 */
export const useSchlonicSounds = (): SchlonicMirrorEventHandler => {
  // Made on the first cue rather than on mount, so a surface that is only ever looked at never
  // asks the browser for an audio context at all.
  const boardRef = useRef<SchlonicSoundboard | null>(null);

  return useCallback((event: SchlonicMirrorEvent, wingsInHand: number): void => {
    boardRef.current ??= createSchlonicSoundboard();
    boardRef.current.play(MIRROR_EVENT_CUES[event], resolveWingPitch(wingsInHand));
  }, []);
};
