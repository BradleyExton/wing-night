import type { Phase } from "@wingnight/shared";
import { useHouseSoundboard } from "@wingnight/surface";
import { useEffect, useRef } from "react";

import { resolveCountInCue, resolvePhaseCue } from "../../../utils/resolveShowCue";

type UseShowSoundsProps = {
  phase: Phase | null;
  gameStartCountdownRemainingSeconds: number | null;
};

// The show's own sound on the TV: a swoosh, a gong, a sting or a fanfare as
// the night moves phase, and the count-in's ticks and starting pistol on the
// lock screen. Which change says what is `resolveShowCue`'s, pure and tested;
// this is the refs and the effects that play it, on the house board.
export const useShowSounds = ({
  phase,
  gameStartCountdownRemainingSeconds
}: UseShowSoundsProps): void => {
  const play = useHouseSoundboard();
  const previousPhaseRef = useRef<Phase | null>(null);
  const previousCountInRef = useRef<number | null>(null);

  useEffect(() => {
    const cue = resolvePhaseCue(previousPhaseRef.current, phase);

    previousPhaseRef.current = phase;

    if (cue !== null) {
      play(cue);
    }
  }, [phase, play]);

  useEffect(() => {
    const cue = resolveCountInCue(previousCountInRef.current, gameStartCountdownRemainingSeconds);

    previousCountInRef.current = gameStartCountdownRemainingSeconds;

    if (cue !== null) {
      play(cue);
    }
  }, [gameStartCountdownRemainingSeconds, play]);
};
