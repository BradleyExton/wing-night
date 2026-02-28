import { Phase } from "@wingnight/shared";

const phaseTransitionMap: Record<Phase, Phase> = {
  [Phase.SETUP]: Phase.INTRO,
  [Phase.INTRO]: Phase.ROUND_INTRO,
  [Phase.ROUND_INTRO]: Phase.MINIGAME_INTRO,
  [Phase.MINIGAME_INTRO]: Phase.EATING,
  [Phase.EATING]: Phase.MINIGAME_PLAY,
  [Phase.MINIGAME_PLAY]: Phase.ROUND_RESULTS,
  [Phase.ROUND_RESULTS]: Phase.FINAL_RESULTS,
  [Phase.FINAL_RESULTS]: Phase.FINAL_RESULTS
};

export const getNextPhase = (
  currentPhase: Phase,
  currentRound: number,
  totalRounds: number
): Phase => {
  if (currentPhase === Phase.ROUND_RESULTS) {
    return currentRound < totalRounds ? Phase.ROUND_INTRO : Phase.FINAL_RESULTS;
  }

  return phaseTransitionMap[currentPhase];
};
