import {
  isTriviaContentFile,
  isTriviaPrompt,
  type TriviaPrompt
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { TriviaRuntimeContent } from "../types/index.js";

export const cloneTriviaPrompt = (prompt: TriviaPrompt): TriviaPrompt => {
  return {
    id: prompt.id,
    question: prompt.question,
    answer: prompt.answer
  };
};

export const parseTriviaContentFile = (
  rawContent: string,
  contentFilePath: string
): TriviaRuntimeContent => {
  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(rawContent);
  } catch (error) {
    const parseReason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to parse trivia content at "${contentFilePath}": ${parseReason}`
    );
  }

  if (!isTriviaContentFile(parsedContent)) {
    throw new Error(
      `Invalid trivia content at "${contentFilePath}": expected { prompts: [{ id, question, answer }] }.`
    );
  }

  return {
    prompts: parsedContent.prompts.map(cloneTriviaPrompt)
  };
};

export const resolveTriviaContent = (
  content: SerializableValue | null
): TriviaRuntimeContent => {
  if (typeof content !== "object" || content === null) {
    return { prompts: [] };
  }

  if (!("prompts" in content) || !Array.isArray(content.prompts)) {
    return { prompts: [] };
  }

  const prompts = content.prompts.filter((prompt): prompt is TriviaPrompt => {
    return isTriviaPrompt(prompt);
  });

  return {
    prompts: prompts.map(cloneTriviaPrompt)
  };
};
