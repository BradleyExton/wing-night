import { isJoustContentFile, isJoustPrompt } from "@wingnight/shared";
import type { JoustPrompt } from "@wingnight/shared";
import { createPromptContentAdapter } from "@wingnight/minigames-core";
import type { MinigameRuntimeContentAdapter, SerializableValue } from "@wingnight/minigames-core";

import { resolveJoustLoadout } from "../loadout/index.js";
import type { JoustRuntimeContent } from "../types/index.js";

const promptAdapter = createPromptContentAdapter<JoustPrompt>({
  label: "joust",
  fileName: "minigames/joust.json",
  invalidContentHint:
    "expected { prompts: [{ id, name, perches: [{ x, y, width }], obstacles: [{ x, y, width, height }] }], shooters?: [{ id, name, blurb, color: { fill, dark, light }, usesPerTurn?, profile? }] } with unique ids.",
  isContentFile: isJoustContentFile,
  isPrompt: isJoustPrompt,
  clonePrompt: (prompt) => ({
    id: prompt.id,
    name: prompt.name,
    perches: prompt.perches.map((perch) => ({ ...perch })),
    obstacles: prompt.obstacles.map((obstacle) => ({
      x: obstacle.x,
      y: obstacle.y,
      width: obstacle.width,
      height: obstacle.height
    }))
  })
});

const readShooters = (content: unknown): unknown => {
  return typeof content === "object" && content !== null && "shooters" in content
    ? content.shooters
    : undefined;
};

/**
 * The prompt-pack adapter carries `prompts` and nothing else — that is what stops an unknown key
 * riding into room state — so the loadout is read alongside it here: strictly at load time (the
 * whole file has already passed `isJoustContentFile`, shooters included) and leniently at
 * runtime, where a kind that fails to read is dropped the way a bad lane is.
 */
export const joustContentAdapter: MinigameRuntimeContentAdapter = {
  fileName: promptAdapter.fileName,
  parseFileContent: (rawContent, contentFilePath): SerializableValue => {
    const parsed = promptAdapter.parseFileContent(rawContent, contentFilePath);

    return {
      prompts: parsed.prompts,
      shooters: resolveJoustLoadout(readShooters(JSON.parse(rawContent)))
    };
  }
};

export const cloneJoustPrompt = promptAdapter.clonePrompt;
export const parseJoustContentFile = (
  rawContent: string,
  contentFilePath: string
): JoustRuntimeContent => {
  return joustContentAdapter.parseFileContent(rawContent, contentFilePath) as JoustRuntimeContent;
};

export const resolveJoustContent = (content: SerializableValue | null): JoustRuntimeContent => {
  return {
    prompts: promptAdapter.resolveContent(content).prompts,
    shooters: resolveJoustLoadout(readShooters(content))
  };
};
