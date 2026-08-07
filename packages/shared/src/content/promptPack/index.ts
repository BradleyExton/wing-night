import {
  prefixIssuePaths,
  type ValidationIssue
} from "../validationIssue/index.js";

// The trivia and drawing packs are the same file shape over different prompt
// bodies: `{ prompts: [...] }`, at least one prompt, unique ids. Only the
// per-prompt fields differ, so that is the one thing a caller injects.
export type ValidatePrompt = (prompt: unknown) => ValidationIssue[];

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const readPromptId = (prompt: unknown): string | null => {
  if (!isObjectLike(prompt) || typeof prompt.id !== "string") {
    return null;
  }

  return prompt.id;
};

// Reported on the SECOND and later occurrence: the first use of an id is the
// one the pack author most likely meant to keep.
const findDuplicateIdIssues = (prompts: unknown[]): ValidationIssue[] => {
  const seenIds = new Set<string>();
  const issues: ValidationIssue[] = [];

  prompts.forEach((prompt, index) => {
    const promptId = readPromptId(prompt);

    // Prompts with a missing or non-string id already have their own issue
    // from the per-prompt validator; don't pile a duplicate report on top.
    if (promptId === null) {
      return;
    }

    if (seenIds.has(promptId)) {
      issues.push({
        path: `prompts[${index}].id`,
        message: `must be unique within the pack ("${promptId}" is already used)`
      });
      return;
    }

    seenIds.add(promptId);
  });

  return issues;
};

export const validatePromptPackFile = (
  value: unknown,
  validatePrompt: ValidatePrompt
): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  if (!Array.isArray(value.prompts)) {
    return [{ path: "prompts", message: "must be an array" }];
  }

  if (value.prompts.length === 0) {
    return [{ path: "prompts", message: "must contain at least one prompt" }];
  }

  const promptIssues = value.prompts.flatMap((prompt, index) =>
    prefixIssuePaths(validatePrompt(prompt), `prompts[${index}]`)
  );

  return [...promptIssues, ...findDuplicateIdIssues(value.prompts)];
};
