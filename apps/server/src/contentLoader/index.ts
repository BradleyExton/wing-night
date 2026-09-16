import type { GameConfigFile, MinigameType, Player, Team } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { filterPromptsByRoster } from "./filterPromptsByRoster/index.js";
import { loadGameConfig } from "./loadGameConfig/index.js";
import { loadMinigameContent } from "./loadMinigameContent/index.js";
import { loadPlayers } from "./loadPlayers/index.js";
import { loadTeams } from "./loadTeams/index.js";

type LoadContentOptions = {
  contentRootDir?: string;
};

type LoadedContent = {
  players: Player[];
  teams: Team[];
  gameConfig: GameConfigFile;
  minigameContentById: Partial<Record<MinigameType, SerializableValue>>;
};

export const loadContent = (
  options: LoadContentOptions = {}
): LoadedContent => {
  const players = loadPlayers(options);
  const teams = loadTeams(options);
  const gameConfig = loadGameConfig(options);
  const minigameContentById = loadMinigameContent(options);

  // Applied HERE, at the one place that has both the roster and the prompt
  // banks, so every consumer downstream — room state, the socket payloads, all
  // three runtimes — sees a pack that is already about the people in the room.
  // A runtime doing its own filtering would need player data threaded into it
  // and would have to agree with the other two about the rule.
  return {
    players,
    teams,
    gameConfig,
    minigameContentById: filterPromptsByRoster({ minigameContentById, players })
  };
};
