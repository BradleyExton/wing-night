import { useEffect, useRef } from "react";

import {
  createClockSoundboard,
  type ClockSoundboard
} from "../../../../utils/createClockSoundboard";
import { resolveClockSoundCue } from "../../../../utils/resolveClockSoundCue";

// The voice of the TV's turn clock: a tick from the display's speaker on each
// of the last ten seconds and a buzzer at zero. Driven by the same seconds as
// `MinigameTimerChip` and `MinigameTimerLine` — `useMinigameCountdown`'s — and
// composed beside them by `MinigameStageBody`, so the room hears the second
// it sees. Which second says what is `resolveClockSoundCue`'s, pure and
// tested; this is the ref and the effect that play it.
//
// A room with no clock (`null`) stays silent, the same rule that makes the
// chip render nothing. A paused clock holds its second, so it holds its
// tongue. Sound ignores `prefers-reduced-motion`: that is a motion preference,
// and the last ten seconds are still the loudest thing on the TV.
//
// The board is made on the first cue, not on mount, and kept in a ref: the
// stage body remounts between turns and must not leave a trail of boards —
// though the AudioContext under them is one per module regardless.
export const useMinigameClockSound = (remainingSeconds: number | null): void => {
  const previousRemainingRef = useRef<number | null>(null);
  const soundboardRef = useRef<ClockSoundboard | null>(null);

  useEffect(() => {
    const previousRemaining = previousRemainingRef.current;

    previousRemainingRef.current = remainingSeconds;

    const cue = resolveClockSoundCue(previousRemaining, remainingSeconds);

    if (cue === null) {
      return;
    }

    if (soundboardRef.current === null) {
      soundboardRef.current = createClockSoundboard();
    }

    soundboardRef.current.play(cue);
  }, [remainingSeconds]);
};
