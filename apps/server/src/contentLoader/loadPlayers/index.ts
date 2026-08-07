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

export const loadPlayers = (options: LoadPlayersOptions = {}): Player[] => {
  const contentRootDir = options.contentRootDir ?? resolveContentRootDir();
  const entries = loadContentFileWithFallback({
    contentRootDir,
    contentFileName: "players.json",
    contentLabel: "players",
    parseFileContent: parsePlayersEntries
  });

  return entries.map((entry, index) => buildPlayer(entry, index));
};
