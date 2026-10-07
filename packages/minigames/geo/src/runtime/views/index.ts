import type {
  GeoMinigameDisplayPrompt,
  GeoMinigameDisplayView,
  GeoMinigameHostPrompt,
  GeoMinigamePlayerView,
  GeoPrompt,
  MinigameDisplayView,
  MinigameHostView,
  PhoneAnswerTally
} from "@wingnight/shared";
import { resolveCountedAnsweringPlayers, type MinigameAnsweringPlayer } from "@wingnight/minigames-core";

import { cloneGeoPrompt } from "../content/index.js";
import type { GeoRuntimeContent, GeoRuntimeState } from "../types/index.js";

// How many of the playing team's phones have a pin down on the open photo, out of the phones that
// can pin — a count, never a coordinate or a name. Null once the photo is locked, and on a night
// with no phones on the team.
const resolvePhonePinTally = (
  state: GeoRuntimeState,
  answeringPlayers: readonly MinigameAnsweringPlayer[]
): PhoneAnswerTally | null => {
  if (answeringPlayers.length === 0 || state.currentSubState !== "guessing") {
    return null;
  }

  const hasPinned = (playerId: string): boolean => Object.hasOwn(state.phonePinsByPlayerId, playerId);
  const counted = resolveCountedAnsweringPlayers(answeringPlayers, hasPinned);

  return {
    answeredCount: counted.filter((player) => hasPinned(player.id)).length,
    seatedCount: counted.length
  };
};

// The photo's place in the turn as the counters number it: the one on screen, 1-based.
const resolvePhotoNumber = (state: GeoRuntimeState): number => {
  return Math.min(
    state.promptsPerTurn,
    state.promptsCompletedThisTurn + (state.currentSubState === "submitted" ? 0 : 1)
  );
};

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
  content: GeoRuntimeContent,
  answeringPlayers: readonly MinigameAnsweringPlayer[] = []
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
    lastResult:
      state.lastResult === null
        ? null
        : { ...state.lastResult, pins: state.lastResult.pins.map((pin) => ({ ...pin })) },
    phoneAnswers: resolvePhonePinTally(state, answeringPlayers)
  };
};

export const toGeoDisplayView = (
  state: GeoRuntimeState,
  content: GeoRuntimeContent,
  answeringPlayers: readonly MinigameAnsweringPlayer[] = []
): MinigameDisplayView => {
  const currentPrompt = resolveCurrentGeoPrompt(state, content);
  const phonePinTally = resolvePhonePinTally(state, answeringPlayers);

  const baseView = {
    minigame: "GEO" as const,
    activeTurnTeamId: resolveActiveTurnTeamId(state),
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    promptsPerTurn: state.promptsPerTurn,
    promptsCompletedThisTurn: state.promptsCompletedThisTurn,
    currentPrompt: currentPrompt === null ? null : toDisplayPrompt(currentPrompt),
    // The team's own pin, so the TV can show it land while they argue. The
    // answer stays behind `isRevealSafe` below.
    currentGuess: state.currentGuess === null ? null : { ...state.currentGuess },
    // The phones' pins are a COUNT until the lock: a coordinate on the TV is one the whole room —
    // the team's own table included — could copy, and a name would say who is still thinking.
    phoneAnswers: phonePinTally
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
      pointsAwarded: state.lastResult.pointsAwarded,
      // Every pin that was in, by name, for the TV to plot beside the answer — never by id.
      pins: state.lastResult.pins.map((pin) => ({
        name: pin.name,
        lat: pin.lat,
        lng: pin.lng,
        distanceKm: pin.distanceKm,
        pointsAwarded: pin.pointsAwarded,
        isBest: pin.isBest
      }))
    }
  } satisfies GeoMinigameDisplayView;
};

// One phone's card: the photo it is pinning (by title — the TV shows the photo), its OWN pin, and
// once the host locks the photo, how that pin measured. Nobody else's pin, ever.
export const toGeoPlayerView = (
  state: GeoRuntimeState,
  content: GeoRuntimeContent,
  playerId: string,
  showOwnAnswer: boolean
): GeoMinigamePlayerView | null => {
  const currentPrompt = resolveCurrentGeoPrompt(state, content);

  if (currentPrompt === null) {
    return null;
  }

  const isLocked = state.currentSubState === "submitted";
  const ownPin = showOwnAnswer ? (state.phonePinsByPlayerId[playerId] ?? null) : null;
  const ownResult =
    showOwnAnswer && isLocked && state.lastResult?.promptId === currentPrompt.id
      ? (state.lastResult.pins.find((pin) => pin.playerId === playerId) ?? null)
      : null;

  return {
    minigame: "GEO",
    promptId: currentPrompt.id,
    promptTitle: currentPrompt.title,
    photoNumber: resolvePhotoNumber(state),
    promptsPerTurn: state.promptsPerTurn,
    status: isLocked ? "locked" : "open",
    pin: ownPin === null ? null : { lat: ownPin.lat, lng: ownPin.lng },
    result:
      ownResult === null
        ? null
        : { distanceKm: ownResult.distanceKm, pointsAwarded: ownResult.pointsAwarded, isBest: ownResult.isBest }
  };
};
