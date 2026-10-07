import {
  isTriviaContentFile,
  isTriviaPrompt,
  type TriviaPrompt
} from "@wingnight/shared";
import { createPromptContentAdapter } from "@wingnight/minigames-core";

export const triviaContentAdapter = createPromptContentAdapter<TriviaPrompt>({
  label: "trivia",
  fileName: "minigames/trivia.json",
  invalidContentHint:
    "expected { prompts: [{ id, question, answer, choices? }] } — choices, when given, are 2–6 distinct strings that include the answer.",
  isContentFile: isTriviaContentFile,
  isPrompt: isTriviaPrompt,
  clonePrompt: (prompt) => ({
    id: prompt.id,
    question: prompt.question,
    answer: prompt.answer,
    ...(prompt.choices === undefined ? {} : { choices: [...prompt.choices] })
  })
});

export const cloneTriviaPrompt = triviaContentAdapter.clonePrompt;
export const parseTriviaContentFile = triviaContentAdapter.parseFileContent;
export const resolveTriviaContent = triviaContentAdapter.resolveContent;
