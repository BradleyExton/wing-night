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

export const isTriviaPrompt = (value: unknown): value is TriviaPrompt => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("id" in value) || !isNonEmptyString(value.id)) {
    return false;
  }

  if (!("question" in value) || !isNonEmptyString(value.question)) {
    return false;
  }

  if (!("answer" in value) || !isNonEmptyString(value.answer)) {
    return false;
  }

  return true;
};

const hasUniquePromptIds = (prompts: TriviaPrompt[]): boolean => {
  const ids = new Set(prompts.map((prompt) => prompt.id));
  return ids.size === prompts.length;
};

export const isTriviaContentFile = (
  value: unknown
): value is TriviaContentFile => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("prompts" in value) || !Array.isArray(value.prompts)) {
    return false;
  }

  if (value.prompts.length === 0) {
    return false;
  }

  if (!value.prompts.every((prompt) => isTriviaPrompt(prompt))) {
    return false;
  }

  return hasUniquePromptIds(value.prompts);
};
