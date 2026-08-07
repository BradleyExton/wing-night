import {
  isGameConfigFile,
  validateGameConfigFile,
  type GameConfigFile
} from "@wingnight/shared";

import {
  isRulesValidForKey,
  MINIGAME_TYPE_BY_RULES_KEY
} from "../../minigames/rulesValidation/index.js";
import {
  parseContentJson,
  DEFAULT_CONTENT_ROOT_DIR
} from "../contentLoaderUtils/index.js";
import { loadContentFileWithFallback } from "../loadContentFileWithFallback/index.js";

type LoadGameConfigOptions = {
  contentRootDir?: string;
};

const MINIGAME_RULES_ISSUE_PREFIX = "minigameRules.";

// Keeps the fail-fast contract: invalid content blocks start at load time.
const assertMinigameRulesAreValid = (
  gameConfig: GameConfigFile,
  contentFilePath: string
): void => {
  const issues = validateGameConfigFile(gameConfig, {
    validateRules: isRulesValidForKey
  });

  for (const issue of issues) {
    if (!issue.path.startsWith(MINIGAME_RULES_ISSUE_PREFIX)) {
      continue;
    }

    const rulesKey = issue.path.slice(MINIGAME_RULES_ISSUE_PREFIX.length);
    const minigameType = MINIGAME_TYPE_BY_RULES_KEY[rulesKey];

    if (minigameType === undefined) {
      continue;
    }

    throw new Error(
      `Invalid game config content at "${contentFilePath}": minigameRules.${rulesKey} failed ${minigameType} rules validation.`
    );
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
  const contentRootDir = options.contentRootDir ?? DEFAULT_CONTENT_ROOT_DIR;
  return loadContentFileWithFallback({
    contentRootDir,
    contentFileName: "gameConfig.json",
    contentLabel: "game config",
    parseFileContent: parseGameConfig
  });
};
