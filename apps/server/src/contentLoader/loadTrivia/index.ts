import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { isTriviaContentFile, type TriviaPrompt } from "@wingnight/shared";

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

const readTriviaFromFile = (contentFilePath: string): TriviaPrompt[] => {
  const fileContents = readFileSync(contentFilePath, "utf8");
  return parseTriviaPrompts(fileContents, contentFilePath);
};

export const loadTrivia = (options: LoadTriviaOptions = {}): TriviaPrompt[] => {
  const contentRootDir = options.contentRootDir ?? defaultContentRootDir;
  const localTriviaPath = resolve(contentRootDir, "local", "trivia.json");
  const sampleTriviaPath = resolve(contentRootDir, "sample", "trivia.json");

  if (existsSync(localTriviaPath)) {
    return readTriviaFromFile(localTriviaPath);
  }

  if (!existsSync(sampleTriviaPath)) {
    throw new Error(
      `Missing trivia content file. Checked "${localTriviaPath}" and "${sampleTriviaPath}".`
    );
  }

  return readTriviaFromFile(sampleTriviaPath);
};
