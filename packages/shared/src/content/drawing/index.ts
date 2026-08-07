import { validatePromptPackFile } from "../promptPack/index.js";
import type { ValidationIssue } from "../validationIssue/index.js";

export type DrawingPrompt = {
  id: string;
  prompt: string;
};

export type DrawingContentFile = {
  prompts: DrawingPrompt[];
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const validateDrawingPrompt = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  return (["id", "prompt"] as const)
    .filter((field) => !isNonEmptyString(value[field]))
    .map((field) => ({ path: field, message: "must be a non-empty string" }));
};

export const validateDrawingContentFile = (value: unknown): ValidationIssue[] => {
  return validatePromptPackFile(value, validateDrawingPrompt);
};

export const isDrawingPrompt = (value: unknown): value is DrawingPrompt => {
  return validateDrawingPrompt(value).length === 0;
};

export const isDrawingContentFile = (
  value: unknown
): value is DrawingContentFile => {
  return validateDrawingContentFile(value).length === 0;
};
