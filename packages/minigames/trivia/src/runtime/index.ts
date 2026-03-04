import {
  MINIGAME_API_VERSION,
  type MinigameType
} from "@wingnight/shared";
import type {
  MinigamePluginMetadata,
  MinigameRuntimePlugin
} from "@wingnight/minigames-core";

import {
  createTriviaStateWithPendingPoints,
  isTriviaMinigameState,
  triviaMinigameModule,
  type TriviaMinigameAction,
  type TriviaMinigameContext,
  type TriviaMinigameState
} from "../index.js";
import {
  parseTriviaContentFile,
  resolveTriviaContent
} from "./content/index.js";
import {
  isRecordAttemptPayload,
  isTriviaRuntimeState
} from "./guards/index.js";
import { resolveTriviaRules } from "./rules/index.js";
import { toTriviaDisplayView, toTriviaHostView, resolveAttemptsRemaining, resolveTriviaContext } from "./views/index.js";

export const triviaMinigameId: MinigameType = "TRIVIA";

export const triviaMinigameMetadata: MinigamePluginMetadata = {
  minigameApiVersion: MINIGAME_API_VERSION,
  capabilities: {
    supportsHostRenderer: true,
    supportsDisplayRenderer: true,
    supportsDevScenarios: true
  }
};

export const triviaRuntimePlugin: MinigameRuntimePlugin = {
  id: "TRIVIA",
  metadata: triviaMinigameMetadata,
  content: {
    fileName: "minigames/trivia.json",
    parseFileContent: parseTriviaContentFile
  },
  initialize: (input) => {
    const triviaContent = resolveTriviaContent(input.content);
    const triviaRules = resolveTriviaRules(input.rules);
    const runtimeTeamIds =
      input.activeRoundTeamId === null ? input.teamIds : [input.activeRoundTeamId];
    const initializedState = triviaMinigameModule.init({
      teamIds: runtimeTeamIds,
      pointsMax: input.pointsMax,
      context: resolveTriviaContext(triviaContent)
    });

    return {
      runtimeState: createTriviaStateWithPendingPoints(
        initializedState,
        input.pendingPointsByTeamId
      ),
      attemptsUsedThisTurn: 0,
      questionsPerTurnLimit: triviaRules.questionsPerTurn
    };
  },
  reduceAction: (input) => {
    if (!isTriviaRuntimeState(input.state)) {
      return {
        state: input.state,
        didMutate: false
      };
    }

    if (input.envelope.actionType !== "recordAttempt") {
      return {
        state: input.state,
        didMutate: false
      };
    }

    if (!isRecordAttemptPayload(input.envelope.actionPayload)) {
      return {
        state: input.state,
        didMutate: false
      };
    }

    if (resolveAttemptsRemaining(input.state) <= 0) {
      return {
        state: input.state,
        didMutate: false
      };
    }

    const triviaContent = resolveTriviaContent(input.content);
    const nextRuntimeState = triviaMinigameModule.reduce({
      state: input.state.runtimeState,
      action: {
        type: "recordAttempt",
        isCorrect: input.envelope.actionPayload.isCorrect
      } satisfies TriviaMinigameAction,
      pointsMax: input.pointsMax,
      teamIds: input.state.runtimeState.turnOrderTeamIds,
      context: resolveTriviaContext(triviaContent)
    });

    return {
      state: {
        runtimeState: nextRuntimeState,
        attemptsUsedThisTurn: Math.min(
          input.state.questionsPerTurnLimit,
          input.state.attemptsUsedThisTurn + 1
        ),
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

export {
  createTriviaStateWithPendingPoints,
  isTriviaMinigameState,
  triviaMinigameModule,
  type TriviaMinigameAction,
  type TriviaMinigameContext,
  type TriviaMinigameState
};
