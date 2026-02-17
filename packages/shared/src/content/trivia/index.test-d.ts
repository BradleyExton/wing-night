import type { TriviaContentFile, TriviaPrompt } from "../../index.js";

type Assert<T extends true> = T;
type IsAssignable<From, To> = From extends To ? true : false;

export type ValidTriviaPromptCheck = Assert<
  IsAssignable<{ id: string; question: string; answer: string }, TriviaPrompt>
>;

export type ValidTriviaContentFileCheck = Assert<
  IsAssignable<{ prompts: TriviaPrompt[] }, TriviaContentFile>
>;

// @ts-expect-error Trivia prompt requires an id.
export type MissingPromptIdCheck = Assert<IsAssignable<{ question: string; answer: string }, TriviaPrompt>>;

// @ts-expect-error Trivia prompt requires an answer.
export type MissingPromptAnswerCheck = Assert<IsAssignable<{ id: string; question: string }, TriviaPrompt>>;

// @ts-expect-error prompts must be an array.
export type InvalidPromptsCollectionCheck = Assert<IsAssignable<{ prompts: string }, TriviaContentFile>>;
