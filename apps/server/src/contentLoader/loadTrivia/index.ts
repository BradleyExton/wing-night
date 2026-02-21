import { isTriviaContentFile, type TriviaPrompt } from "@wingnight/shared";
import {
  parseContentJson,
  resolveDefaultContentRootDir
} from "../contentLoaderUtils/index.js";
import { loadContentFileWithFallback } from "../loadContentFileWithFallback/index.js";

type LoadTriviaOptions = {
  contentRootDir?: string;
};

const defaultContentRootDir = resolveDefaultContentRootDir(import.meta.url);

const parseTriviaPrompts = (
  rawContent: string,
  contentFilePath: string
): TriviaPrompt[] => {
  const parsedContent = parseContentJson(rawContent, contentFilePath, "trivia");

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
