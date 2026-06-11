import {
  MINIGAME_API_VERSION,
  type GeoPromptResult,
  type MinigameType
} from "@wingnight/shared";
import type {
  MinigamePluginMetadata,
  MinigameRuntimePlugin
} from "@wingnight/minigames-core";

import { parseGeoContentFile, resolveGeoContent } from "./content/index.js";
import { isGeoRuntimeState, isSetGuessPayload } from "./guards/index.js";
import { resolveGeoRules } from "./rules/index.js";
import { haversineDistanceKm, resolvePointsForDistance } from "./scoring/index.js";
import type { GeoRuntimeState } from "./types/index.js";
import {
  resolveCurrentGeoPrompt,
  toGeoDisplayView,
  toGeoHostView
} from "./views/index.js";

export const geoMinigameId: MinigameType = "GEO";

export const geoMinigameMetadata: MinigamePluginMetadata = {
  minigameApiVersion: MINIGAME_API_VERSION,
  capabilities: {
    supportsHostRenderer: true,
    supportsDisplayRenderer: true,
    supportsDevScenarios: true
  }
};

const resolveSeededPromptCursor = (
  teamIds: string[],
  activeRoundTeamId: string | null,
  promptsPerTurn: number,
  promptCount: number
): number => {
  if (promptCount === 0) {
    return 0;
  }

  const teamIndex =
    activeRoundTeamId === null ? 0 : Math.max(0, teamIds.indexOf(activeRoundTeamId));

  return (teamIndex * promptsPerTurn) % promptCount;
};

export const geoRuntimePlugin: MinigameRuntimePlugin = {
  id: "GEO",
  metadata: geoMinigameMetadata,
  content: {
    fileName: "minigames/geo.json",
    parseFileContent: parseGeoContentFile
  },
  initialize: (input) => {
    const geoContent = resolveGeoContent(input.content);
    const geoRules = resolveGeoRules(input.rules);
    const runtimeTeamIds =
      input.activeRoundTeamId === null ? input.teamIds : [input.activeRoundTeamId];

    const initialState: GeoRuntimeState = {
      turnOrderTeamIds: runtimeTeamIds,
      activeTurnIndex: 0,
      promptCursor: resolveSeededPromptCursor(
        input.teamIds,
        input.activeRoundTeamId,
        geoRules.promptsPerTurn,
        geoContent.prompts.length
      ),
      promptsPerTurn: geoRules.promptsPerTurn,
      promptsCompletedThisTurn: 0,
      currentGuess: null,
      currentSubState: "guessing",
      lastResult: null,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };

    return initialState;
  },
  reduceAction: (input) => {
    const unchanged = { state: input.state, didMutate: false };

    if (!isGeoRuntimeState(input.state)) {
      return unchanged;
    }

    const state = input.state;
    const geoContent = resolveGeoContent(input.content);
    const currentPrompt = resolveCurrentGeoPrompt(state, geoContent);

    if (input.envelope.actionType === "setGuess") {
      if (state.currentSubState !== "guessing" || currentPrompt === null) {
        return unchanged;
      }

      if (!isSetGuessPayload(input.envelope.actionPayload)) {
        return unchanged;
      }

      return {
        state: {
          ...state,
          currentGuess: {
            lat: input.envelope.actionPayload.lat,
            lng: input.envelope.actionPayload.lng
          }
        },
        didMutate: true
      };
    }

    if (input.envelope.actionType === "submitGuess") {
      if (
        state.currentSubState !== "guessing" ||
        state.currentGuess === null ||
        currentPrompt === null
      ) {
        return unchanged;
      }

      const activeTurnTeamId =
        state.turnOrderTeamIds[state.activeTurnIndex] ?? null;

      if (activeTurnTeamId === null) {
        return unchanged;
      }

      const geoRules = resolveGeoRules(input.rules);
      const distanceKm = haversineDistanceKm(state.currentGuess, currentPrompt.answer);
      const pointsAwarded = resolvePointsForDistance(
        distanceKm,
        geoRules.scoreBandsKm
      );
      const previousPoints = state.pendingPointsByTeamId[activeTurnTeamId] ?? 0;

      const result: GeoPromptResult = {
        promptId: currentPrompt.id,
        guessLat: state.currentGuess.lat,
        guessLng: state.currentGuess.lng,
        distanceKm,
        pointsAwarded
      };

      return {
        state: {
          ...state,
          currentSubState: "submitted",
          promptsCompletedThisTurn: state.promptsCompletedThisTurn + 1,
          lastResult: result,
          pendingPointsByTeamId: {
            ...state.pendingPointsByTeamId,
            [activeTurnTeamId]: Math.min(
              input.pointsMax,
              previousPoints + pointsAwarded
            )
          }
        },
        didMutate: true
      };
    }

    if (input.envelope.actionType === "nextPrompt") {
      if (
        state.currentSubState !== "submitted" ||
        state.promptsCompletedThisTurn >= state.promptsPerTurn
      ) {
        return unchanged;
      }

      const nextPromptCursor =
        geoContent.prompts.length === 0
          ? state.promptCursor
          : (state.promptCursor + 1) % geoContent.prompts.length;

      return {
        state: {
          ...state,
          promptCursor: nextPromptCursor,
          currentGuess: null,
          currentSubState: "guessing"
        },
        didMutate: true
      };
    }

    return unchanged;
  },
  syncPendingPoints: (input) => {
    if (!isGeoRuntimeState(input.state)) {
      return input.state;
    }

    return {
      ...input.state,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };
  },
  syncContent: (input) => {
    if (!isGeoRuntimeState(input.state)) {
      return input.state;
    }

    const geoContent = resolveGeoContent(input.content);
    const nextPromptCursor =
      geoContent.prompts.length === 0
        ? input.state.promptCursor
        : input.state.promptCursor % geoContent.prompts.length;

    return {
      ...input.state,
      promptCursor: nextPromptCursor
    };
  },
  selectHostView: (input) => {
    if (!isGeoRuntimeState(input.state)) {
      return null;
    }

    return toGeoHostView(input.state, resolveGeoContent(input.content));
  },
  selectDisplayView: (input) => {
    if (!isGeoRuntimeState(input.state)) {
      return null;
    }

    return toGeoDisplayView(input.state, resolveGeoContent(input.content));
  }
};
