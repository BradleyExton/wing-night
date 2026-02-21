import { isGameConfigFile, type GameConfigFile } from "@wingnight/shared";
import {
  parseContentJson,
  resolveDefaultContentRootDir
} from "../contentLoaderUtils/index.js";
import { loadContentFileWithFallback } from "../loadContentFileWithFallback/index.js";

type LoadGameConfigOptions = {
  contentRootDir?: string;
};

const defaultContentRootDir = resolveDefaultContentRootDir(import.meta.url);

const parseGameConfig = (
  rawContent: string,
  contentFilePath: string
): GameConfigFile => {
  const parsedContent = parseContentJson(rawContent, contentFilePath, "game config");

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
