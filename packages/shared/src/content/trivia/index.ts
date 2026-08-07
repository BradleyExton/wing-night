import { validatePromptPackFile } from "../promptPack/index.js";
import type { ValidationIssue } from "../validationIssue/index.js";

export type TriviaPrompt = {
  id: string;
  question: string;
  answer: string;
};

export type TriviaContentFile = {
  prompts: TriviaPrompt[];
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const validateTriviaPrompt = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  return (["id", "question", "answer"] as const)
    .filter((field) => !isNonEmptyString(value[field]))
    .map((field) => ({ path: field, message: "must be a non-empty string" }));
};

export const validateTriviaContentFile = (value: unknown): ValidationIssue[] => {
  return validatePromptPackFile(value, validateTriviaPrompt);
};

export const isTriviaPrompt = (value: unknown): value is TriviaPrompt => {
  return validateTriviaPrompt(value).length === 0;
};

export const isTriviaContentFile = (
  value: unknown
): value is TriviaContentFile => {
  return validateTriviaContentFile(value).length === 0;
};
