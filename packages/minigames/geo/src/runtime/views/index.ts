import type {
  GeoMinigameDisplayPrompt,
  GeoMinigameDisplayView,
  GeoMinigameHostPrompt,
  GeoPrompt,
  MinigameDisplayView,
  MinigameHostView
} from "@wingnight/shared";

import { cloneGeoPrompt } from "../content/index.js";
import type { GeoRuntimeContent, GeoRuntimeState } from "../types/index.js";

export const resolveCurrentGeoPrompt = (
  state: GeoRuntimeState,
  content: GeoRuntimeContent
): GeoPrompt | null => {
  if (content.prompts.length === 0) {
    return null;
  }

  const promptIndex = state.promptCursor % content.prompts.length;
  const currentPrompt = content.prompts[promptIndex];

  if (currentPrompt === undefined) {
    return null;
  }

  return cloneGeoPrompt(currentPrompt);
};

const resolveActiveTurnTeamId = (state: GeoRuntimeState): string | null => {
  return state.turnOrderTeamIds[state.activeTurnIndex] ?? null;
};

const toHostPrompt = (prompt: GeoPrompt): GeoMinigameHostPrompt => {
  return {
    id: prompt.id,
    title: prompt.title,
    imageSrc: prompt.imageSrc,
    ...(prompt.hint === undefined ? {} : { hint: prompt.hint }),
    answerLat: prompt.answer.lat,
    answerLng: prompt.answer.lng
  };
};

const toDisplayPrompt = (prompt: GeoPrompt): GeoMinigameDisplayPrompt => {
  return {
    id: prompt.id,
    title: prompt.title,
    imageSrc: prompt.imageSrc,
    ...(prompt.hint === undefined ? {} : { hint: prompt.hint })
  };
};

export const toGeoHostView = (
  state: GeoRuntimeState,
  content: GeoRuntimeContent
): MinigameHostView => {
  const currentPrompt = resolveCurrentGeoPrompt(state, content);

  return {
    minigame: "GEO",
    activeTurnTeamId: resolveActiveTurnTeamId(state),
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    promptsPerTurn: state.promptsPerTurn,
    promptsCompletedThisTurn: state.promptsCompletedThisTurn,
    currentSubState: state.currentSubState,
    currentGuess: state.currentGuess === null ? null : { ...state.currentGuess },
    currentPrompt: currentPrompt === null ? null : toHostPrompt(currentPrompt),
    lastResult: state.lastResult === null ? null : { ...state.lastResult }
  };
};

export const toGeoDisplayView = (
  state: GeoRuntimeState,
  content: GeoRuntimeContent
): MinigameDisplayView => {
  const currentPrompt = resolveCurrentGeoPrompt(state, content);

  const baseView = {
    minigame: "GEO" as const,
    activeTurnTeamId: resolveActiveTurnTeamId(state),
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    promptsPerTurn: state.promptsPerTurn,
    promptsCompletedThisTurn: state.promptsCompletedThisTurn,
    currentPrompt: currentPrompt === null ? null : toDisplayPrompt(currentPrompt)
  };

  // Answer coordinates may only leave the server after the guess for this
  // exact prompt is locked in.
  const isRevealSafe =
    state.currentSubState === "submitted" &&
    state.lastResult !== null &&
    currentPrompt !== null &&
    currentPrompt.id === state.lastResult.promptId;

  if (!isRevealSafe || state.lastResult === null || currentPrompt === null) {
    return {
      ...baseView,
      status: "guessing"
    } satisfies GeoMinigameDisplayView;
  }

  return {
    ...baseView,
    status: "submitted",
    result: {
      guessLat: state.lastResult.guessLat,
      guessLng: state.lastResult.guessLng,
      answerLat: currentPrompt.answer.lat,
      answerLng: currentPrompt.answer.lng,
      distanceKm: state.lastResult.distanceKm,
      pointsAwarded: state.lastResult.pointsAwarded
    }
  } satisfies GeoMinigameDisplayView;
};
