import {
  isGameConfigFile,
  MINIGAME_DEFINITIONS,
  MINIGAME_TYPES,
  validateGameConfigFile,
  type GameConfigFile,
  type MinigameType
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

const MINIGAME_RULES_ISSUE_PREFIX = "minigameRules.";

// Inverse of the shared registry's rulesKey mapping. The shared validator
// reports a rules failure at `minigameRules.<rulesKey>`; the fail-fast message
// below names the minigame, so we have to get back from one to the other.
const MINIGAME_TYPE_BY_RULES_KEY: Readonly<Record<string, MinigameType>> =
  Object.freeze(
    MINIGAME_TYPES.reduce<Record<string, MinigameType>>(
      (typeByRulesKey, minigameType) => {
        const { rulesKey } = MINIGAME_DEFINITIONS[minigameType];

        if (rulesKey !== null) {
          typeByRulesKey[rulesKey] = minigameType;
        }

        return typeByRulesKey;
      },
      {}
    )
  );

// Per-game rules schemas are owned by each runtime plugin. `packages/shared`
// cannot resolve a plugin (it has no dependencies, and the minigame packages
// depend on IT), so the server supplies this as the validator's rules seam —
// one implementation of the rule, injected from the side that can see plugins.
const isRulesValidForKey = (rulesKey: string, rules: unknown): boolean => {
  const minigameType = MINIGAME_TYPE_BY_RULES_KEY[rulesKey];

  if (minigameType === undefined) {
    return true;
  }

  const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);

  return (
    runtimePlugin.isRules === undefined || runtimePlugin.isRules(rules)
  );
};

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
  const contentRootDir = options.contentRootDir ?? defaultContentRootDir;
  return loadContentFileWithFallback({
    contentRootDir,
    contentFileName: "gameConfig.json",
    contentLabel: "game config",
    parseFileContent: parseGameConfig
  });
};
