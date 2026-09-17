import type { GameConfigFile, MinigameType, Player, Team } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { filterPromptsByRoster } from "./filterPromptsByRoster/index.js";
import { loadGameConfig } from "./loadGameConfig/index.js";
import { loadMinigameContent } from "./loadMinigameContent/index.js";
import { loadPlayerEntries, toPlayers } from "./loadPlayers/index.js";
import { loadTeams } from "./loadTeams/index.js";
import { seatPresetRosters } from "./seatPresetRosters/index.js";

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
  // The two roster files are loaded separately and joined here, because the
  // join is the only place both are in hand: a player entry's `team` seats them
  // on the matching team's `playerIds`.
  const playerEntries = loadPlayerEntries(options);
  const players = toPlayers(playerEntries);
  const teams = seatPresetRosters({
    playerEntries,
    players,
    teams: loadTeams(options)
  });
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
