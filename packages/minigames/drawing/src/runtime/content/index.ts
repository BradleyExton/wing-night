import {
  isDrawingContentFile,
  isDrawingPrompt,
  type DrawingPrompt
} from "@wingnight/shared";
import { createPromptContentAdapter } from "@wingnight/minigames-core";

export const drawingContentAdapter = createPromptContentAdapter<DrawingPrompt>({
  label: "drawing",
  fileName: "minigames/drawing.json",
  invalidContentHint:
    "expected { prompts: [{ id, prompt }] } with unique, non-empty ids and prompts.",
  isContentFile: isDrawingContentFile,
  isPrompt: isDrawingPrompt,
  clonePrompt: (prompt) => ({
    id: prompt.id,
    prompt: prompt.prompt
  })
});

export const cloneDrawingPrompt = drawingContentAdapter.clonePrompt;
export const parseDrawingContentFile = drawingContentAdapter.parseFileContent;
export const resolveDrawingContent = drawingContentAdapter.resolveContent;
