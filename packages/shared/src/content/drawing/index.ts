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

export const isDrawingPrompt = (value: unknown): value is DrawingPrompt => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("id" in value) || !isNonEmptyString(value.id)) {
    return false;
  }

  if (!("prompt" in value) || !isNonEmptyString(value.prompt)) {
    return false;
  }

  return true;
};

const hasUniquePromptIds = (prompts: DrawingPrompt[]): boolean => {
  const ids = new Set(prompts.map((prompt) => prompt.id));
  return ids.size === prompts.length;
};

export const isDrawingContentFile = (
  value: unknown
): value is DrawingContentFile => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("prompts" in value) || !Array.isArray(value.prompts)) {
    return false;
  }

  if (value.prompts.length === 0) {
    return false;
  }

  if (!value.prompts.every((prompt) => isDrawingPrompt(prompt))) {
    return false;
  }

  return hasUniquePromptIds(value.prompts);
};
