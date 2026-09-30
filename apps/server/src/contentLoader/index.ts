import type { GameConfigFile, MinigameType, Player, Team } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { filterPromptsByRoster } from "./filterPromptsByRoster/index.js";
import { loadGameConfig } from "./loadGameConfig/index.js";
import { loadEatingPlaylist, loadLobbyPlaylist } from "./loadAudioPlaylist/index.js";
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
  lobbyPlaylist: string[];
  eatingPlaylist: string[];
  gameConfig: GameConfigFile;
  minigameContentById: Partial<Record<MinigameType, SerializableValue>>;
};

// The pack as authored — every prompt, whoever it features. Only the config
// wizard wants this: it writes the prompt banks back to disk, and reading them
// through the roster filter would delete every prompt about someone who is
// not here tonight.
export const loadPackContent = (
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

  return {
    players,
    teams,
    lobbyPlaylist: loadLobbyPlaylist(options),
    eatingPlaylist: loadEatingPlaylist(options),
    gameConfig: loadGameConfig(options),
    minigameContentById: loadMinigameContent(options)
  };
};

export const loadContent = (
  options: LoadContentOptions = {}
): LoadedContent => {
  const content = loadPackContent(options);

  // Applied HERE, at the one place that has both the roster and the prompt
  // banks, so every consumer downstream — room state, the socket payloads, every
  // runtime — sees a pack that is already about the people in the room.
  // A runtime doing its own filtering would need player data threaded into it
  // and would have to agree with the others about the rule.
  return {
    ...content,
    minigameContentById: filterPromptsByRoster({
      minigameContentById: content.minigameContentById,
      players: content.players
    })
  };
};
