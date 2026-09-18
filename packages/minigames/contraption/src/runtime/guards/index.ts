import {
  CONTRAPTION_GRID_COLUMNS,
  CONTRAPTION_GRID_ROWS,
  isContraptionPlacedPiece,
  type ContraptionMinigameRun,
  type ContraptionPhase,
  type ContraptionPlacedPiece,
  type ContraptionRunOutcome
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { ContraptionRuntimeState } from "../types/index.js";

const CONTRAPTION_PHASES: readonly ContraptionPhase[] = ["building", "ran", "done"];

const RUN_OUTCOMES: readonly ContraptionRunOutcome[] = [
  "landed",
  "short",
  "long",
  "perched",
  "restless"
];

export type PlacePiecePayload = ContraptionPlacedPiece;

export type RemovePiecePayload = {
  column: number;
  row: number;
};

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isNonNegativeInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
};

const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
};

const isContraptionPhase = (value: unknown): value is ContraptionPhase => {
  return CONTRAPTION_PHASES.some((phase) => phase === value);
};

const isRunOutcome = (value: unknown): value is ContraptionRunOutcome => {
  return RUN_OUTCOMES.some((outcome) => outcome === value);
};

const isRun = (value: unknown): value is ContraptionMinigameRun => {
  if (!isObjectLike(value)) {
    return false;
  }

  const run = value as Partial<ContraptionMinigameRun>;

  if (!isPositiveInteger(run.attemptNumber) || !isRunOutcome(run.outcome)) {
    return false;
  }

  if (
    !isObjectLike(run.track) ||
    !isPositiveInteger(run.track.keyframeHz) ||
    !Array.isArray(run.track.positions) ||
    !run.track.positions.every(isFiniteNumber)
  ) {
    return false;
  }

  if (run.settleSeconds !== null && !isFiniteNumber(run.settleSeconds)) {
    return false;
  }

  return (
    isStringArray(run.collectedPickupIds) &&
    isNonNegativeInteger(run.points) &&
    isNonNegativeInteger(run.replayToken)
  );
};

export const isContraptionRuntimeState = (
  value: SerializableValue
): value is ContraptionRuntimeState => {
  if (!isObjectLike(value)) {
    return false;
  }

  const state = value as Partial<ContraptionRuntimeState>;

  if (!isStringArray(state.turnOrderTeamIds) || !isNonNegativeInteger(state.activeTurnIndex)) {
    return false;
  }

  if (state.levelId !== null && typeof state.levelId !== "string") {
    return false;
  }

  if (!isPositiveInteger(state.attemptsPerTurn) || !isNonNegativeInteger(state.attemptsUsed)) {
    return false;
  }

  if (!isContraptionPhase(state.phase)) {
    return false;
  }

  if (!Array.isArray(state.pieces) || !state.pieces.every(isContraptionPlacedPiece)) {
    return false;
  }

  if (state.run !== null && !isRun(state.run)) {
    return false;
  }

  if (
    !isNonNegativeInteger(state.bestPoints) ||
    !isNonNegativeInteger(state.pendingPointsBaseline)
  ) {
    return false;
  }

  return (
    isObjectLike(state.pendingPointsByTeamId) &&
    Object.values(state.pendingPointsByTeamId).every((entry) => typeof entry === "number")
  );
};

export const isPlacePiecePayload = (
  actionPayload: SerializableValue
): actionPayload is PlacePiecePayload => {
  return isContraptionPlacedPiece(actionPayload);
};

export const isRemovePiecePayload = (
  actionPayload: SerializableValue
): actionPayload is RemovePiecePayload => {
  if (!isObjectLike(actionPayload)) {
    return false;
  }

  const payload = actionPayload as Partial<RemovePiecePayload>;

  return (
    isNonNegativeInteger(payload.column) &&
    payload.column < CONTRAPTION_GRID_COLUMNS &&
    isNonNegativeInteger(payload.row) &&
    payload.row < CONTRAPTION_GRID_ROWS
  );
};
