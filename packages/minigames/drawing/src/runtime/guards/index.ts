import type {
  DrawingPoint,
  DrawingPromptReveal,
  DrawingStroke
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { DrawingRuntimeState } from "../types/index.js";

export type BeginStrokePayload = {
  strokeId: string;
  color: string;
  size: number;
  start: DrawingPoint;
};

export type AppendStrokePointsPayload = {
  strokeId: string;
  points: DrawingPoint[];
};

export type EndStrokePayload = {
  strokeId: string;
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

const isNonNegativeInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isDrawingPoint = (value: unknown): value is DrawingPoint => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const point = value as Partial<DrawingPoint>;
  return (
    isFiniteNumber(point.x) &&
    isFiniteNumber(point.y) &&
    isFiniteNumber(point.t) &&
    point.t >= 0
  );
};

const isStrokeColor = (value: unknown): value is string => {
  return isNonEmptyString(value) && value.length <= 32;
};

const isStrokeSize = (value: unknown): value is number => {
  return isFiniteNumber(value) && value > 0 && value <= 1;
};

const isDrawingStroke = (value: unknown): value is DrawingStroke => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const stroke = value as Partial<DrawingStroke>;

  if (!isNonEmptyString(stroke.strokeId)) {
    return false;
  }

  if (!Array.isArray(stroke.points) || !stroke.points.every(isDrawingPoint)) {
    return false;
  }

  return isStrokeColor(stroke.color) && isStrokeSize(stroke.size);
};

const isDrawingPromptReveal = (
  value: unknown
): value is DrawingPromptReveal => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const reveal = value as Partial<DrawingPromptReveal>;

  if (!isNonEmptyString(reveal.promptId) || !isNonEmptyString(reveal.promptText)) {
    return false;
  }

  if (reveal.outcome !== "CORRECT" && reveal.outcome !== "INCORRECT") {
    return false;
  }

  return (
    isFiniteNumber(reveal.revealedAtMs) &&
    isFiniteNumber(reveal.expiresAtMs) &&
    reveal.revealedAtMs >= 0 &&
    reveal.expiresAtMs >= reveal.revealedAtMs
  );
};

export const isDrawingRuntimeState = (
  value: SerializableValue
): value is DrawingRuntimeState => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const state = value as Partial<DrawingRuntimeState>;

  if (state.activeTurnTeamId !== null && !isNonEmptyString(state.activeTurnTeamId)) {
    return false;
  }

  if (!isNonNegativeInteger(state.promptCursor)) {
    return false;
  }

  if (
    !Array.isArray(state.shuffledPromptIds) ||
    !state.shuffledPromptIds.every((promptId) => isNonEmptyString(promptId))
  ) {
    return false;
  }

  if (
    typeof state.pendingPointsByTeamId !== "object" ||
    state.pendingPointsByTeamId === null
  ) {
    return false;
  }

  if (
    !Object.values(state.pendingPointsByTeamId).every(
      (entry) => typeof entry === "number"
    )
  ) {
    return false;
  }

  if (!Array.isArray(state.strokes) || !state.strokes.every(isDrawingStroke)) {
    return false;
  }

  if (state.activeStrokeId !== null && !isNonEmptyString(state.activeStrokeId)) {
    return false;
  }

  return state.reveal === null || isDrawingPromptReveal(state.reveal);
};

export const isBeginStrokePayload = (
  actionPayload: SerializableValue
): actionPayload is BeginStrokePayload => {
  if (typeof actionPayload !== "object" || actionPayload === null) {
    return false;
  }

  const payload = actionPayload as Partial<BeginStrokePayload>;

  return (
    isNonEmptyString(payload.strokeId) &&
    isStrokeColor(payload.color) &&
    isStrokeSize(payload.size) &&
    isDrawingPoint(payload.start)
  );
};

export const isAppendStrokePointsPayload = (
  actionPayload: SerializableValue
): actionPayload is AppendStrokePointsPayload => {
  if (typeof actionPayload !== "object" || actionPayload === null) {
    return false;
  }

  const payload = actionPayload as Partial<AppendStrokePointsPayload>;

  if (!isNonEmptyString(payload.strokeId)) {
    return false;
  }

  return (
    Array.isArray(payload.points) &&
    payload.points.length > 0 &&
    payload.points.every(isDrawingPoint)
  );
};

export const isEndStrokePayload = (
  actionPayload: SerializableValue
): actionPayload is EndStrokePayload => {
  if (typeof actionPayload !== "object" || actionPayload === null) {
    return false;
  }

  const payload = actionPayload as Partial<EndStrokePayload>;
  return isNonEmptyString(payload.strokeId);
};

const clampUnitInterval = (value: number): number => {
  return Math.min(1, Math.max(0, value));
};

// Coordinates arrive normalized from the tablet; clamping keeps stray
// out-of-bounds pointer samples from distorting the display projection.
export const sanitizeDrawingPoint = (point: DrawingPoint): DrawingPoint => {
  return {
    x: clampUnitInterval(point.x),
    y: clampUnitInterval(point.y),
    t: point.t
  };
};
