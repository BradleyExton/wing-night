import type { MinigameType, TriviaChoiceReveal } from "@wingnight/shared";
import type {
  MinigameRuntimePlugin,
  MinigameRuntimeReductionInput,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";
import { resolveSeededPromptCursor } from "@wingnight/minigames-core";

import { resolveTriviaContent, triviaContentAdapter } from "./content/index.js";
import {
  isChooseAnswerPayload,
  isRecordAttemptPayload,
  isTriviaRuntimeState
} from "./guards/index.js";
import { isTriviaRules, resolveTriviaRules } from "./rules/index.js";
import {
  TRIVIA_CHOOSE_ANSWER_ACTION,
  TRIVIA_LOCK_CHOICES_ACTION,
  TRIVIA_NEXT_QUESTION_ACTION,
  TRIVIA_POINTS_PER_QUESTION,
  type TriviaMinigameState,
  type TriviaRuntimeState
} from "./types/index.js";
import {
  isChoiceQuestionOpen,
  resolveCountedChoosers,
  resolveAttemptsRemaining,
  resolveCurrentTriviaPrompt,
  toTriviaDisplayView,
  toTriviaHostView,
  toTriviaPlayerView
} from "./views/index.js";

export const triviaMinigameId: MinigameType = "TRIVIA";

export {
  TRIVIA_CHOOSE_ANSWER_ACTION,
  TRIVIA_LOCK_CHOICES_ACTION,
  TRIVIA_NEXT_QUESTION_ACTION,
  TRIVIA_POINTS_PER_QUESTION
};

const clonePendingPoints = (
  pendingPointsByTeamId: Record<string, number>
): Record<string, number> => {
  return { ...pendingPointsByTeamId };
};

export const createTriviaStateWithPendingPoints = (
  state: TriviaMinigameState,
  pendingPointsByTeamId: Record<string, number>
): TriviaMinigameState => {
  return {
    turnOrderTeamIds: [...state.turnOrderTeamIds],
    activeTurnIndex: state.activeTurnIndex,
    promptCursor: state.promptCursor,
    pendingPointsByTeamId: clonePendingPoints(pendingPointsByTeamId)
  };
};

// The phones' share of the team, scaled into one question's worth (TRIVIA_POINTS_PER_QUESTION's
// comment has the formula): half the team right, rounded up, banks the point.
export const resolveTriviaChoicePoints = (correctCount: number, seatedCount: number): number => {
  if (seatedCount === 0 || correctCount === 0) {
    return 0;
  }

  return Math.round((TRIVIA_POINTS_PER_QUESTION * correctCount) / seatedCount);
};

// A question spent: one more of the turn's attempts used, and the next question in front of the
// room unless this one ended the turn. The verdict that ends a turn leaves the question it scored
// on screen. Advancing the cursor here would push the next question onto the TV and its answer
// onto the host tablet while nobody can answer it — and because each team is seated its own slice
// of the bank, that next question is the next team's first one, burnt before their turn starts.
const spendQuestion = (
  state: TriviaRuntimeState,
  promptCount: number,
  pendingPointsByTeamId: Record<string, number>,
  shouldAdvance: boolean
): TriviaRuntimeState => {
  const runtimeState = state.runtimeState;

  return {
    runtimeState: {
      turnOrderTeamIds: [...runtimeState.turnOrderTeamIds],
      activeTurnIndex: (runtimeState.activeTurnIndex + 1) % runtimeState.turnOrderTeamIds.length,
      promptCursor: shouldAdvance
        ? (runtimeState.promptCursor + 1) % promptCount
        : runtimeState.promptCursor,
      pendingPointsByTeamId
    },
    attemptsUsedThisTurn: Math.min(state.questionsPerTurnLimit, state.attemptsUsedThisTurn + 1),
    questionsPerTurnLimit: state.questionsPerTurnLimit,
    choicesByPlayerId: {},
    reveal: null
  };
};

const addPoints = (
  state: TriviaRuntimeState,
  teamId: string,
  points: number,
  pointsMax: number
): Record<string, number> => {
  const next = clonePendingPoints(state.runtimeState.pendingPointsByTeamId);

  next[teamId] = Math.min(pointsMax, (next[teamId] ?? 0) + points);

  return next;
};

// The host's spoken verdict, CORRECT or INCORRECT: today's road for every question, and the escape
// hatch on a multiple-choice one (nobody's phone answered, or the host would rather judge it). Not
// on a question already locked — its phones already scored it.
const reduceRecordAttempt = (
  input: MinigameRuntimeReductionInput,
  state: TriviaRuntimeState,
  teamId: string,
  promptCount: number
): MinigameRuntimeReductionResult => {
  if (!isRecordAttemptPayload(input.envelope.actionPayload) || state.reveal !== null) {
    return { state: input.state, didMutate: false };
  }

  const pendingPointsByTeamId = input.envelope.actionPayload.isCorrect
    ? addPoints(state, teamId, TRIVIA_POINTS_PER_QUESTION, input.pointsMax)
    : clonePendingPoints(state.runtimeState.pendingPointsByTeamId);
  const hasQuestionsLeftThisTurn = state.attemptsUsedThisTurn + 1 < state.questionsPerTurnLimit;

  return {
    state: spendQuestion(state, promptCount, pendingPointsByTeamId, hasQuestionsLeftThisTurn),
    didMutate: true
  };
};

// The host locking a multiple-choice question: the phones' choices are counted, the question is
// scored from the share that chose right, and the spread goes up on the TV. The question stays on
// screen under its reveal; `nextQuestion` moves on.
const reduceLockChoices = (
  input: MinigameRuntimeReductionInput,
  state: TriviaRuntimeState,
  teamId: string,
  promptCount: number
): MinigameRuntimeReductionResult => {
  const prompt = resolveCurrentTriviaPrompt(state, resolveTriviaContent(input.content));

  if (!isChoiceQuestionOpen(state, prompt)) {
    return { state: input.state, didMutate: false };
  }

  // Over the phones that could answer: awake at the lock, or asleep with a choice already in.
  const seatedPlayers = resolveCountedChoosers(state, input.answeringPlayers ?? []);
  const correctIndex = prompt.choices.indexOf(prompt.answer);
  const choiceCounts = prompt.choices.map(() => 0);
  let answeredCount = 0;

  for (const player of seatedPlayers) {
    const choiceIndex = state.choicesByPlayerId[player.id];

    if (choiceIndex !== undefined && choiceIndex < choiceCounts.length) {
      choiceCounts[choiceIndex] = (choiceCounts[choiceIndex] ?? 0) + 1;
      answeredCount += 1;
    }
  }

  // Like GEO's lock with no pin anywhere: nothing to lock in. The host judges it aloud instead.
  if (answeredCount === 0) {
    return { state: input.state, didMutate: false };
  }

  const correctCount = choiceCounts[correctIndex] ?? 0;
  const pointsAwarded = resolveTriviaChoicePoints(correctCount, seatedPlayers.length);
  const reveal: TriviaChoiceReveal = {
    promptId: prompt.id,
    choices: [...prompt.choices],
    choiceCounts,
    correctIndex,
    correctCount,
    answeredCount,
    seatedCount: seatedPlayers.length,
    pointsAwarded
  };
  const spent = spendQuestion(state, promptCount, addPoints(state, teamId, pointsAwarded, input.pointsMax), false);

  return {
    state: {
      ...spent,
      // The question and its choices stay with their reveal until the host moves on.
      runtimeState: { ...spent.runtimeState, activeTurnIndex: state.runtimeState.activeTurnIndex },
      choicesByPlayerId: { ...state.choicesByPlayerId },
      reveal
    },
    didMutate: true
  };
};

// From a locked question's reveal to the next question, while the turn has one left.
const reduceNextQuestion = (
  input: MinigameRuntimeReductionInput,
  state: TriviaRuntimeState,
  promptCount: number
): MinigameRuntimeReductionResult => {
  if (state.reveal === null || resolveAttemptsRemaining(state) <= 0) {
    return { state: input.state, didMutate: false };
  }

  const runtimeState = state.runtimeState;

  return {
    state: {
      ...state,
      runtimeState: {
        ...runtimeState,
        activeTurnIndex: (runtimeState.activeTurnIndex + 1) % runtimeState.turnOrderTeamIds.length,
        promptCursor: (runtimeState.promptCursor + 1) % promptCount
      },
      choicesByPlayerId: {},
      reveal: null
    },
    didMutate: true
  };
};

export const triviaRuntimePlugin: MinigameRuntimePlugin = {
  id: "TRIVIA",
  content: triviaContentAdapter,
  isRules: isTriviaRules,
  playerActionTypes: [TRIVIA_CHOOSE_ANSWER_ACTION],
  initialize: (input) => {
    const triviaRules = resolveTriviaRules(input.rules);
    const runtimeTeamIds =
      input.activeRoundTeamId === null ? input.teamIds : [input.activeRoundTeamId];
    const triviaContent = resolveTriviaContent(input.content);

    const initialState: TriviaRuntimeState = {
      runtimeState: {
        turnOrderTeamIds: [...runtimeTeamIds],
        activeTurnIndex: 0,
        promptCursor: resolveSeededPromptCursor({
          teamIds: input.teamIds,
          activeRoundTeamId: input.activeRoundTeamId,
          promptsPerTurn: triviaRules.questionsPerTurn,
          promptCount: triviaContent.prompts.length
        }),
        pendingPointsByTeamId: clonePendingPoints(input.pendingPointsByTeamId)
      },
      attemptsUsedThisTurn: 0,
      questionsPerTurnLimit: triviaRules.questionsPerTurn,
      choicesByPlayerId: {},
      reveal: null
    };

    return initialState;
  },
  reduceAction: (input) => {
    const unchanged = { state: input.state, didMutate: false };

    if (!isTriviaRuntimeState(input.state)) {
      return unchanged;
    }

    const state = input.state;
    const activeTurnTeamId =
      state.runtimeState.turnOrderTeamIds[state.runtimeState.activeTurnIndex] ?? null;
    const promptCount = resolveTriviaContent(input.content).prompts.length;

    // No question on the surfaces means there is nothing to have got right or
    // wrong: an empty prompt bank must not let a stale client spend the turn's
    // attempts, or bank a point per click, on questions nobody was ever asked.
    if (activeTurnTeamId === null || promptCount === 0) {
      return unchanged;
    }

    if (input.envelope.actionType === TRIVIA_NEXT_QUESTION_ACTION) {
      return reduceNextQuestion(input, state, promptCount);
    }

    if (resolveAttemptsRemaining(state) <= 0) {
      return unchanged;
    }

    if (input.envelope.actionType === "recordAttempt") {
      return reduceRecordAttempt(input, state, activeTurnTeamId, promptCount);
    }

    if (input.envelope.actionType === TRIVIA_LOCK_CHOICES_ACTION) {
      return reduceLockChoices(input, state, activeTurnTeamId, promptCount);
    }

    return unchanged;
  },
  // A playing-team phone's own choice on an open multiple-choice question. The server has already
  // checked the face is seated and on the playing team; a choice can change until the host locks.
  reducePlayerAction: (input) => {
    const unchanged = { state: input.state, didMutate: false };

    if (
      !isTriviaRuntimeState(input.state) ||
      input.envelope.actionType !== TRIVIA_CHOOSE_ANSWER_ACTION ||
      !isChooseAnswerPayload(input.envelope.actionPayload) ||
      !input.answeringPlayers.some((player) => player.id === input.playerId)
    ) {
      return unchanged;
    }

    const prompt = resolveCurrentTriviaPrompt(input.state, resolveTriviaContent(input.content));
    const { choiceIndex } = input.envelope.actionPayload;

    if (
      !isChoiceQuestionOpen(input.state, prompt) ||
      choiceIndex >= prompt.choices.length ||
      input.state.choicesByPlayerId[input.playerId] === choiceIndex
    ) {
      return unchanged;
    }

    return {
      state: {
        ...input.state,
        choicesByPlayerId: { ...input.state.choicesByPlayerId, [input.playerId]: choiceIndex }
      },
      didMutate: true
    };
  },
  releasePlayerAnswer: (input) => {
    const unchanged = { state: input.state, didMutate: false };

    if (
      !isTriviaRuntimeState(input.state) ||
      input.state.reveal !== null ||
      !Object.hasOwn(input.state.choicesByPlayerId, input.playerId)
    ) {
      return unchanged;
    }

    const { [input.playerId]: _released, ...choicesByPlayerId } = input.state.choicesByPlayerId;

    return { state: { ...input.state, choicesByPlayerId }, didMutate: true };
  },
  syncPendingPoints: (input) => {
    if (!isTriviaRuntimeState(input.state)) {
      return input.state;
    }

    return {
      ...input.state,
      runtimeState: createTriviaStateWithPendingPoints(
        input.state.runtimeState,
        input.pendingPointsByTeamId
      )
    };
  },
  syncContent: (input) => {
    if (!isTriviaRuntimeState(input.state)) {
      return input.state;
    }

    const triviaContent = resolveTriviaContent(input.content);
    const nextPromptCursor =
      triviaContent.prompts.length === 0
        ? input.state.runtimeState.promptCursor
        : input.state.runtimeState.promptCursor % triviaContent.prompts.length;

    return {
      ...input.state,
      runtimeState: {
        ...input.state.runtimeState,
        promptCursor: nextPromptCursor
      }
    };
  },
  selectHostView: (input) => {
    if (!isTriviaRuntimeState(input.state)) {
      return null;
    }

    const triviaContent = resolveTriviaContent(input.content);
    return toTriviaHostView(input.state, triviaContent, input.answeringPlayers);
  },
  selectDisplayView: (input) => {
    if (!isTriviaRuntimeState(input.state)) {
      return null;
    }

    const triviaContent = resolveTriviaContent(input.content);
    return toTriviaDisplayView(input.state, triviaContent, input.answeringPlayers);
  },
  selectPlayerView: (input) => {
    if (!isTriviaRuntimeState(input.state)) {
      return null;
    }

    return toTriviaPlayerView(
      input.state,
      resolveTriviaContent(input.content),
      input.playerId,
      input.showOwnAnswer
    );
  }
};

export type { TriviaMinigameState, TriviaRuntimeState };
