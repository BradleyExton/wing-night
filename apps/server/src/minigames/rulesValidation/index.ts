import {
  MINIGAME_DEFINITIONS,
  MINIGAME_TYPES,
  type MinigameType
} from "@wingnight/shared";

import { resolveMinigameRuntimePlugin } from "../registry/index.js";

// Inverse of the shared registry's rulesKey mapping. The shared validator
// reports a rules failure at `minigameRules.<rulesKey>`; callers that need to
// name the minigame in a message have to get back from one to the other.
export const MINIGAME_TYPE_BY_RULES_KEY: Readonly<
  Record<string, MinigameType>
> = Object.freeze(
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
//
// It lives here rather than inside `loadGameConfig` because BOTH sides of the
// content lifecycle need it: the loader validates what it reads, and
// `contentWriter` validates what it is about to write. Called bare,
// `validateGameConfigFile` does not check `minigameRules` at all, so a writer
// that omitted this seam would let a plugin-rejected config land on disk and
// fatal every subsequent boot.
export const isRulesValidForKey = (
  rulesKey: string,
  rules: unknown
): boolean => {
  const minigameType = MINIGAME_TYPE_BY_RULES_KEY[rulesKey];

  if (minigameType === undefined) {
    return true;
  }

  const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);

  return runtimePlugin.isRules === undefined || runtimePlugin.isRules(rules);
};
