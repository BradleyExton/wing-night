import type {
  MinigameDisplayView,
  MinigameHostView,
  MinigameType
} from "@wingnight/shared";
import { MINIGAME_API_VERSION } from "@wingnight/shared";
import type {
  MinigamePluginMetadata,
  MinigameRuntimePlugin,
  SerializableValue
} from "@wingnight/minigames-core";

import {
  createTriviaStateWithPendingPoints,
  isTriviaMinigameState,
  triviaMinigameModule,
  type TriviaMinigameAction,
  type TriviaMinigameContext,
  type TriviaMinigameState
} from "../index.js";

type TriviaPrompt = {
  id: string;
  question: string;
  answer: string;
};

type TriviaContentFile = {
  prompts: TriviaPrompt[];
};

type TriviaRuntimeContent = TriviaContentFile;

type TriviaRuntimeRules = {
  questionsPerTurn: number;
};

type TriviaRuntimeState = {
  runtimeState: TriviaMinigameState;
  attemptsUsedThisTurn: number;
  questionsPerTurnLimit: number;
};

const DEFAULT_TRIVIA_QUESTIONS_PER_TURN = 1;

export const triviaMinigameId: MinigameType = "TRIVIA";

export const triviaMinigameMetadata: MinigamePluginMetadata = {
  minigameApiVersion: MINIGAME_API_VERSION,
  capabilities: {
    supportsHostRenderer: true,
    supportsDisplayRenderer: true,
    supportsDevScenarios: true
  }
};

const cloneTriviaPrompt = (prompt: TriviaPrompt): TriviaPrompt => {
  return {
    id: prompt.id,
    question: prompt.question,
    answer: prompt.answer
  };
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isTriviaPrompt = (value: unknown): value is TriviaPrompt => {
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

const isTriviaContentFile = (value: unknown): value is TriviaContentFile => {
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

export const parseTriviaContentFile = (
  rawContent: string,
  contentFilePath: string
): TriviaRuntimeContent => {
  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(rawContent);
  } catch (error) {
    const parseReason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to parse trivia content at "${contentFilePath}": ${parseReason}`
    );
  }

  if (!isTriviaContentFile(parsedContent)) {
    throw new Error(
      `Invalid trivia content at "${contentFilePath}": expected { prompts: [{ id, question, answer }] }.`
    );
  }

  return {
    prompts: parsedContent.prompts.map(cloneTriviaPrompt)
  };
};

const resolveTriviaContent = (content: SerializableValue | null): TriviaRuntimeContent => {
  if (typeof content !== "object" || content === null) {
    return { prompts: [] };
  }

  if (!("prompts" in content) || !Array.isArray(content.prompts)) {
    return { prompts: [] };
  }

  const prompts = content.prompts.filter((prompt): prompt is TriviaPrompt => {
    return isTriviaPrompt(prompt);
  });

  return {
    prompts: prompts.map(cloneTriviaPrompt)
  };
};

const normalizeQuestionsPerTurn = (questionsPerTurn: unknown): number => {
  if (
    typeof questionsPerTurn !== "number" ||
    !Number.isInteger(questionsPerTurn) ||
    questionsPerTurn <= 0
  ) {
    return DEFAULT_TRIVIA_QUESTIONS_PER_TURN;
  }

  return questionsPerTurn;
};

const resolveTriviaRules = (rules: SerializableValue | null): TriviaRuntimeRules => {
  if (typeof rules !== "object" || rules === null) {
    return {
      questionsPerTurn: DEFAULT_TRIVIA_QUESTIONS_PER_TURN
    };
  }

  const parsedRules = rules as Partial<TriviaRuntimeRules>;

  return {
    questionsPerTurn: normalizeQuestionsPerTurn(parsedRules.questionsPerTurn)
  };
};

const isTriviaRuntimeState = (value: SerializableValue): value is TriviaRuntimeState => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const runtimeState = value as Partial<TriviaRuntimeState>;

  if (
    runtimeState.runtimeState === undefined ||
    !isTriviaMinigameState(runtimeState.runtimeState)
  ) {
    return false;
  }

  if (
    typeof runtimeState.attemptsUsedThisTurn !== "number" ||
    !Number.isInteger(runtimeState.attemptsUsedThisTurn) ||
    runtimeState.attemptsUsedThisTurn < 0
  ) {
    return false;
  }

  if (
    typeof runtimeState.questionsPerTurnLimit !== "number" ||
    !Number.isInteger(runtimeState.questionsPerTurnLimit) ||
    runtimeState.questionsPerTurnLimit <= 0
  ) {
    return false;
  }

  return true;
};

const isRecordAttemptPayload = (
  actionPayload: SerializableValue
): actionPayload is Record<"isCorrect", boolean> => {
  if (typeof actionPayload !== "object" || actionPayload === null) {
    return false;
  }

  if (!("isCorrect" in actionPayload)) {
    return false;
  }

  return typeof actionPayload.isCorrect === "boolean";
};

const resolveTriviaContext = (
  content: TriviaRuntimeContent
): TriviaMinigameContext => {
  return {
    prompts: content.prompts
  };
};

const resolveAttemptsRemaining = (state: TriviaRuntimeState): number => {
  return Math.max(0, state.questionsPerTurnLimit - state.attemptsUsedThisTurn);
};

const resolveCurrentPrompt = (
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

const toTriviaHostView = (
  state: TriviaRuntimeState,
  content: TriviaRuntimeContent
): MinigameHostView => {
  return {
    minigame: "TRIVIA",
    activeTurnTeamId:
      state.runtimeState.turnOrderTeamIds[state.runtimeState.activeTurnIndex] ?? null,
    attemptsRemaining: resolveAttemptsRemaining(state),
    promptCursor: state.runtimeState.promptCursor,
    pendingPointsByTeamId: { ...state.runtimeState.pendingPointsByTeamId },
    currentPrompt: resolveCurrentPrompt(state, content)
  };
};

const toTriviaDisplayView = (
  state: TriviaRuntimeState,
  content: TriviaRuntimeContent
): MinigameDisplayView => {
  const currentPrompt = resolveCurrentPrompt(state, content);

  return {
    minigame: "TRIVIA",
    activeTurnTeamId:
      state.runtimeState.turnOrderTeamIds[state.runtimeState.activeTurnIndex] ?? null,
    promptCursor: state.runtimeState.promptCursor,
    pendingPointsByTeamId: { ...state.runtimeState.pendingPointsByTeamId },
    currentPrompt:
      currentPrompt === null
        ? null
        : {
            id: currentPrompt.id,
            question: currentPrompt.question
          }
  };
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
