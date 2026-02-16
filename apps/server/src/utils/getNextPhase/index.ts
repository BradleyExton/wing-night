import { Phase } from "@wingnight/shared";

const phaseTransitionMap: Record<Phase, Phase> = {
  [Phase.SETUP]: Phase.INTRO,
  [Phase.INTRO]: Phase.ROUND_INTRO,
  [Phase.ROUND_INTRO]: Phase.EATING,
  [Phase.EATING]: Phase.MINIGAME_INTRO,
  [Phase.MINIGAME_INTRO]: Phase.MINIGAME_PLAY,
  [Phase.MINIGAME_PLAY]: Phase.ROUND_RESULTS,
  // TODO(task-5.2): transition to ROUND_INTRO when additional scheduled rounds remain.
  [Phase.ROUND_RESULTS]: Phase.FINAL_RESULTS,
  [Phase.FINAL_RESULTS]: Phase.FINAL_RESULTS
};

export const getNextPhase = (currentPhase: Phase): Phase => {
  return phaseTransitionMap[currentPhase];
};
