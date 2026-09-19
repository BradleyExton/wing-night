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
  return isFiniteNumber(point.x) && isFiniteNumber(point.y);
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

const COORDINATE_ROUNDING_FACTOR = 1000;

const clampUnitInterval = (value: number): number => {
  return Math.min(1, Math.max(0, value));
};

// Three decimals is a step of 0.001 on a normalized axis — roughly one pixel
// on a 1080-tall board and under two on a 1920-wide one, and perfect-freehand
// already smooths the samples at streamline 0.45. Past that the extra digits
// are wire bytes and nothing else.
//
// Clamping runs first so rounding can only ever move a value inside [0, 1];
// rounding first could hand the clamp a 1.0004. The explicit zero case
// normalizes -0, which Math.round returns for a tiny negative sample: JSON
// serializes it as 0, so it would never show up on the wire, but state would
// be holding a value that fails Object.is against the 0 it prints as.
const sanitizeCoordinate = (value: number): number => {
  const rounded =
    Math.round(clampUnitInterval(value) * COORDINATE_ROUNDING_FACTOR) /
    COORDINATE_ROUNDING_FACTOR;

  return rounded === 0 ? 0 : rounded;
};

// Coordinates arrive normalized from the tablet; clamping keeps stray
// out-of-bounds pointer samples from distorting the display projection, and
// rounding is enforced here — at the trust boundary — rather than at each
// render site, so nothing downstream ever holds precision the board cannot
// draw. The point is rebuilt from x and y alone, so any extra field a tablet
// tacks on is dropped here rather than stored and broadcast.
export const sanitizeDrawingPoint = (point: DrawingPoint): DrawingPoint => {
  return {
    x: sanitizeCoordinate(point.x),
    y: sanitizeCoordinate(point.y)
  };
};
