import type { TeamTurnLoopStepId } from "../copy";

const DISPLAY_ASSET_ROOT = "/display";

export const setupRoundStartIllustrationPath = `${DISPLAY_ASSET_ROOT}/setup/flow-round-intro.png`;
export const setupRoundEndIllustrationPath = `${DISPLAY_ASSET_ROOT}/setup/flow-round-results.png`;

export const teamTurnLoopIllustrationPathByStepId: Record<TeamTurnLoopStepId, string> = {
  MINIGAME_INTRO: `${DISPLAY_ASSET_ROOT}/setup/flow-minigame-intro.png`,
  EAT_WINGS: `${DISPLAY_ASSET_ROOT}/setup/flow-eat-wings.png`,
  MINIGAME_PLAY: `${DISPLAY_ASSET_ROOT}/setup/flow-minigame-play.png`,
  TURN_RESULTS: `${DISPLAY_ASSET_ROOT}/setup/flow-round-results.png`
};
