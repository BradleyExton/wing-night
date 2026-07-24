import {
  isTriviaContentFile,
  isTriviaPrompt,
  type TriviaPrompt
} from "@wingnight/shared";
import { createPromptContentAdapter } from "@wingnight/minigames-core";

export const triviaContentAdapter = createPromptContentAdapter<TriviaPrompt>({
  label: "trivia",
  fileName: "minigames/trivia.json",
  invalidContentHint: "expected { prompts: [{ id, question, answer }] }.",
  isContentFile: isTriviaContentFile,
  isPrompt: isTriviaPrompt,
  clonePrompt: (prompt) => ({
    id: prompt.id,
    question: prompt.question,
    answer: prompt.answer
  })
});

export const cloneTriviaPrompt = triviaContentAdapter.clonePrompt;
export const parseTriviaContentFile = triviaContentAdapter.parseFileContent;
export const resolveTriviaContent = triviaContentAdapter.resolveContent;
