import {
  isFiniteNumber,
  isNonNegativeInteger,
  isNumberRecord,
  isPositiveInteger,
  isRecord,
  type BordenStick
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { BordenRuntimeState } from "../types/index.js";

const isInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value);
};

/**
 * Whether a value is this game's own runtime state. Asked on every action, and a stretch's frame
 * is a few kilobytes only this reducer ever writes, so the check is of the state's own fields and
 * goes no deeper: it is there to refuse another game's state, not to audit ours.
 */
export const isBordenRuntimeState = (value: SerializableValue): value is BordenRuntimeState => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.activeTurnTeamId === null || typeof value.activeTurnTeamId === "string") &&
    Array.isArray(value.roster) &&
    Array.isArray(value.crew) &&
    typeof value.tablet === "boolean" &&
    Array.isArray(value.stretches) &&
    isPositiveInteger(value.stretchesPerTurn) &&
    isInteger(value.courseSeed) &&
    isNonNegativeInteger(value.stretchIndex) &&
    isFiniteNumber(value.turnStartPoints) &&
    isNumberRecord(value.pendingPointsByTeamId)
  );
};

/** The left thumb: at rest, or one of eight directions. A pad sends where it is, never a tick. */
export const isBordenStickPayload = (value: SerializableValue): value is { dir: BordenStick } => {
  return isRecord(value) && isInteger(value.dir) && value.dir >= 0 && value.dir <= 8;
};

/** The right thumb's press. It carries nothing: the room stamps when. */
export const isBordenJumpPayload = (value: SerializableValue): boolean => {
  return isRecord(value);
};
