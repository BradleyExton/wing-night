import { isNonNegativeInteger, type GeoPinResult, type GeoPromptResult } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type {
  GeoRuntimeGuess,
  GeoRuntimeState,
  GeoRuntimeSubState
} from "../types/index.js";

const isLatitude = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
};

const isLongitude = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
};

const isGeoRuntimeSubState = (value: unknown): value is GeoRuntimeSubState => {
  return value === "guessing" || value === "submitted";
};

const isGeoRuntimeGuess = (value: unknown): value is GeoRuntimeGuess => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const guess = value as Partial<GeoRuntimeGuess>;
  return isLatitude(guess.lat) && isLongitude(guess.lng);
};

const isGeoPinResult = (value: unknown): value is GeoPinResult => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const pin = value as Partial<GeoPinResult>;

  return (
    (pin.playerId === null || typeof pin.playerId === "string") &&
    (pin.name === null || typeof pin.name === "string") &&
    isLatitude(pin.lat) &&
    isLongitude(pin.lng) &&
    typeof pin.distanceKm === "number" &&
    Number.isFinite(pin.distanceKm) &&
    isNonNegativeInteger(pin.pointsAwarded) &&
    typeof pin.isBest === "boolean"
  );
};

const isPinRecord = (value: unknown): value is Record<string, GeoRuntimeGuess> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((pin) => isGeoRuntimeGuess(pin));
};

const isGeoPromptResult = (value: unknown): value is GeoPromptResult => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const result = value as Partial<GeoPromptResult>;

  if (typeof result.promptId !== "string" || result.promptId.length === 0) {
    return false;
  }

  if (!isLatitude(result.guessLat) || !isLongitude(result.guessLng)) {
    return false;
  }

  if (typeof result.distanceKm !== "number" || !Number.isFinite(result.distanceKm)) {
    return false;
  }

  if (!Array.isArray(result.pins) || !result.pins.every((pin) => isGeoPinResult(pin))) {
    return false;
  }

  return isNonNegativeInteger(result.pointsAwarded);
};

export const isGeoRuntimeState = (
  value: SerializableValue
): value is GeoRuntimeState => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const state = value as Partial<GeoRuntimeState>;

  if (
    !Array.isArray(state.turnOrderTeamIds) ||
    !state.turnOrderTeamIds.every((teamId) => typeof teamId === "string")
  ) {
    return false;
  }

  if (!isNonNegativeInteger(state.activeTurnIndex)) {
    return false;
  }

  if (!isNonNegativeInteger(state.promptCursor)) {
    return false;
  }

  if (
    typeof state.promptsPerTurn !== "number" ||
    !Number.isInteger(state.promptsPerTurn) ||
    state.promptsPerTurn <= 0
  ) {
    return false;
  }

  if (!isNonNegativeInteger(state.promptsCompletedThisTurn)) {
    return false;
  }

  if (state.currentGuess !== null && !isGeoRuntimeGuess(state.currentGuess)) {
    return false;
  }

  if (!isPinRecord(state.phonePinsByPlayerId)) {
    return false;
  }

  if (!isGeoRuntimeSubState(state.currentSubState)) {
    return false;
  }

  if (state.lastResult !== null && !isGeoPromptResult(state.lastResult)) {
    return false;
  }

  if (
    typeof state.pendingPointsByTeamId !== "object" ||
    state.pendingPointsByTeamId === null
  ) {
    return false;
  }

  return Object.values(state.pendingPointsByTeamId).every(
    (entry) => typeof entry === "number"
  );
};

export const isSetGuessPayload = (
  actionPayload: SerializableValue
): actionPayload is GeoRuntimeGuess => {
  return isGeoRuntimeGuess(actionPayload);
};
