import { useHouseSoundboard } from "@wingnight/surface";
import { useEffect, useRef } from "react";

// Beeps once on the host tablet the moment a running countdown crosses zero.
// The `chime` house cue, on the tablet's own board: quiet and three notes,
// because the tablet is a foot from the host's ear — the room hears the TV's
// buzzer instead, and neither is the other.
export const useTimesUpChime = (remainingSeconds: number | null): void => {
  const previousRemainingRef = useRef<number | null>(null);
  const play = useHouseSoundboard();

  useEffect(() => {
    const previousRemaining = previousRemainingRef.current;
    previousRemainingRef.current = remainingSeconds;

    if (remainingSeconds === null || remainingSeconds > 0) {
      return;
    }

    if (previousRemaining === null || previousRemaining <= 0) {
      return;
    }

    play("chime");
  }, [play, remainingSeconds]);
};
