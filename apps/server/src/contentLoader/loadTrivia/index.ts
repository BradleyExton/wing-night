import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { isTriviaContentFile, type TriviaPrompt } from "@wingnight/shared";
import { loadContentFileWithFallback } from "../loadContentFileWithFallback/index.js";

type LoadTriviaOptions = {
  contentRootDir?: string;
};

const defaultContentRootDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../content"
);

const parseTriviaPrompts = (
  rawContent: string,
  contentFilePath: string
): TriviaPrompt[] => {
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

  return parsedContent.prompts;
};

export const loadTrivia = (options: LoadTriviaOptions = {}): TriviaPrompt[] => {
  const contentRootDir = options.contentRootDir ?? defaultContentRootDir;
  return loadContentFileWithFallback({
    contentRootDir,
    contentFileName: "trivia.json",
    contentLabel: "trivia",
    parseFileContent: parseTriviaPrompts
  });
};
