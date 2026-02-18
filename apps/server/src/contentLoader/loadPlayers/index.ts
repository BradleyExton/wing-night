import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isPlayersContentFile,
  type Player,
  type PlayersContentEntry
} from "@wingnight/shared";
import { loadContentFileWithFallback } from "../loadContentFileWithFallback/index.js";

type LoadPlayersOptions = {
  contentRootDir?: string;
};

const defaultContentRootDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../content"
);

const parsePlayersEntries = (
  rawContent: string,
  contentFilePath: string
): PlayersContentEntry[] => {
  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(rawContent);
  } catch (error) {
    const parseReason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to parse players content at "${contentFilePath}": ${parseReason}`
    );
  }

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
  const contentRootDir = options.contentRootDir ?? defaultContentRootDir;
  const entries = loadContentFileWithFallback({
    contentRootDir,
    contentFileName: "players.json",
    contentLabel: "players",
    parseFileContent: parsePlayersEntries
  });

  return entries.map((entry, index) => buildPlayer(entry, index));
};
