import type { GameConfigFile, MinigameType, Player } from "@wingnight/shared";

import {
  getMinigameRegistryDescriptor,
  type MinigameLoadedContent
} from "../minigames/registry/index.js";
import { loadGameConfig } from "./loadGameConfig/index.js";
import { loadPlayers } from "./loadPlayers/index.js";

type LoadContentOptions = {
  contentRootDir?: string;
};

export type LoadedMinigameContentById = Partial<
  Record<MinigameType, MinigameLoadedContent>
>;

type LoadedContent = {
  players: Player[];
  gameConfig: GameConfigFile;
  minigameContentById: LoadedMinigameContentById;
};

const resolveConfiguredMinigameIds = (
  gameConfig: GameConfigFile
): MinigameType[] => {
  const configuredMinigameIds = new Set<MinigameType>();

  for (const round of gameConfig.rounds) {
    configuredMinigameIds.add(round.minigame);
  }

  return [...configuredMinigameIds];
};

const loadMinigameContentById = (
  gameConfig: GameConfigFile,
  options: LoadContentOptions
): LoadedMinigameContentById => {
  const minigameContentById: LoadedMinigameContentById = {};

  for (const minigameId of resolveConfiguredMinigameIds(gameConfig)) {
    const descriptor = getMinigameRegistryDescriptor(minigameId);

    try {
      minigameContentById[minigameId] = descriptor.loadContent(options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to load minigame content (minigameId=${minigameId}): ${errorMessage}`
      );
    }
  }

  return minigameContentById;
};

export const loadContent = (
  options: LoadContentOptions = {}
): LoadedContent => {
  const players = loadPlayers(options);
  const gameConfig = loadGameConfig(options);
  const minigameContentById = loadMinigameContentById(gameConfig, options);

  return {
    players,
    gameConfig,
    minigameContentById
  };
};
