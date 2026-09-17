import {
  isPlayersContentFile,
  type Player,
  type PlayersContentEntry
} from "@wingnight/shared";
import { loadContentFileWithFallback } from "../loadContentFileWithFallback/index.js";
import {
  parseContentJson,
  resolveContentRootDir
} from "../contentLoaderUtils/index.js";

type LoadPlayersOptions = {
  contentRootDir?: string;
};

const parsePlayersEntries = (
  rawContent: string,
  contentFilePath: string
): PlayersContentEntry[] => {
  const parsedContent = parseContentJson(rawContent, contentFilePath, "players");

  if (!isPlayersContentFile(parsedContent)) {
    throw new Error(
      `Invalid players content at "${contentFilePath}": expected { players: [{ name, avatarSrc? }] }.`
    );
  }

  return parsedContent.players;
};

const buildPlayer = (entry: PlayersContentEntry, index: number): Player => {
  const normalizedName = entry.name.trim();
  const normalizedAvatarSrc = entry.avatarSrc?.trim();

  if (!normalizedAvatarSrc) {
    return {
      id: `player-${index + 1}`,
      name: normalizedName
    };
  }

  return {
    id: `player-${index + 1}`,
    name: normalizedName,
    avatarSrc: normalizedAvatarSrc
  };
};

// Split from `loadPlayers` so the file is read ONCE and still yields both
// shapes the boot sequence needs: the room-state players, and the raw entries
// whose `team` field seats them. Reading the file twice would let two reads of
// one boot disagree, and `Player` has no `team` — team membership lives on
// `Team.playerIds`, and duplicating it on the player would create a second
// source of truth for the one thing setup mutations rewrite all night.
export const loadPlayerEntries = (
  options: LoadPlayersOptions = {}
): PlayersContentEntry[] => {
  const contentRootDir = options.contentRootDir ?? resolveContentRootDir();

  return loadContentFileWithFallback({
    contentRootDir,
    contentFileName: "players.json",
    contentLabel: "players",
    parseFileContent: parsePlayersEntries
  });
};

// Ids are positional, which is what makes the entry list and this list index-
// aligned — `seatPresetRosters` relies on that pairing.
export const toPlayers = (
  entries: readonly PlayersContentEntry[]
): Player[] => {
  return entries.map((entry, index) => buildPlayer(entry, index));
};

export const loadPlayers = (options: LoadPlayersOptions = {}): Player[] => {
  return toPlayers(loadPlayerEntries(options));
};
