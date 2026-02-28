import type { TeamTurnLoopStepId } from "../copy";

const DISPLAY_ASSET_ROOT = "/display";

export const setupHeroIllustrationPath = `${DISPLAY_ASSET_ROOT}/setup/hero.png`;
export const setupRoundStartIllustrationPath = `${DISPLAY_ASSET_ROOT}/setup/flow-round-intro.svg`;
export const setupRoundEndIllustrationPath = `${DISPLAY_ASSET_ROOT}/setup/flow-round-results.svg`;

export const teamTurnLoopIllustrationPathByStepId: Record<TeamTurnLoopStepId, string> = {
  MINIGAME_INTRO: `${DISPLAY_ASSET_ROOT}/setup/flow-minigame-intro.svg`,
  EAT_WINGS: `${DISPLAY_ASSET_ROOT}/setup/flow-eat-wings.svg`,
  MINIGAME_PLAY: `${DISPLAY_ASSET_ROOT}/setup/flow-minigame-play.svg`
};
