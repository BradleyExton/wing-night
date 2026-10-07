import {
  isConfigFileKey,
  MUSIC_PLAYBACK_SOURCES,
  MINIGAME_API_VERSION,
  TIMER_EXTEND_MAX_SECONDS,
  isNonNegativeInteger,
  isQuickPlayStartRequest,
  isStringArray,
  isValidMusicVolume,
  isMinigameDeviceMode,
  isMinigameType,
  isPositiveInteger,
  isSpectatorBetPick,
  type ConfigSavePayload,
  type GameSetRoundDeviceModePayload,
  type PlayerMinigameActionPayload,
  type GameReorderTurnOrderPayload,
  type HostSecretPayload,
  type MinigameActionPayload,
  type MusicSetVolumePayload,
  type SfxSetVolumePayload,
  type MusicTrackEndedPayload,
  type QuickPlayStartPayload,
  type ScoringAdjustTeamScorePayload,
  type ScoringSetWingParticipationPayload,
  type SetupAddPlayerPayload,
  type SetupAssignPlayerPayload,
  type SetupCreateTeamPayload,
  type SetupReleasePlayerClaimPayload,
  type PlayerClaimPayload,
  type PlayerPlaceBetPayload,
  type PlayerReleasePayload,
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

export const isGameSetRoundDeviceModePayload = (
  payload: unknown
): payload is GameSetRoundDeviceModePayload =>
  hasShape(payload, {
    hostSecret: isString,
    round: isPositiveInteger,
    deviceMode: isMinigameDeviceMode
  });

// The phone's envelope: the host's minus the secret. A PLAYER socket is authorized by the face
// it holds; the mutation decides whether that face may send this action now.
export const isPlayerMinigameActionPayload = (
  payload: unknown
): payload is PlayerMinigameActionPayload =>
  hasShape(payload, {
    minigameId: isMinigameType,
    minigameApiVersion: (value) => value === MINIGAME_API_VERSION,
    actionType: isString,
    actionPayload: isPresent
  });

export const isMinigameActionEnvelope = (
  payload: unknown
): payload is MinigameActionPayload =>
  hasShape(payload, {
    hostSecret: isString,
    minigameId: isMinigameType,
    minigameApiVersion: (value) => value === MINIGAME_API_VERSION,
    actionType: isString,
    actionPayload: isPresent
  });

// Only the envelope is checked here — each file's `value` stays `unknown` on
// purpose, because the shared content validators own that judgement and their
// `ValidationIssue[]` is what the wizard maps back to its fields. A guard that
// rejected the payload wholesale would collapse those issues into silence.
const isConfigFileEdit = (value: unknown): boolean =>
  hasShape(value, { key: (key) => isConfigFileKey(key), value: isPresent });

export const isConfigSavePayload = (
  payload: unknown
): payload is ConfigSavePayload =>
  hasShape(payload, {
    hostSecret: isString,
    files: (value) => Array.isArray(value) && value.every(isConfigFileEdit)
  });

// The one guard here with no `hostSecret` to check, because the display sends
// it. `trackIndex` is bounded only by being a non-negative integer: the
// mutation is what decides whether it names the track actually playing, and a
// report that does not is a no-op rather than an error.
export const isMusicTrackEndedPayload = (
  payload: unknown
): payload is MusicTrackEndedPayload =>
  hasShape(payload, {
    source: (value) =>
      value === MUSIC_PLAYBACK_SOURCES.LOBBY ||
      value === MUSIC_PLAYBACK_SOURCES.EATING ||
      value === MUSIC_PLAYBACK_SOURCES.ANTHEM,
    trackIndex: isNonNegativeInteger
  });

export const isMusicSetVolumePayload = (
  payload: unknown
): payload is MusicSetVolumePayload =>
  hasShape(payload, { hostSecret: isString, volume: isValidMusicVolume });

export const isSfxSetVolumePayload = (
  payload: unknown
): payload is SfxSetVolumePayload =>
  hasShape(payload, { hostSecret: isString, volume: isValidMusicVolume });

export const isTimerExtendPayload = (payload: unknown): payload is TimerExtendPayload =>
  hasShape(payload, {
    hostSecret: isString,
    additionalSeconds: (value) =>
      typeof value === "number" &&
      Number.isInteger(value) &&
      value > 0 &&
      value <= TIMER_EXTEND_MAX_SECONDS
  });

// The envelope is the shared request guard plus the secret: the launcher runs
// the same `isQuickPlayStartRequest` before it emits, so a payload this
// rejects is one the launcher never built.
export const isQuickPlayStartPayload = (
  payload: unknown
): payload is QuickPlayStartPayload =>
  hasShape(payload, { hostSecret: isString }) && isQuickPlayStartRequest(payload);

export const isSetupReleasePlayerClaimPayload = (
  payload: unknown
): payload is SetupReleasePlayerClaimPayload =>
  hasShape(payload, { hostSecret: isString, playerId: isString });

// `claimSecret` is optional — a phone claiming its first face has none — but a
// claim that sends one must send a string.
export const isPlayerClaimPayload = (payload: unknown): payload is PlayerClaimPayload =>
  hasShape(payload, { playerId: isString }) &&
  (!("claimSecret" in (payload as Record<string, unknown>)) ||
    isString((payload as Record<string, unknown>).claimSecret));

export const isPlayerReleasePayload = (payload: unknown): payload is PlayerReleasePayload =>
  hasShape(payload, { claimSecret: isString });

// A watcher's bet names a side and nothing else: whose bet it is comes from the face the socket
// holds, never from the payload.
export const isPlayerPlaceBetPayload = (payload: unknown): payload is PlayerPlaceBetPayload =>
  hasShape(payload, { pick: isSpectatorBetPick });
