import type { MinigameType } from "@wingnight/shared";
import type { MinigameRuntimePlugin } from "@wingnight/minigames-core";
import { resolveSeededPromptCursor } from "@wingnight/minigames-core";

import { resolveTriviaContent, triviaContentAdapter } from "./content/index.js";
import {
  isRecordAttemptPayload,
  isTriviaMinigameState,
  isTriviaRuntimeState
} from "./guards/index.js";
import { isTriviaRules, resolveTriviaRules } from "./rules/index.js";
import type { TriviaMinigameState, TriviaRuntimeState } from "./types/index.js";
import {
  resolveAttemptsRemaining,
  toTriviaDisplayView,
  toTriviaHostView
} from "./views/index.js";

export const triviaMinigameId: MinigameType = "TRIVIA";

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

    if (input.envelope.actionType !== "recordAttempt") {
      return unchanged;
    }

    if (!isRecordAttemptPayload(input.envelope.actionPayload)) {
      return unchanged;
    }

    if (resolveAttemptsRemaining(input.state) <= 0) {
      return unchanged;
    }

    const state = input.state.runtimeState;
    const activeTurnTeamId = state.turnOrderTeamIds[state.activeTurnIndex] ?? null;

    if (activeTurnTeamId === null) {
      return unchanged;
    }

    const prompts = resolveTriviaContent(input.content).prompts;

    // No question on the surfaces means there is nothing to have got right or
    // wrong: an empty prompt bank must not let a stale client spend the turn's
    // attempts, or bank a point per click, on questions nobody was ever asked.
    if (prompts.length === 0) {
      return unchanged;
    }

    const nextPendingPointsByTeamId = clonePendingPoints(state.pendingPointsByTeamId);

    if (input.envelope.actionPayload.isCorrect) {
      const previousPoints = nextPendingPointsByTeamId[activeTurnTeamId] ?? 0;
      nextPendingPointsByTeamId[activeTurnTeamId] = Math.min(
        input.pointsMax,
        previousPoints + 1
      );
    }

    const nextAttemptsUsedThisTurn = Math.min(
      input.state.questionsPerTurnLimit,
      input.state.attemptsUsedThisTurn + 1
    );
    // The verdict that ends a turn leaves the question it scored on screen.
    // Advancing the cursor here would push the next question onto the TV and
    // its answer onto the host tablet while nobody can answer it — and because
    // each team is seeded its own slice of the bank, that next question is the
    // next team's first one, burnt before their turn starts.
    const hasQuestionsLeftThisTurn =
      nextAttemptsUsedThisTurn < input.state.questionsPerTurnLimit;

    return {
      state: {
        runtimeState: {
          turnOrderTeamIds: [...state.turnOrderTeamIds],
          activeTurnIndex:
            (state.activeTurnIndex + 1) % state.turnOrderTeamIds.length,
          promptCursor: hasQuestionsLeftThisTurn
            ? (state.promptCursor + 1) % prompts.length
            : state.promptCursor,
          pendingPointsByTeamId: nextPendingPointsByTeamId
        },
        attemptsUsedThisTurn: nextAttemptsUsedThisTurn,
        questionsPerTurnLimit: input.state.questionsPerTurnLimit
      },
      didMutate: true
    };
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

export { isTriviaMinigameState };
export type { TriviaMinigameState, TriviaRuntimeState };
