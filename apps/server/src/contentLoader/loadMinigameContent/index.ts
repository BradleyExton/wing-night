import {
  MINIGAME_TYPES,
  type MinigameType
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { resolveMinigameRuntimePlugin } from "../../minigames/registry/index.js";
import { DEFAULT_CONTENT_ROOT_DIR } from "../contentLoaderUtils/index.js";
import { loadContentFileWithFallback } from "../loadContentFileWithFallback/index.js";

type LoadMinigameContentOptions = {
  contentRootDir?: string;
};

export const loadMinigameContent = (
  options: LoadMinigameContentOptions = {}
): Partial<Record<MinigameType, SerializableValue>> => {
  const contentRootDir = options.contentRootDir ?? DEFAULT_CONTENT_ROOT_DIR;
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
