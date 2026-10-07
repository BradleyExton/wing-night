import { isNonEmptyString, isRecord } from "../../guards/index.js";
import { validatePromptPackFile } from "../promptPack/index.js";
import type { ValidationIssue } from "../validationIssue/index.js";

export type TriviaPrompt = {
  id: string;
  question: string;
  answer: string;
  // Optional multiple choice: 2–6 distinct non-empty strings, exactly one of which is `answer`.
  // A question with choices is answered on the playing team's phones; one without is judged
  // aloud by the host, as every question was before phones could answer.
  choices?: string[];
};

export const TRIVIA_MIN_CHOICES = 2;
export const TRIVIA_MAX_CHOICES = 6;

export type TriviaContentFile = {
  prompts: TriviaPrompt[];
};

// Two choices a guest could not tell apart on a phone are one choice: "Paris" and "paris " collide.
export const normalizeTriviaChoice = (choice: string): string => choice.trim().toLowerCase();

// Every choices issue is reported on `choices` itself — the field an editor shows — with the
// offending choice named in the message.
const validateTriviaChoices = (choices: unknown, answer: unknown): ValidationIssue[] => {
  if (choices === undefined) {
    return [];
  }

  if (!Array.isArray(choices) || choices.length < TRIVIA_MIN_CHOICES || choices.length > TRIVIA_MAX_CHOICES) {
    return [
      { path: "choices", message: `must be an array of ${TRIVIA_MIN_CHOICES}–${TRIVIA_MAX_CHOICES} choices` }
    ];
  }

  const blankIndex = choices.findIndex((choice) => !isNonEmptyString(choice) || choice.trim().length === 0);

  if (blankIndex !== -1) {
    return [{ path: "choices", message: `must not have a blank choice (choice ${blankIndex + 1})` }];
  }

  // A choice printed twice is two buttons for one answer, and a phone could pick either — ignoring
  // case and the spaces around it, because a guest cannot see those.
  if (new Set(choices.map((choice: string) => normalizeTriviaChoice(choice))).size !== choices.length) {
    return [{ path: "choices", message: "must not repeat a choice (case and spaces aside)" }];
  }

  // A blank answer already has its own issue; this one is only about a real answer gone missing.
  if (isNonEmptyString(answer) && !choices.includes(answer)) {
    return [{ path: "choices", message: "must include the answer exactly as written" }];
  }

  return [];
};

export const validateTriviaPrompt = (value: unknown): ValidationIssue[] => {
  if (!isRecord(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const fieldIssues = (["id", "question", "answer"] as const)
    .filter((field) => !isNonEmptyString(value[field]))
    .map((field) => ({ path: field, message: "must be a non-empty string" }));

  return [...fieldIssues, ...validateTriviaChoices(value.choices, value.answer)];
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
