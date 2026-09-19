import {
  isRecreateContentFile,
  isRecreatePrompt,
  type RecreatePrompt
} from "@wingnight/shared";
import { createPromptContentAdapter } from "@wingnight/minigames-core";

export const recreateContentAdapter = createPromptContentAdapter<RecreatePrompt>({
  label: "recreate",
  fileName: "minigames/recreate.json",
  invalidContentHint:
    "expected { prompts: [{ id, title, targetImageSrc, sourceImageSrc?, prompt, ingredients: [2..6 strings] }] }.",
  isContentFile: isRecreateContentFile,
  isPrompt: isRecreatePrompt,
  clonePrompt: (prompt) => ({
    id: prompt.id,
    title: prompt.title,
    targetImageSrc: prompt.targetImageSrc,
    ...(prompt.sourceImageSrc === undefined ? {} : { sourceImageSrc: prompt.sourceImageSrc }),
    prompt: prompt.prompt,
    ingredients: [...prompt.ingredients]
  })
});

export const cloneRecreatePrompt = recreateContentAdapter.clonePrompt;
export const parseRecreateContentFile = recreateContentAdapter.parseFileContent;
export const resolveRecreateContent = recreateContentAdapter.resolveContent;
