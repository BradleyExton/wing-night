import type { GeoPromptResult, MinigameType } from "@wingnight/shared";
import type { MinigameRuntimePlugin } from "@wingnight/minigames-core";
import { resolveSeededPromptCursor } from "@wingnight/minigames-core";

import { geoContentAdapter, resolveGeoContent } from "./content/index.js";
import { isGeoRuntimeState, isSetGuessPayload } from "./guards/index.js";
import { isGeoRules, resolveGeoRules } from "./rules/index.js";
import { resolveGeoPinResults, type GeoPinCandidate } from "./scoring/index.js";
import type { GeoRuntimeState } from "./types/index.js";
import {
  resolveCurrentGeoPrompt,
  toGeoDisplayView,
  toGeoHostView,
  toGeoPlayerView
} from "./views/index.js";

export const geoMinigameId: MinigameType = "GEO";

// A playing-team phone dropping (or moving) its own pin on the photo in hand.
export const GEO_PLACE_PIN_ACTION = "placePin";

export const geoRuntimePlugin: MinigameRuntimePlugin = {
  id: "GEO",
  transientActionTypes: ["setGuess"],
  playerActionTypes: [GEO_PLACE_PIN_ACTION],
  content: geoContentAdapter,
  isRules: isGeoRules,
  initialize: (input) => {
    const geoContent = resolveGeoContent(input.content);
    const geoRules = resolveGeoRules(input.rules);
    const runtimeTeamIds =
      input.activeRoundTeamId === null ? input.teamIds : [input.activeRoundTeamId];

    const initialState: GeoRuntimeState = {
      turnOrderTeamIds: runtimeTeamIds,
      activeTurnIndex: 0,
      promptCursor: resolveSeededPromptCursor({
        teamIds: input.teamIds,
        activeRoundTeamId: input.activeRoundTeamId,
        promptsPerTurn: geoRules.promptsPerTurn,
        promptCount: geoContent.prompts.length
      }),
      promptsPerTurn: geoRules.promptsPerTurn,
      promptsCompletedThisTurn: 0,
      currentGuess: null,
      phonePinsByPlayerId: {},
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

    // The host's lock, and the reveal with it. Every pin in counts as one guess — the tablet's and
    // each seated phone's — and the team scores its BEST. A phone whose face is no longer seated
    // has no pin in (its claim ended and took it, or it never answered).
    if (input.envelope.actionType === "submitGuess") {
      if (state.currentSubState !== "guessing" || currentPrompt === null) {
        return unchanged;
      }

      const activeTurnTeamId =
        state.turnOrderTeamIds[state.activeTurnIndex] ?? null;

      if (activeTurnTeamId === null) {
        return unchanged;
      }

      const candidates: GeoPinCandidate[] = [
        ...(state.currentGuess === null
          ? []
          : [{ playerId: null, name: null, lat: state.currentGuess.lat, lng: state.currentGuess.lng }]),
        ...(input.answeringPlayers ?? []).flatMap((player) => {
          const pin = state.phonePinsByPlayerId[player.id];

          return pin === undefined ? [] : [{ playerId: player.id, name: player.name, lat: pin.lat, lng: pin.lng }];
        })
      ];
      const pins = resolveGeoPinResults(
        candidates,
        currentPrompt.answer,
        resolveGeoRules(input.rules).scoreBandsKm
      );
      const best = pins.find((pin) => pin.isBest);

      // No pin anywhere: nothing to lock in.
      if (best === undefined) {
        return unchanged;
      }

      const pointsAwarded = best.pointsAwarded;
      const previousPoints = state.pendingPointsByTeamId[activeTurnTeamId] ?? 0;

      const result: GeoPromptResult = {
        promptId: currentPrompt.id,
        guessLat: best.lat,
        guessLng: best.lng,
        distanceKm: best.distanceKm,
        pointsAwarded,
        pins
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
          phonePinsByPlayerId: {},
          currentSubState: "guessing"
        },
        didMutate: true
      };
    }

    return unchanged;
  },
  // A playing-team phone's own pin. The server has already checked the face is seated and on the
  // playing team; the photo has to be open, and the pin on the map.
  reducePlayerAction: (input) => {
    const unchanged = { state: input.state, didMutate: false };

    if (
      !isGeoRuntimeState(input.state) ||
      input.envelope.actionType !== GEO_PLACE_PIN_ACTION ||
      input.state.currentSubState !== "guessing" ||
      !input.answeringPlayers.some((player) => player.id === input.playerId) ||
      resolveCurrentGeoPrompt(input.state, resolveGeoContent(input.content)) === null ||
      !isSetGuessPayload(input.envelope.actionPayload)
    ) {
      return unchanged;
    }

    const { lat, lng } = input.envelope.actionPayload;
    const previous = input.state.phonePinsByPlayerId[input.playerId];

    if (previous !== undefined && previous.lat === lat && previous.lng === lng) {
      return unchanged;
    }

    return {
      state: {
        ...input.state,
        phonePinsByPlayerId: { ...input.state.phonePinsByPlayerId, [input.playerId]: { lat, lng } }
      },
      didMutate: true
    };
  },
  releasePlayerAnswer: (input) => {
    const unchanged = { state: input.state, didMutate: false };

    if (
      !isGeoRuntimeState(input.state) ||
      input.state.currentSubState !== "guessing" ||
      !Object.hasOwn(input.state.phonePinsByPlayerId, input.playerId)
    ) {
      return unchanged;
    }

    const { [input.playerId]: _released, ...phonePinsByPlayerId } = input.state.phonePinsByPlayerId;

    return { state: { ...input.state, phonePinsByPlayerId }, didMutate: true };
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

    return toGeoHostView(input.state, resolveGeoContent(input.content), input.answeringPlayers);
  },
  selectDisplayView: (input) => {
    if (!isGeoRuntimeState(input.state)) {
      return null;
    }

    return toGeoDisplayView(input.state, resolveGeoContent(input.content), input.answeringPlayers);
  },
  selectPlayerView: (input) => {
    if (!isGeoRuntimeState(input.state)) {
      return null;
    }

    return toGeoPlayerView(
      input.state,
      resolveGeoContent(input.content),
      input.playerId,
      input.showOwnAnswer
    );
  }
};
