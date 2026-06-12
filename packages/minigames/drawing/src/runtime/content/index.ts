import {
  isDrawingContentFile,
  isDrawingPrompt,
  type DrawingPrompt
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { DrawingRuntimeContent } from "../types/index.js";

export const cloneDrawingPrompt = (prompt: DrawingPrompt): DrawingPrompt => {
  return {
    id: prompt.id,
    prompt: prompt.prompt
  };
};

export const parseDrawingContentFile = (
  rawContent: string,
  contentFilePath: string
): DrawingRuntimeContent => {
  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(rawContent);
  } catch (error) {
    const parseReason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to parse drawing content at "${contentFilePath}": ${parseReason}`
    );
  }

  if (!isDrawingContentFile(parsedContent)) {
    throw new Error(
      `Invalid drawing content at "${contentFilePath}": expected { prompts: [{ id, prompt }] } with unique, non-empty ids and prompts.`
    );
  }

  return {
    prompts: parsedContent.prompts.map(cloneDrawingPrompt)
  };
};

export const resolveDrawingContent = (
  content: SerializableValue | null
): DrawingRuntimeContent => {
  if (typeof content !== "object" || content === null) {
    return { prompts: [] };
  }

  if (!("prompts" in content) || !Array.isArray(content.prompts)) {
    return { prompts: [] };
  }

  const prompts = content.prompts.filter((prompt): prompt is DrawingPrompt => {
    return isDrawingPrompt(prompt);
  });

  return {
    prompts: prompts.map(cloneDrawingPrompt)
  };
};
