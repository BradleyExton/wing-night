import type {
  MinigameDisplayView,
  MinigameHostView,
  PhoneAnswerTally,
  TriviaChoiceReveal,
  TriviaMinigamePlayerView,
  TriviaPrompt
} from "@wingnight/shared";
import { resolveCountedAnsweringPlayers, type MinigameAnsweringPlayer } from "@wingnight/minigames-core";

import { cloneTriviaPrompt } from "../content/index.js";
import type { TriviaRuntimeContent, TriviaRuntimeState } from "../types/index.js";

export const resolveAttemptsRemaining = (state: TriviaRuntimeState): number => {
  return Math.max(0, state.questionsPerTurnLimit - state.attemptsUsedThisTurn);
};

export const resolveCurrentTriviaPrompt = (
  state: TriviaRuntimeState,
  content: TriviaRuntimeContent
): TriviaPrompt | null => {
  if (content.prompts.length === 0) {
    return null;
  }

  const promptIndex = state.runtimeState.promptCursor % content.prompts.length;
  const currentPrompt = content.prompts[promptIndex];

  if (currentPrompt === undefined) {
    return null;
  }

  return cloneTriviaPrompt(currentPrompt);
};

// Whether the phones may still choose on the question in hand: it has choices, the host has not
// locked it, and the turn has a question left to spend on it.
export const isChoiceQuestionOpen = (
  state: TriviaRuntimeState,
  prompt: TriviaPrompt | null
): prompt is TriviaPrompt & { choices: string[] } => {
  return (
    prompt !== null &&
    prompt.choices !== undefined &&
    state.reveal === null &&
    resolveAttemptsRemaining(state) > 0
  );
};

// The phones a locked question's share is taken over: the seated phones that are awake, plus any
// asleep one that chose before it slept (`resolveCountedAnsweringPlayers`).
export const resolveCountedChoosers = (
  state: TriviaRuntimeState,
  answeringPlayers: readonly MinigameAnsweringPlayer[]
): MinigameAnsweringPlayer[] => {
  return resolveCountedAnsweringPlayers(answeringPlayers, (playerId) =>
    Object.hasOwn(state.choicesByPlayerId, playerId)
  );
};

// How many of the playing team's phones have chosen on the open question, out of the phones that
// count — never which choice, never who. Null on a question without choices, once it is locked, and
// on a night with no phones on the team.
const resolveChoiceTally = (
  state: TriviaRuntimeState,
  prompt: TriviaPrompt | null,
  answeringPlayers: readonly MinigameAnsweringPlayer[]
): PhoneAnswerTally | null => {
  if (answeringPlayers.length === 0 || !isChoiceQuestionOpen(state, prompt)) {
    return null;
  }

  const counted = resolveCountedChoosers(state, answeringPlayers);

  return {
    answeredCount: counted.filter((player) => Object.hasOwn(state.choicesByPlayerId, player.id)).length,
    seatedCount: counted.length
  };
};

const cloneReveal = (reveal: TriviaChoiceReveal | null): TriviaChoiceReveal | null => {
  return reveal === null
    ? null
    : { ...reveal, choices: [...reveal.choices], choiceCounts: [...reveal.choiceCounts] };
};

export const toTriviaHostView = (
  state: TriviaRuntimeState,
  content: TriviaRuntimeContent,
  answeringPlayers: readonly MinigameAnsweringPlayer[] = []
): MinigameHostView => {
  const currentPrompt = resolveCurrentTriviaPrompt(state, content);

  return {
    minigame: "TRIVIA",
    activeTurnTeamId:
      state.runtimeState.turnOrderTeamIds[state.runtimeState.activeTurnIndex] ?? null,
    attemptsRemaining: resolveAttemptsRemaining(state),
    promptCursor: state.runtimeState.promptCursor,
    pendingPointsByTeamId: { ...state.runtimeState.pendingPointsByTeamId },
    currentPrompt,
    phoneAnswers: resolveChoiceTally(state, currentPrompt, answeringPlayers),
    reveal: cloneReveal(state.reveal)
  };
};

export const toTriviaDisplayView = (
  state: TriviaRuntimeState,
  content: TriviaRuntimeContent,
  answeringPlayers: readonly MinigameAnsweringPlayer[] = []
): MinigameDisplayView => {
  const currentPrompt = resolveCurrentTriviaPrompt(state, content);
  const tally = resolveChoiceTally(state, currentPrompt, answeringPlayers);

  return {
    minigame: "TRIVIA",
    activeTurnTeamId:
      state.runtimeState.turnOrderTeamIds[state.runtimeState.activeTurnIndex] ?? null,
    promptCursor: state.runtimeState.promptCursor,
    attemptsRemaining: resolveAttemptsRemaining(state),
    pendingPointsByTeamId: { ...state.runtimeState.pendingPointsByTeamId },
    // The choices are the question's own words and the room reads them off the TV; which one is
    // right waits for the host's lock (`reveal`).
    currentPrompt:
      currentPrompt === null
        ? null
        : {
            id: currentPrompt.id,
            question: currentPrompt.question,
            choices: currentPrompt.choices === undefined ? null : [...currentPrompt.choices]
          },
    // A count until the lock: a choice on the TV is one every teammate could copy, and a name
    // would say who is still thinking.
    phoneAnswers: tally,
    reveal: cloneReveal(state.reveal)
  };
};

// One phone's card: the question and its choices, its OWN choice, and once the host locks the
// question, whether that choice was the answer. Nobody else's choice, ever — and never the answer
// before the reveal.
export const toTriviaPlayerView = (
  state: TriviaRuntimeState,
  content: TriviaRuntimeContent,
  playerId: string,
  showOwnAnswer: boolean
): TriviaMinigamePlayerView | null => {
  const currentPrompt = resolveCurrentTriviaPrompt(state, content);

  if (currentPrompt === null) {
    return null;
  }

  const ownChoice = showOwnAnswer ? (state.choicesByPlayerId[playerId] ?? null) : null;
  const reveal = state.reveal?.promptId === currentPrompt.id ? state.reveal : null;

  return {
    minigame: "TRIVIA",
    promptId: currentPrompt.id,
    question: currentPrompt.question,
    choices: currentPrompt.choices === undefined ? null : [...currentPrompt.choices],
    status: isChoiceQuestionOpen(state, currentPrompt) ? "open" : "locked",
    choiceIndex: ownChoice,
    isCorrect: reveal === null || ownChoice === null ? null : ownChoice === reveal.correctIndex
  };
};
