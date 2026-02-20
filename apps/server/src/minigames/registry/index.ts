import { triviaMinigameModule } from "@wingnight/minigames-trivia/runtime";
import type { MinigameType } from "@wingnight/shared";
import { MINIGAME_API_VERSION } from "@wingnight/shared";
import type { MinigamePluginMetadata } from "@wingnight/minigames-core";

export type ResolvedMinigameModule = typeof triviaMinigameModule;
export type ResolvedMinigameDescriptor = {
  module: ResolvedMinigameModule | null;
  metadata: MinigamePluginMetadata;
};

const unsupportedMetadata: MinigamePluginMetadata = {
  minigameApiVersion: MINIGAME_API_VERSION,
  capabilities: {
    supportsHostRenderer: true,
    supportsDisplayRenderer: true,
    supportsDevScenarios: true
  }
};

export const resolveMinigameModule = (
  minigameType: MinigameType
): ResolvedMinigameModule | null => {
  return resolveMinigameDescriptor(minigameType).module;
};

export const resolveMinigameDescriptor = (
  minigameType: MinigameType
): ResolvedMinigameDescriptor => {
  if (minigameType === "TRIVIA") {
    return {
      module: triviaMinigameModule,
      metadata: triviaMinigameModule.metadata ?? unsupportedMetadata
    };
  }

  return {
    module: null,
    metadata: unsupportedMetadata
  };
};
