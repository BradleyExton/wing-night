import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { MinigameType } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { resolveMinigameRuntimePlugin } from "../../minigames/registry/index.js";
import { loadContentFileWithFallback } from "../loadContentFileWithFallback/index.js";

type LoadMinigameContentOptions = {
  contentRootDir?: string;
};

const defaultContentRootDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../content"
);

const MINIGAME_TYPES: MinigameType[] = ["TRIVIA", "GEO", "DRAWING"];

export const loadMinigameContent = (
  options: LoadMinigameContentOptions = {}
): Partial<Record<MinigameType, SerializableValue>> => {
  const contentRootDir = options.contentRootDir ?? defaultContentRootDir;
  const minigameContentById: Partial<Record<MinigameType, SerializableValue>> = {};

  for (const minigameType of MINIGAME_TYPES) {
    const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);

    if (runtimePlugin.content === undefined) {
      continue;
    }

    minigameContentById[minigameType] = loadContentFileWithFallback({
      contentRootDir,
      contentFileName: runtimePlugin.content.fileName,
      contentLabel: `${minigameType.toLowerCase()} minigame`,
      parseFileContent: runtimePlugin.content.parseFileContent
    });
  }

  return minigameContentById;
};
