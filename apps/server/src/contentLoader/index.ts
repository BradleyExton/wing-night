import type { GameConfigFile, Player, TriviaPrompt } from "@wingnight/shared";

import { loadGameConfig } from "./loadGameConfig/index.js";
import { loadPlayers } from "./loadPlayers/index.js";
import { loadTrivia } from "./loadTrivia/index.js";

type LoadContentOptions = {
  contentRootDir?: string;
};

type LoadedContent = {
  players: Player[];
  gameConfig: GameConfigFile;
  triviaPrompts: TriviaPrompt[];
};

export const loadContent = (
  options: LoadContentOptions = {}
): LoadedContent => {
  const players = loadPlayers(options);
  const gameConfig = loadGameConfig(options);
  const triviaPrompts = loadTrivia(options);

  return {
    players,
    gameConfig,
    triviaPrompts
  };
};
