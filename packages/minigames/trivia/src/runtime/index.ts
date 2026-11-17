import type {
  MinigameRuntimePlugin,
  MinigameRuntimeReductionInput,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";
import { resolveSeededPromptCursor } from "@wingnight/minigames-core";

import { resolveTriviaContent, triviaContentAdapter } from "./content/index.js";
import { isRecordAttemptPayload, isTriviaRuntimeState } from "./guards/index.js";
import { isTriviaRules, resolveTriviaRules } from "./rules/index.js";
import {
  TRIVIA_POINTS_PER_QUESTION,
  type TriviaMinigameState,
  type TriviaRuntimeState
} from "./types/index.js";
import {
  resolveAttemptsRemaining,
  toTriviaDisplayView,
  toTriviaHostView
} from "./views/index.js";

const clonePendingPoints = (
  pendingPointsByTeamId: Record<string, number>
): Record<string, number> => {
  return { ...pendingPointsByTeamId };
};

const createTriviaStateWithPendingPoints = (
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

// A question spent: one more of the turn's attempts used, and the next question in front of the
// room unless this one ended the turn. The verdict that ends a turn leaves the question it scored
// on screen. Advancing the cursor here would push the next question onto the TV and its answer
// onto the host tablet while nobody can answer it — and because each team is seeded its own slice
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
    questionsPerTurnLimit: state.questionsPerTurnLimit
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

// The host's spoken verdict, CORRECT or INCORRECT, on every question — with choices or without.
const reduceRecordAttempt = (
  input: MinigameRuntimeReductionInput,
  state: TriviaRuntimeState,
  teamId: string,
  promptCount: number
): MinigameRuntimeReductionResult => {
  if (!isRecordAttemptPayload(input.envelope.actionPayload)) {
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

export const triviaRuntimePlugin: MinigameRuntimePlugin = {
  id: "TRIVIA",
  content: triviaContentAdapter,
  isRules: isTriviaRules,
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
      questionsPerTurnLimit: triviaRules.questionsPerTurn
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

    if (input.envelope.actionType !== "recordAttempt" || resolveAttemptsRemaining(state) <= 0) {
      return unchanged;
    }

    return reduceRecordAttempt(input, state, activeTurnTeamId, promptCount);
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
    return toTriviaHostView(input.state, triviaContent);
  },
  selectDisplayView: (input) => {
    if (!isTriviaRuntimeState(input.state)) {
      return null;
    }

    const triviaContent = resolveTriviaContent(input.content);
    return toTriviaDisplayView(input.state, triviaContent);
  }
};

export type { TriviaMinigameState, TriviaRuntimeState };
