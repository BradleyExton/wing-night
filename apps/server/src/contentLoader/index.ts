import type { GameConfigFile, MinigameType, Player } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { loadGameConfig } from "./loadGameConfig/index.js";
import { loadMinigameContent } from "./loadMinigameContent/index.js";
import { loadPlayers } from "./loadPlayers/index.js";

type LoadContentOptions = {
  contentRootDir?: string;
};

type LoadedContent = {
  players: Player[];
  gameConfig: GameConfigFile;
  minigameContentById: Partial<Record<MinigameType, SerializableValue>>;
};

export const loadContent = (
  options: LoadContentOptions = {}
): LoadedContent => {
  const players = loadPlayers(options);
  const gameConfig = loadGameConfig(options);
  const minigameContentById = loadMinigameContent(options);

  return {
    players,
    gameConfig,
    minigameContentById
  };
};
