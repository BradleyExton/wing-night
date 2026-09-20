import { Phase } from "@wingnight/shared";
import { useEffect, useRef, useState } from "react";

const DEFAULT_GAME_START_COUNTDOWN_SECONDS = 3;
const COUNTDOWN_TICK_MS = 1000;

// The count-in belongs to the first screen of the night's first round, which is
// now the round-one team briefing: INTRO -> MINIGAME_INTRO with the round just
// turned over to 1. Later rounds reach MINIGAME_INTRO too, and the round check
// is what keeps them from counting in again.
export const shouldStartGameStartCountdown = (
  previousPhase: Phase | null,
  currentPhase: Phase | null,
  currentRound: number | null
): boolean => {
  return (
    previousPhase === Phase.INTRO &&
    currentPhase === Phase.MINIGAME_INTRO &&
    currentRound === 1
  );
};

export const shouldCancelGameStartCountdown = (
  currentPhase: Phase | null
): boolean => {
  return currentPhase !== Phase.MINIGAME_INTRO;
};

type UseGameStartCountdownProps = {
  phase: Phase | null;
  currentRound: number | null;
  countdownSeconds?: number;
};

export const useGameStartCountdown = ({
  phase,
  currentRound,
  countdownSeconds = DEFAULT_GAME_START_COUNTDOWN_SECONDS
}: UseGameStartCountdownProps): number | null => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const previousPhaseRef = useRef<Phase | null>(phase);

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;
    previousPhaseRef.current = phase;

    if (remainingSeconds !== null && shouldCancelGameStartCountdown(phase)) {
      setRemainingSeconds(null);
      return;
    }

    if (shouldStartGameStartCountdown(previousPhase, phase, currentRound)) {
      setRemainingSeconds(countdownSeconds);
    }
  }, [phase, currentRound, countdownSeconds, remainingSeconds]);

  useEffect(() => {
    if (remainingSeconds === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRemainingSeconds((currentValue) => {
        if (currentValue === null || currentValue <= 1) {
          return null;
        }

        return currentValue - 1;
      });
    }, COUNTDOWN_TICK_MS);

    return (): void => {
      window.clearTimeout(timeoutId);
    };
  }, [remainingSeconds]);

  return remainingSeconds;
};
