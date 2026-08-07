// Entry point for the game config contract: consumers import the folder, not
// the files inside it. Split in two so the validator can depend on the minigame
// registry without a cycle back through this barrel.
export {
  MINIGAME_API_VERSION,
  MINIGAME_DEFINITIONS,
  MINIGAME_TYPE_BY_SLUG,
  MINIGAME_TYPES,
  resolveMinigameDefinition,
  resolveMinigameTypeFromSlug
} from "./minigameDefinitions/index.js";
export type {
  MinigameApiVersion,
  MinigameContractMetadataDefaults,
  MinigameDefinition,
  MinigameRulesKey,
  MinigameTimerKey,
  MinigameType
} from "./minigameDefinitions/index.js";

export {
  isGameConfigFile,
  SETUP_PREVIEW_ROUND_SLOTS_MAX,
  validateGameConfigFile
} from "./validateGameConfigFile/index.js";
export type {
  GameConfigFile,
  GameConfigRound,
  GameConfigScoring,
  GameConfigTimers,
  MinigameRuleRecord,
  MinigameRules,
  ValidateGameConfigFileOptions,
  ValidateMinigameRules
} from "./validateGameConfigFile/index.js";
