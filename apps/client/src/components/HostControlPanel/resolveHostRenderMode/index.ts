import { Phase } from "@wingnight/shared";

export type HostRenderMode =
  | "waiting"
  | "setup"
  | "eating"
  | "minigame_intro"
  | "minigame_play"
  | "compact";

const assertUnreachable = (value: never): never => {
  throw new Error(`Unhandled value: ${String(value)}`);
};

export const resolveHostRenderMode = (phase: Phase | null): HostRenderMode => {
  switch (phase) {
    case null:
      return "waiting";
    case Phase.SETUP:
      return "setup";
    case Phase.EATING:
      return "eating";
    case Phase.MINIGAME_INTRO:
      return "minigame_intro";
    case Phase.MINIGAME_PLAY:
      return "minigame_play";
    case Phase.INTRO:
    case Phase.ROUND_INTRO:
    case Phase.ROUND_RESULTS:
    case Phase.FINAL_RESULTS:
      return "compact";
    default:
      return assertUnreachable(phase);
  }
};
