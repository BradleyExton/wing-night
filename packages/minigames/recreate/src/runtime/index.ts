import type { MinigameType, RecreateAttempt } from "@wingnight/shared";
import type {
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";

import { recreateContentAdapter, resolveRecreateContent } from "./content/index.js";
import {
  isRecreateRuntimeState,
  isResolveGenerationPayload,
  isSubmitPromptPayload,
  isToggleIngredientPayload
} from "./guards/index.js";
import { isRecreateRules, resolveRecreateRules } from "./rules/index.js";
import {
  RECREATE_MAX_PROMPT_LENGTH,
  type RecreateRuntimeContent,
  type RecreateRuntimeState
} from "./types/index.js";
import {
  resolveActiveTurnTeamId,
  resolveCurrentRecreatePrompt,
  toRecreateDisplayView,
  toRecreateHostView
} from "./views/index.js";

export const recreateMinigameId: MinigameType = "RECREATE";

const resolveSeededPromptCursor = (
  teamIds: string[],
  activeRoundTeamId: string | null,
  targetsPerTurn: number,
  promptCount: number
): number => {
  if (promptCount === 0) {
    return 0;
  }

  const teamIndex =
    activeRoundTeamId === null ? 0 : Math.max(0, teamIds.indexOf(activeRoundTeamId));

  return (teamIndex * targetsPerTurn) % promptCount;
};

// Deterministic on purpose: a display refresh or an undo must land on the
// same id the generator is already working on, so its result still matches.
export const resolveRecreateAttemptId = (
  promptId: string,
  teamId: string,
  attemptSequence: number
): string => {
  return `${promptId}:${teamId}:${attemptSequence}`;
};

const mutated = (state: RecreateRuntimeState): MinigameRuntimeReductionResult => {
  return { state, didMutate: true };
};

const reduceSubmitPrompt = (
  state: RecreateRuntimeState,
  content: RecreateRuntimeContent,
  rawPrompt: string
): RecreateRuntimeState | null => {
  const prompt = rawPrompt.trim();
  const target = resolveCurrentRecreatePrompt(state, content);
  const teamId = resolveActiveTurnTeamId(state);

  if (
    state.subState !== "writing" ||
    prompt.length === 0 ||
    prompt.length > RECREATE_MAX_PROMPT_LENGTH ||
    target === null ||
    teamId === null
  ) {
    return null;
  }

  const attemptSequence = state.attemptSequence + 1;
  const attempt: RecreateAttempt = {
    attemptId: resolveRecreateAttemptId(target.id, teamId, attemptSequence),
    prompt,
    status: state.liveGeneration ? "generating" : "skipped",
    imageSrc: null,
    failureReason: null
  };

  return {
    ...state,
    subState: "judging",
    attempt,
    attemptSequence,
    checkedIngredientIndexes: [],
    lastPointsAwarded: null
  };
};

const reduceResolveGeneration = (
  state: RecreateRuntimeState,
  payload: { attemptId: string; imageSrc: string | null; failureReason: string | null }
): RecreateRuntimeState | null => {
  const attempt = state.attempt;

  // A result for an attempt the team already abandoned, or one that has
  // already settled, is stale: nothing to do.
  if (
    attempt === null ||
    attempt.attemptId !== payload.attemptId ||
    attempt.status !== "generating"
  ) {
    return null;
  }

  const imageSrc = payload.imageSrc === null ? null : payload.imageSrc.trim();
  const isReady = imageSrc !== null && imageSrc.length > 0;

  return {
    ...state,
    attempt: {
      ...attempt,
      status: isReady ? "ready" : "failed",
      imageSrc: isReady ? imageSrc : null,
      failureReason: isReady ? null : (payload.failureReason ?? "The forger did not answer.")
    }
  };
};

const reduceToggleIngredient = (
  state: RecreateRuntimeState,
  content: RecreateRuntimeContent,
  ingredientIndex: number
): RecreateRuntimeState | null => {
  const target = resolveCurrentRecreatePrompt(state, content);

  if (
    state.subState !== "judging" ||
    target === null ||
    ingredientIndex >= target.ingredients.length
  ) {
    return null;
  }

  const isChecked = state.checkedIngredientIndexes.includes(ingredientIndex);
  const checkedIngredientIndexes = isChecked
    ? state.checkedIngredientIndexes.filter((index) => index !== ingredientIndex)
    : [...state.checkedIngredientIndexes, ingredientIndex].sort((a, b) => a - b);

  return { ...state, checkedIngredientIndexes };
};

const reduceLockScore = (
  state: RecreateRuntimeState,
  pointsMax: number
): RecreateRuntimeState | null => {
  const teamId = resolveActiveTurnTeamId(state);

  if (state.subState !== "judging" || teamId === null) {
    return null;
  }

  const previousPoints = state.pendingPointsByTeamId[teamId] ?? 0;
  const nextPoints = Math.min(
    pointsMax,
    previousPoints + state.checkedIngredientIndexes.length * state.pointsPerIngredient
  );

  return {
    ...state,
    subState: "scored",
    targetsCompletedThisTurn: state.targetsCompletedThisTurn + 1,
    lastPointsAwarded: nextPoints - previousPoints,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId, [teamId]: nextPoints }
  };
};

// The redo escape hatch for a prompt the team regrets: back to writing, the
// attempt and its ticks discarded, nothing scored.
const reduceRetryPrompt = (state: RecreateRuntimeState): RecreateRuntimeState | null => {
  if (state.subState !== "judging") {
    return null;
  }

  return {
    ...state,
    subState: "writing",
    attempt: null,
    checkedIngredientIndexes: [],
    lastPointsAwarded: null
  };
};

const reduceNextTarget = (
  state: RecreateRuntimeState,
  content: RecreateRuntimeContent
): RecreateRuntimeState | null => {
  if (
    state.subState !== "scored" ||
    state.targetsCompletedThisTurn >= state.targetsPerTurn ||
    content.prompts.length === 0
  ) {
    return null;
  }

  return {
    ...state,
    promptCursor: (state.promptCursor + 1) % content.prompts.length,
    subState: "writing",
    attempt: null,
    checkedIngredientIndexes: [],
    lastPointsAwarded: null
  };
};

export const recreateRuntimePlugin: MinigameRuntimePlugin = {
  id: "RECREATE",
  content: recreateContentAdapter,
  isRules: isRecreateRules,
  initialize: (input) => {
    const rules = resolveRecreateRules(input.rules);
    const content = resolveRecreateContent(input.content);
    const runtimeTeamIds =
      input.activeRoundTeamId === null ? input.teamIds : [input.activeRoundTeamId];

    const initialState: RecreateRuntimeState = {
      turnOrderTeamIds: [...runtimeTeamIds],
      activeTurnIndex: 0,
      promptCursor: resolveSeededPromptCursor(
        input.teamIds,
        input.activeRoundTeamId,
        rules.targetsPerTurn,
        content.prompts.length
      ),
      targetsPerTurn: rules.targetsPerTurn,
      targetsCompletedThisTurn: 0,
      pointsPerIngredient: rules.pointsPerIngredient,
      liveGeneration: rules.liveGeneration,
      subState: "writing",
      attempt: null,
      attemptSequence: 0,
      checkedIngredientIndexes: [],
      lastPointsAwarded: null,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };

    return initialState;
  },
  reduceAction: (input) => {
    const unchanged = { state: input.state, didMutate: false };

    if (!isRecreateRuntimeState(input.state)) {
      return unchanged;
    }

    const state = input.state;
    const content = resolveRecreateContent(input.content);
    const { actionType, actionPayload } = input.envelope;
    let nextState: RecreateRuntimeState | null = null;

    if (actionType === "submitPrompt" && isSubmitPromptPayload(actionPayload)) {
      nextState = reduceSubmitPrompt(state, content, actionPayload.prompt);
    } else if (
      actionType === "resolveGeneration" &&
      isResolveGenerationPayload(actionPayload)
    ) {
      nextState = reduceResolveGeneration(state, actionPayload);
    } else if (
      actionType === "toggleIngredient" &&
      isToggleIngredientPayload(actionPayload)
    ) {
      nextState = reduceToggleIngredient(state, content, actionPayload.ingredientIndex);
    } else if (actionType === "lockScore") {
      nextState = reduceLockScore(state, input.pointsMax);
    } else if (actionType === "retryPrompt") {
      nextState = reduceRetryPrompt(state);
    } else if (actionType === "nextTarget") {
      nextState = reduceNextTarget(state, content);
    }

    return nextState === null ? unchanged : mutated(nextState);
  },
  syncPendingPoints: (input) => {
    if (!isRecreateRuntimeState(input.state)) {
      return input.state;
    }

    return { ...input.state, pendingPointsByTeamId: { ...input.pendingPointsByTeamId } };
  },
  syncContent: (input) => {
    if (!isRecreateRuntimeState(input.state)) {
      return input.state;
    }

    const content = resolveRecreateContent(input.content);

    return {
      ...input.state,
      promptCursor:
        content.prompts.length === 0
          ? input.state.promptCursor
          : input.state.promptCursor % content.prompts.length
    };
  },
  selectHostView: (input) => {
    if (!isRecreateRuntimeState(input.state)) {
      return null;
    }

    return toRecreateHostView(input.state, resolveRecreateContent(input.content));
  },
  selectDisplayView: (input) => {
    if (!isRecreateRuntimeState(input.state)) {
      return null;
    }

    return toRecreateDisplayView(input.state, resolveRecreateContent(input.content));
  }
};

export { isRecreateRuntimeState };
export { RECREATE_MAX_PROMPT_LENGTH };
export type { RecreateRuntimeState };
