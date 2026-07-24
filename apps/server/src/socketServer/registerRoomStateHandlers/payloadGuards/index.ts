import {
  MINIGAME_API_VERSION,
  TIMER_EXTEND_MAX_SECONDS,
  type GameReorderTurnOrderPayload,
  type HostSecretPayload,
  type MinigameActionEnvelope,
  type ScoringAdjustTeamScorePayload,
  type ScoringSetWingParticipationPayload,
  type SetupAddPlayerPayload,
  type SetupAssignPlayerPayload,
  type SetupCreateTeamPayload,
  type TimerExtendPayload
} from "@wingnight/shared";

type FieldPredicate = (value: unknown) => boolean;

const hasShape = (
  payload: unknown,
  shape: Record<string, FieldPredicate>
): boolean => {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const record = payload as Record<string, unknown>;

  return Object.entries(shape).every(
    ([key, isValidField]) => key in record && isValidField(record[key])
  );
};

const isString: FieldPredicate = (value) => typeof value === "string";
const isBoolean: FieldPredicate = (value) => typeof value === "boolean";
const isPresent: FieldPredicate = () => true;
const isStringArray: FieldPredicate = (value) =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

export const isHostSecretPayload = (payload: unknown): payload is HostSecretPayload =>
  hasShape(payload, { hostSecret: isString });

export const isSetupCreateTeamPayload = (
  payload: unknown
): payload is SetupCreateTeamPayload =>
  hasShape(payload, { hostSecret: isString, name: isString });

export const isSetupAddPlayerPayload = (
  payload: unknown
): payload is SetupAddPlayerPayload =>
  hasShape(payload, { hostSecret: isString, name: isString });

export const isGameReorderTurnOrderPayload = (
  payload: unknown
): payload is GameReorderTurnOrderPayload =>
  hasShape(payload, { hostSecret: isString, teamIds: isStringArray });

export const isSetupAssignPlayerPayload = (
  payload: unknown
): payload is SetupAssignPlayerPayload =>
  hasShape(payload, {
    hostSecret: isString,
    playerId: isString,
    teamId: (value) => value === null || typeof value === "string"
  });

export const isScoringSetWingParticipationPayload = (
  payload: unknown
): payload is ScoringSetWingParticipationPayload =>
  hasShape(payload, {
    hostSecret: isString,
    playerId: isString,
    didEat: isBoolean
  });

export const isScoringAdjustTeamScorePayload = (
  payload: unknown
): payload is ScoringAdjustTeamScorePayload =>
  hasShape(payload, {
    hostSecret: isString,
    teamId: isString,
    delta: (value) =>
      typeof value === "number" && Number.isInteger(value) && value !== 0
  });

export const isMinigameActionEnvelope = (
  payload: unknown
): payload is MinigameActionEnvelope =>
  hasShape(payload, {
    hostSecret: isString,
    minigameId: isString,
    minigameApiVersion: (value) => value === MINIGAME_API_VERSION,
    actionType: isString,
    actionPayload: isPresent
  });

export const isTimerExtendPayload = (payload: unknown): payload is TimerExtendPayload =>
  hasShape(payload, {
    hostSecret: isString,
    additionalSeconds: (value) =>
      typeof value === "number" &&
      Number.isInteger(value) &&
      value > 0 &&
      value <= TIMER_EXTEND_MAX_SECONDS
  });
