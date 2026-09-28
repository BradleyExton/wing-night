import { useCallback, useEffect, useRef } from "react";
import type { JoustMinigameDisplayView } from "@wingnight/shared";

import {
  createJoustSoundboard,
  resolveCreak,
  resolveReplayCues,
  type JoustCueName,
  type JoustSoundboard
} from "../audio/index.js";

type JoustSoundsInput = {
  view: JoustMinigameDisplayView;
  /** `useShotReplay`'s fractional frame index into the shot in hand. */
  replayIndex: number;
  replayFinished: boolean;
};

/**
 * The room's sound for a shot, on the TV only: the band creaking as the tablet pulls, the twang
 * as a shot arrives, a clack per pin and a rumble per tower as the replay reaches them, and the
 * fanfare when the rack is cleared. The plaque that follows a shot stings its own hit or miss —
 * except a cleared rack, whose fanfare is that moment and which the plaque leaves `silent`.
 *
 * Every decision is a pure resolver in `audio/`; this is the refs and effects that play them. A
 * display that mounts mid-turn says nothing about what it missed.
 */
export const useJoustSounds = ({ view, replayIndex, replayFinished }: JoustSoundsInput): void => {
  const boardRef = useRef<JoustSoundboard | null>(null);
  const play = useCallback((cue: JoustCueName, intensity?: number): void => {
    boardRef.current ??= createJoustSoundboard();
    boardRef.current.play(cue, intensity);
  }, []);

  // The band. Read only while a shot is not in the air: the aim the view carries during a replay
  // is the one that flew, and it does not creak.
  const magnitude =
    view.lastShot === null ? Math.sqrt(view.aim.x * view.aim.x + view.aim.y * view.aim.y) : null;
  const previousMagnitudeRef = useRef<number | null>(null);

  useEffect(() => {
    const previousMagnitude = previousMagnitudeRef.current;

    previousMagnitudeRef.current = magnitude;

    if (magnitude === null) {
      return;
    }

    const creak = resolveCreak(previousMagnitude, magnitude);

    if (creak !== null) {
      play("creak", creak.intensity);
    }
  }, [magnitude, play]);

  // The shot. Keyed the way the replay is, so snapshot rebroadcasts mid-flight are not launches.
  const shot = view.lastShot;
  const shotKey = shot === null ? null : `${shot.shotNumber}:${shot.run.keyframes.length}`;
  // `undefined` until the first render has been seen: a surface that mounts with a shot already
  // in hand is a reconnect, and the room heard that launch already.
  const previousShotKeyRef = useRef<string | null | undefined>(undefined);
  const reachedIndexRef = useRef(-1);

  useEffect(() => {
    const previousShotKey = previousShotKeyRef.current;

    previousShotKeyRef.current = shotKey;
    reachedIndexRef.current = -1;

    if (previousShotKey === undefined || shotKey === null || shotKey === previousShotKey) {
      return;
    }

    play("launch");
  }, [shotKey, play]);

  // The impacts, as the replay reaches them: the same whole-keyframe reading the scene bursts on.
  const reachedIndex = Math.floor(replayIndex);

  useEffect(() => {
    if (shot === null) {
      return;
    }

    const previousReached = reachedIndexRef.current;

    reachedIndexRef.current = reachedIndex;

    for (const replayCue of resolveReplayCues(shot, previousReached, reachedIndex)) {
      play(replayCue.cue);
    }
    // `shot` is covered by `shotKey`, which resets the reached index above.
  }, [reachedIndex, shotKey, play]);

  // The bonus, once the room has seen the last pin land.
  const isRackCleared = shot?.isRackCleared ?? false;

  useEffect(() => {
    if (replayFinished && isRackCleared && previousShotKeyRef.current !== undefined) {
      play("rackCleared");
    }
  }, [replayFinished, isRackCleared, shotKey, play]);
};
