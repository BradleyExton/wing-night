import { Phase } from "@wingnight/shared";

export type HostRenderMode =
  | "waiting"
  | "setup"
  | "setup_locked"
  | "eating"
  | "minigame_intro"
  | "minigame_play"
  | "compact";

const HOST_RENDER_MODE_BY_PHASE: Record<Phase, HostRenderMode> = {
  [Phase.SETUP]: "setup",
  [Phase.INTRO]: "setup_locked",
  [Phase.ROUND_INTRO]: "compact",
  [Phase.EATING]: "eating",
  [Phase.MINIGAME_INTRO]: "minigame_intro",
  [Phase.MINIGAME_PLAY]: "minigame_play",
  [Phase.TURN_RESULTS]: "compact",
  [Phase.ROUND_RESULTS]: "compact",
  [Phase.FINAL_RESULTS]: "compact"
};

export const resolveHostRenderMode = (phase: Phase | null): HostRenderMode => {
  return phase === null ? "waiting" : HOST_RENDER_MODE_BY_PHASE[phase];
};
