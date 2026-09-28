import type { HouseCueName } from "@wingnight/audio";
import { Phase } from "@wingnight/shared";

// What the show itself sounds like between the games, on the TV: the noises
// that belong to the night's structure rather than to any minigame. Pure, so
// the hook that plays them (`DisplayBoard/useShowSounds`) is refs and effects
// and nothing else.
//
// `null` for the previous reading on both, deliberately: a display that
// mounts — or refreshes — mid-phase says nothing about how it got there, the
// same rule the TV clock's first reading follows.

export type ShowPhaseCue = Extract<HouseCueName, "whoosh" | "gong" | "results" | "fanfare">;

// A change of phase. Wings on the table get the gong, the two results screens
// the scores-are-in sting, the finale the fanfare, and every other move a
// swoosh of air — the transition itself, under whatever the next screen
// starts (an anthem, a briefing).
export const resolvePhaseCue = (
  previousPhase: Phase | null,
  phase: Phase | null
): ShowPhaseCue | null => {
  if (previousPhase === null || phase === null || phase === previousPhase) {
    return null;
  }

  switch (phase) {
    case Phase.EATING:
      return "gong";
    case Phase.TURN_RESULTS:
    case Phase.ROUND_RESULTS:
      return "results";
    case Phase.FINAL_RESULTS:
      return "fanfare";
    case Phase.SETUP:
    case Phase.INTRO:
    case Phase.MINIGAME_INTRO:
    case Phase.MINIGAME_PLAY:
      return "whoosh";
  }
};

// The seconds the count-in ticks on: three, two, one.
export const COUNT_IN_TICK_FROM_SECONDS = 3;

export type CountInCue = Extract<HouseCueName, "tick" | "go">;

// The server's count-in on the lock screen. A tick on each of the last three
// seconds and the starting pistol as it lands — which reads as the countdown
// going from one to nothing, because an expired count-in is `null`, not zero
// (`resolveGameStartCountdownSeconds`). A count-in that vanishes from higher
// up was cancelled, and says nothing.
export const resolveCountInCue = (
  previousRemainingSeconds: number | null,
  remainingSeconds: number | null
): CountInCue | null => {
  if (previousRemainingSeconds === null || remainingSeconds === previousRemainingSeconds) {
    return null;
  }

  if (remainingSeconds === null) {
    return previousRemainingSeconds === 1 ? "go" : null;
  }

  if (remainingSeconds <= COUNT_IN_TICK_FROM_SECONDS && remainingSeconds < previousRemainingSeconds) {
    return "tick";
  }

  return null;
};
