import {
  MINIGAME_API_VERSION,
  TIMER_EXTEND_MAX_SECONDS,
  type GameReorderTurnOrderPayload,
  type HostSecretPayload,
  type MinigameActionEnvelope,
  type ScoringAdjustTeamScorePayload,
  type ScoringSetWingParticipationPayload,
  type SetupAssignPlayerPayload,
  type SetupCreateTeamPayload,
  type TimerExtendPayload
} from "@wingnight/shared";

export const isHostSecretPayload = (payload: unknown): payload is HostSecretPayload => {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  if (!("hostSecret" in payload)) {
    return false;
  }

  return typeof payload.hostSecret === "string";
};

export const isSetupCreateTeamPayload = (
  payload: unknown
): payload is SetupCreateTeamPayload => {
  if (!isHostSecretPayload(payload)) {
    return false;
  }

  return "name" in payload && typeof payload.name === "string";
};

export const isGameReorderTurnOrderPayload = (
  payload: unknown
): payload is GameReorderTurnOrderPayload => {
  if (!isHostSecretPayload(payload)) {
    return false;
  }

  if (!("teamIds" in payload) || !Array.isArray(payload.teamIds)) {
    return false;
  }

  return payload.teamIds.every((teamId) => typeof teamId === "string");
};

export const isSetupAssignPlayerPayload = (
  payload: unknown
): payload is SetupAssignPlayerPayload => {
  if (!isHostSecretPayload(payload)) {
    return false;
  }

  if (!("playerId" in payload) || typeof payload.playerId !== "string") {
    return false;
  }

  if (!("teamId" in payload)) {
    return false;
  }

  return payload.teamId === null || typeof payload.teamId === "string";
};

export const isScoringSetWingParticipationPayload = (
  payload: unknown
): payload is ScoringSetWingParticipationPayload => {
  if (!isHostSecretPayload(payload)) {
    return false;
  }

  if (!("playerId" in payload) || typeof payload.playerId !== "string") {
    return false;
  }

  if (!("didEat" in payload) || typeof payload.didEat !== "boolean") {
    return false;
  }

  return true;
};

export const isScoringAdjustTeamScorePayload = (
  payload: unknown
): payload is ScoringAdjustTeamScorePayload => {
  if (!isHostSecretPayload(payload)) {
    return false;
  }

  if (!("teamId" in payload) || typeof payload.teamId !== "string") {
    return false;
  }

  if (!("delta" in payload) || typeof payload.delta !== "number") {
    return false;
  }

  return Number.isInteger(payload.delta) && payload.delta !== 0;
};

export const isMinigameActionEnvelope = (
  payload: unknown
): payload is MinigameActionEnvelope => {
  if (!isHostSecretPayload(payload)) {
    return false;
  }

  if (!("minigameId" in payload) || typeof payload.minigameId !== "string") {
    return false;
  }

  if (
    !("minigameApiVersion" in payload) ||
    payload.minigameApiVersion !== MINIGAME_API_VERSION
  ) {
    return false;
  }

  if (!("actionType" in payload) || typeof payload.actionType !== "string") {
    return false;
  }

  return "actionPayload" in payload;
};

export const isTimerExtendPayload = (payload: unknown): payload is TimerExtendPayload => {
  if (!isHostSecretPayload(payload)) {
    return false;
  }

  if (
    !("additionalSeconds" in payload) ||
    typeof payload.additionalSeconds !== "number" ||
    !Number.isInteger(payload.additionalSeconds)
  ) {
    return false;
  }

  return (
    payload.additionalSeconds > 0 &&
    payload.additionalSeconds <= TIMER_EXTEND_MAX_SECONDS
  );
};
