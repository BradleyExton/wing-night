import {
  isFiniteNumber,
  isNonNegativeInteger,
  isNumberRecord,
  isPositiveInteger,
  isRecord,
  type BrawlBestTurn,
  type BrawlCrewWalk
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { BrawlRoundMemory, BrawlRuntimeState } from "../types/index.js";

const isInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value);
};

/**
 * Whether a value is this game's own runtime state. Asked on every action, and a block's frame is
 * a few kilobytes that only this reducer ever writes, so the check is of the state's own fields
 * and goes no deeper: it is there to refuse another game's state, not to audit ours.
 */
export const isBrawlRuntimeState = (value: SerializableValue): value is BrawlRuntimeState => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.activeTurnTeamId === null || typeof value.activeTurnTeamId === "string") &&
    Array.isArray(value.roster) &&
    Array.isArray(value.blocks) &&
    isPositiveInteger(value.blocksPerTurn) &&
    isInteger(value.courseSeed) &&
    isNonNegativeInteger(value.blockIndex) &&
    isFiniteNumber(value.turnStartPoints) &&
    isNumberRecord(value.pendingPointsByTeamId)
  );
};

const isBestTurnOrNull = (value: unknown): value is BrawlBestTurn | null => {
  if (value === null) {
    return true;
  }

  return (
    isRecord(value) &&
    (value.teamId === null || typeof value.teamId === "string") &&
    (value.teamName === null || typeof value.teamName === "string") &&
    isNonNegativeInteger(value.banked) &&
    isPositiveInteger(value.total)
  );
};

export const isBrawlRoundMemory = (value: unknown): value is BrawlRoundMemory => {
  return isRecord(value) && isBestTurnOrNull(value.bestTurn);
};

/** A stick: standing, or one of eight directions. A pad sends where it is, never a tick. */
export const isBrawlWalkPayload = (value: SerializableValue): value is { dir: BrawlCrewWalk } => {
  return isRecord(value) && isInteger(value.dir) && value.dir >= 0 && value.dir <= 8;
};

/** The right thumb: down or up. */
export const isBrawlPeckPayload = (value: SerializableValue): value is { held: boolean } => {
  return isRecord(value) && typeof value.held === "boolean";
};
