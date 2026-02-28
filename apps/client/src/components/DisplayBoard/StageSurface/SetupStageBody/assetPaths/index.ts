import type { SetupFlowStepId } from "../copy";

const DISPLAY_ASSET_ROOT = "/display";

export const setupHeroIllustrationPath = `${DISPLAY_ASSET_ROOT}/setup/hero.svg`;
export const setupTextureIllustrationPath = `${DISPLAY_ASSET_ROOT}/setup/texture.svg`;

export const flowIllustrationPathByStepId: Record<SetupFlowStepId, string> = {
  MINIGAME_INTRO: `${DISPLAY_ASSET_ROOT}/setup/flow-minigame-intro.svg`,
  EAT_WINGS: `${DISPLAY_ASSET_ROOT}/setup/flow-eat-wings.svg`,
  MINIGAME_PLAY: `${DISPLAY_ASSET_ROOT}/setup/flow-minigame-play.svg`,
  ROUND_RESULTS: `${DISPLAY_ASSET_ROOT}/setup/flow-round-results.svg`
};
