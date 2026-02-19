import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { isGameConfigFile, type GameConfigFile } from "@wingnight/shared";
import { loadContentFileWithFallback } from "../loadContentFileWithFallback/index.js";

type LoadGameConfigOptions = {
  contentRootDir?: string;
};

const defaultContentRootDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../content"
);

const parseGameConfig = (
  rawContent: string,
  contentFilePath: string
): GameConfigFile => {
  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(rawContent);
  } catch (error) {
    const parseReason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to parse game config content at "${contentFilePath}": ${parseReason}`
    );
  }

  if (!isGameConfigFile(parsedContent)) {
    throw new Error(
      `Invalid game config content at "${contentFilePath}": expected { name, rounds, minigameScoring, timers, minigameRules? }.`
    );
  }

  return parsedContent;
};

export const loadGameConfig = (
  options: LoadGameConfigOptions = {}
): GameConfigFile => {
  const contentRootDir = options.contentRootDir ?? defaultContentRootDir;
  return loadContentFileWithFallback({
    contentRootDir,
    contentFileName: "gameConfig.json",
    contentLabel: "game config",
    parseFileContent: parseGameConfig
  });
};
