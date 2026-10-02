import {
  isFiniteNumber,
  isNonNegativeInteger,
  isNumberRecord,
  isPositiveInteger,
  isRecord,
  type BrawlBestTurn,
  type BrawlBlockResult,
  type BrawlBlockStatus,
  type BrawlInput,
  type BrawlMinigameBlock,
  type BrawlOutcome,
  type BrawlPlayerFigure
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { BrawlRoundMemory, BrawlRuntimeBlock, BrawlRuntimeState } from "../types/index.js";

const BLOCK_STATUSES: readonly BrawlBlockStatus[] = ["ready", "running", "done"];
const OUTCOMES: readonly BrawlOutcome[] = ["cleared", "ko", "timeout"];
const WALK_DIRS: readonly number[] = [-1, 0, 1];

const isInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value);
};

const isBlockStatus = (value: unknown): value is BrawlBlockStatus => {
  return BLOCK_STATUSES.some((status) => status === value);
};

const isWalkDir = (value: unknown): value is -1 | 0 | 1 => {
  return WALK_DIRS.some((dir) => dir === value);
};

const isResultOrNull = (value: unknown): value is BrawlBlockResult | null => {
  if (value === null) {
    return true;
  }

  return (
    isRecord(value) &&
    OUTCOMES.some((outcome) => outcome === value.outcome) &&
    isNonNegativeInteger(value.endTick) &&
    isNonNegativeInteger(value.goons) &&
    isNonNegativeInteger(value.hearts)
  );
};

const isFigureOrNull = (value: unknown): value is BrawlPlayerFigure | null => {
  if (value === null) {
    return true;
  }

  return (
    isRecord(value) &&
    typeof value.playerId === "string" &&
    typeof value.name === "string" &&
    (value.avatarSrc === null || typeof value.avatarSrc === "string") &&
    (value.teamId === null || typeof value.teamId === "string") &&
    (value.genre === null || typeof value.genre === "string")
  );
};

const isInput = (value: unknown): value is BrawlInput => {
  if (!isRecord(value) || !isNonNegativeInteger(value.tick)) {
    return false;
  }

  return value.kind === "peck" || (value.kind === "walk" && isWalkDir(value.dir));
};

const isBlock = (value: unknown): value is BrawlRuntimeBlock => {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.blockIndex) &&
    isFigureOrNull(value.player) &&
    isBlockStatus(value.status) &&
    Array.isArray(value.inputs) &&
    value.inputs.every(isInput) &&
    typeof value.skipped === "boolean" &&
    isResultOrNull(value.result) &&
    typeof value.heartBought === "boolean"
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
    isNonNegativeInteger(value.goons)
  );
};

/**
 * What the previous turn handed on, if it was ours. Anything else — another game's memory, a
 * shape from before this field existed — is no memory at all, and the round starts with nothing
 * to beat.
 */
export const isBrawlRoundMemory = (
  value: SerializableValue | null | undefined
): value is BrawlRoundMemory => {
  return isRecord(value) && isBestTurnOrNull(value.bestTurn);
};

export const isBrawlRuntimeState = (value: SerializableValue): value is BrawlRuntimeState => {
  if (!isRecord(value)) {
    return false;
  }

  const state = value as Partial<BrawlRuntimeState>;

  return (
    (state.activeTurnTeamId === null || typeof state.activeTurnTeamId === "string") &&
    (state.activeTurnTeamName === null || typeof state.activeTurnTeamName === "string") &&
    isNonNegativeInteger(state.blocksPerTurn) &&
    isInteger(state.courseSeed) &&
    isPositiveInteger(state.heartPrice) &&
    isNonNegativeInteger(state.blockIndex) &&
    Array.isArray(state.blocks) &&
    state.blocks.every(isBlock) &&
    isFiniteNumber(state.turnStartPoints) &&
    isNumberRecord(state.pendingPointsByTeamId) &&
    isBestTurnOrNull(state.bestTurn)
  );
};

export type BrawlWalkPayload = {
  tick: number;
  dir: -1 | 0 | 1;
};

export type BrawlPeckPayload = {
  tick: number;
};

export const isBrawlWalkPayload = (
  actionPayload: SerializableValue
): actionPayload is BrawlWalkPayload => {
  return (
    isRecord(actionPayload) &&
    isNonNegativeInteger(actionPayload.tick) &&
    isWalkDir(actionPayload.dir)
  );
};

export const isBrawlPeckPayload = (
  actionPayload: SerializableValue
): actionPayload is BrawlPeckPayload => {
  return isRecord(actionPayload) && isNonNegativeInteger(actionPayload.tick);
};

/** `buyHeart` carries nothing: the block in hand is the one bought for. */
export const isBrawlBuyHeartPayload = (actionPayload: SerializableValue): boolean => {
  return isRecord(actionPayload);
};

/**
 * The handoff pick (docs/minigames/brawl-spec.md §0.3): whether the teammate on the line may buy
 * a fourth heart now. Only on a block after the first — the first block has nothing banked to
 * spend — only while it is `ready` (the first thumb on the street closes the offer), only once,
 * and only when the team's banked worth covers the price, so the bank can never go below nought.
 * The reducer refuses `buyHeart` on the same test the tablet draws the cards on.
 */
export const canBuyBrawlHeart = ({
  block,
  banked,
  heartPrice
}: {
  block: Pick<BrawlMinigameBlock, "blockIndex" | "status" | "heartBought"> | null;
  banked: number;
  heartPrice: number;
}): boolean => {
  return (
    block !== null &&
    block.status === "ready" &&
    block.blockIndex >= 1 &&
    !block.heartBought &&
    heartPrice > 0 &&
    banked >= heartPrice
  );
};
