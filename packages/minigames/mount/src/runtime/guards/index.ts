import {
  MOUNT_LIMBS,
  MOUNT_PARTICLES,
  MOUNT_WORLD,
  isFiniteNumber,
  isNonNegativeInteger,
  isNumberRecord,
  isPositiveInteger,
  isRecord,
  type MountClimbStatus,
  type MountGooseStance,
  type MountHighLine,
  type MountInputSample,
  type MountLimb,
  type MountMinigameClimbResult,
  type MountOutcome,
  type MountPile,
  type MountPileHen,
  type MountPlayerFigure,
  type MountVec
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { MountRoundMemory, MountRuntimeClimb, MountRuntimeState } from "../types/index.js";

const CLIMB_STATUSES: readonly MountClimbStatus[] = ["ready", "running", "done"];
const OUTCOMES: readonly MountOutcome[] = ["mounted", "timeout"];
const GOOSE_STANCES: readonly MountGooseStance[] = ["stand", "honk", "preen"];
const SAMPLE_KINDS: readonly MountInputSample["kind"][] = ["grab-start", "move", "release"];

const isInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value);
};

const isStringOrNull = (value: unknown): value is string | null => {
  return value === null || typeof value === "string";
};

const isLimb = (value: unknown): value is MountLimb => {
  return MOUNT_LIMBS.some((limb) => limb === value);
};

const isVec = (value: unknown): value is MountVec => {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
};

// A coordinate the tablet could have logged: finite, and on the input grid, so a log is small and
// exact and a re-run on any machine reads the same number.
const isQuantised = (value: unknown): value is number => {
  return isFiniteNumber(value) && Number.isInteger(value / MOUNT_WORLD.inputQuantum);
};

export const isMountInputSample = (value: unknown): value is MountInputSample => {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.tick) &&
    isLimb(value.limb) &&
    SAMPLE_KINDS.some((kind) => kind === value.kind) &&
    isQuantised(value.x) &&
    isQuantised(value.y)
  );
};

const isPose = (value: unknown): boolean => {
  return isRecord(value) && MOUNT_PARTICLES.every((particle) => isVec(value[particle]));
};

const isGrabs = (value: unknown): boolean => {
  return (
    isRecord(value) &&
    Object.entries(value).every(([limb, at]) => isLimb(limb) && isVec(at))
  );
};

const isPileHen = (value: unknown): value is MountPileHen => {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.pileIndex) &&
    isStringOrNull(value.playerId) &&
    isPose(value.pose) &&
    isGrabs(value.grabs) &&
    typeof value.mounted === "boolean"
  );
};

const isHighLine = (value: unknown): value is MountHighLine => {
  return (
    isRecord(value) &&
    isFiniteNumber(value.height) &&
    isFiniteNumber(value.x) &&
    isStringOrNull(value.playerId)
  );
};

/** A pile the sim can climb: a seed, a goose it knows, every hen whole and in pile order, a line. */
export const isMountPile = (value: unknown): value is MountPile => {
  return (
    isRecord(value) &&
    isInteger(value.seed) &&
    GOOSE_STANCES.some((stance) => stance === value.goose) &&
    Array.isArray(value.hens) &&
    value.hens.every((hen, index) => isPileHen(hen) && hen.pileIndex === index) &&
    isHighLine(value.highLine)
  );
};

const isFigure = (value: unknown): value is MountPlayerFigure => {
  return (
    isRecord(value) &&
    typeof value.playerId === "string" &&
    typeof value.name === "string" &&
    isStringOrNull(value.avatarSrc) &&
    isStringOrNull(value.teamId) &&
    isStringOrNull(value.genre)
  );
};

const isResultOrNull = (value: unknown): value is MountMinigameClimbResult | null => {
  if (value === null) {
    return true;
  }

  return (
    isRecord(value) &&
    OUTCOMES.some((outcome) => outcome === value.outcome) &&
    isNonNegativeInteger(value.endTick) &&
    isFiniteNumber(value.share) &&
    isFiniteNumber(value.bestHeight) &&
    isNonNegativeInteger(value.falls)
  );
};

const isClimb = (value: unknown): value is MountRuntimeClimb => {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.climbIndex) &&
    (value.player === null || isFigure(value.player)) &&
    CLIMB_STATUSES.some((status) => status === value.status) &&
    (value.climbTicks === null || isPositiveInteger(value.climbTicks)) &&
    Array.isArray(value.inputs) &&
    value.inputs.every(isMountInputSample) &&
    typeof value.skipped === "boolean" &&
    isResultOrNull(value.result)
  );
};

/**
 * What the previous turn handed on, if it was ours. Anything else — another game's memory, a pile
 * the sim cannot read — is no memory at all, and the round starts on the bare goose.
 */
export const isMountRoundMemory = (
  value: SerializableValue | null | undefined
): value is MountRoundMemory => {
  return isRecord(value) && isMountPile(value.pile);
};

export const isMountRuntimeState = (value: SerializableValue): value is MountRuntimeState => {
  if (!isRecord(value)) {
    return false;
  }

  const state = value as Partial<MountRuntimeState>;

  return (
    isStringOrNull(state.activeTurnTeamId) &&
    isPositiveInteger(state.climbSeconds) &&
    isPositiveInteger(state.secondsPerHen) &&
    isPositiveInteger(state.climbsPerTurn) &&
    isNonNegativeInteger(state.climbIndex) &&
    Array.isArray(state.climbs) &&
    state.climbs.every(isClimb) &&
    isMountPile(state.pile) &&
    isMountPile(state.pileAtTurnStart) &&
    isRecord(state.figures) &&
    Object.values(state.figures).every(isFigure) &&
    isFiniteNumber(state.turnStartPoints) &&
    isNumberRecord(state.pendingPointsByTeamId)
  );
};

/**
 * Optional on every turn action (`limb`, `endClimb`, `skipClimb`): whose turn and which climb the
 * tablet sent it for. When present and not the turn and climb in hand, the action is a straggler
 * (a duplicate `endClimb`, a batch flushed after its climb was refereed, a tablet still on the
 * last team) and is refused rather than landing on the next climber. The spec's payloads carry
 * neither; the plugin envelope carries no team, so this stamp is the only way to name one.
 */
export type MountTurnStamp = {
  teamId?: string;
  climbIndex?: number;
};

/** A payload's stamp, `{}` for a payload that names nothing, or null for a malformed one. */
export const readMountTurnStamp = (actionPayload: SerializableValue): MountTurnStamp | null => {
  if (actionPayload === null) {
    return {};
  }

  if (!isRecord(actionPayload)) {
    return null;
  }

  const { teamId, climbIndex } = actionPayload;

  if (teamId !== undefined && typeof teamId !== "string") {
    return null;
  }

  if (climbIndex !== undefined && !isNonNegativeInteger(climbIndex)) {
    return null;
  }

  return {
    ...(teamId === undefined ? {} : { teamId }),
    ...(climbIndex === undefined ? {} : { climbIndex })
  };
};

export type MountLimbPayload = MountTurnStamp & {
  samples: MountInputSample[];
};

/**
 * A batch of samples as the tablet flushed it: at least one, each well formed and on the input
 * grid, and non-decreasing in tick through the batch. Whether it follows the log is the reducer's
 * call, which knows the log.
 */
export const isMountLimbPayload = (actionPayload: SerializableValue): actionPayload is MountLimbPayload => {
  if (readMountTurnStamp(actionPayload) === null || !isRecord(actionPayload) || !Array.isArray(actionPayload.samples)) {
    return false;
  }

  const samples: unknown[] = actionPayload.samples;

  return (
    samples.length > 0 &&
    samples.every(
      (sample, index) =>
        isMountInputSample(sample) &&
        (index === 0 || sample.tick >= (samples[index - 1] as MountInputSample).tick)
    )
  );
};
