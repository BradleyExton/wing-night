import { isJoustContentFile, isJoustPrompt } from "@wingnight/shared";
import type { JoustPrompt } from "@wingnight/shared";
import { createPromptContentAdapter } from "@wingnight/minigames-core";

export const joustContentAdapter = createPromptContentAdapter<JoustPrompt>({
  label: "joust",
  fileName: "minigames/joust.json",
  invalidContentHint:
    "expected { prompts: [{ id, name, perches: [{ x, y, width }], obstacles: [{ x, y, width, height, kind? }] }] } with unique ids.",
  isContentFile: isJoustContentFile,
  isPrompt: isJoustPrompt,
  clonePrompt: (prompt) => ({
    id: prompt.id,
    name: prompt.name,
    perches: prompt.perches.map((perch) => ({ ...perch })),
    // `kind` is the prop's skin and rides through untouched; a pack that names none stays
    // without one rather than gaining an explicit undefined.
    obstacles: prompt.obstacles.map((obstacle) => ({
      x: obstacle.x,
      y: obstacle.y,
      width: obstacle.width,
      height: obstacle.height,
      ...(obstacle.kind === undefined ? {} : { kind: obstacle.kind })
    }))
  })
});

export const cloneJoustPrompt = joustContentAdapter.clonePrompt;
export const parseJoustContentFile = joustContentAdapter.parseFileContent;
export const resolveJoustContent = joustContentAdapter.resolveContent;
