import {
  isGameConfigFile,
  MINIGAME_DEFINITIONS,
  MINIGAME_TYPES,
  type GameConfigFile
} from "@wingnight/shared";

import { resolveMinigameRuntimePlugin } from "../../minigames/registry/index.js";
import {
  parseContentJson,
  resolveDefaultContentRootDir
} from "../contentLoaderUtils/index.js";
import { loadContentFileWithFallback } from "../loadContentFileWithFallback/index.js";

type LoadGameConfigOptions = {
  contentRootDir?: string;
};

const defaultContentRootDir = resolveDefaultContentRootDir(import.meta.url);

// Per-game rules schemas are owned by each runtime plugin; validating here
// keeps the fail-fast contract (invalid content blocks start at load time).
const assertMinigameRulesAreValid = (
  gameConfig: GameConfigFile,
  contentFilePath: string
): void => {
  for (const minigameType of MINIGAME_TYPES) {
    const { rulesKey } = MINIGAME_DEFINITIONS[minigameType];

    if (rulesKey === null) {
      continue;
    }

    const configuredRules = gameConfig.minigameRules?.[rulesKey];

    if (configuredRules === undefined) {
      continue;
    }

    const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);

    if (runtimePlugin.isRules !== undefined && !runtimePlugin.isRules(configuredRules)) {
      throw new Error(
        `Invalid game config content at "${contentFilePath}": minigameRules.${rulesKey} failed ${minigameType} rules validation.`
      );
    }
  }
};

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

  assertMinigameRulesAreValid(parsedContent, contentFilePath);

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
