import type {
  CLIENT_TO_SERVER_EVENTS,
  ClientToServerEvents,
  GameReorderTurnOrderPayload,
  HostSecretPayload,
  MinigameActionEnvelopePayload,
  RoomState,
  RoleScopedStateSnapshotEnvelope,
  ScoringAdjustTeamScorePayload,
  ScoringSetWingParticipationPayload,
  SERVER_TO_CLIENT_EVENTS,
  TimerExtendPayload,
  SetupAssignPlayerPayload,
  SetupCreateTeamPayload,
  ServerToClientEvents
} from "../index.js";

type Assert<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? true
    : false;

export type RequestStateNoArgsCheck = Assert<
  Equal<
    Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.REQUEST_STATE]>,
    []
  >
>;

export type ClaimControlNoArgsCheck = Assert<
  Equal<
    Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL]>,
    []
  >
>;

export type NextPhaseHostSecretPayloadCheck = Assert<
  Equal<
    Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.NEXT_PHASE]>,
    [HostSecretPayload]
  >
>;

export type SkipTurnBoundaryPayloadCheck = Assert<
  Equal<
    Parameters<
      ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY]
    >,
    [HostSecretPayload]
  >
>;

export type ReorderTurnOrderPayloadCheck = Assert<
  Equal<
    Parameters<
      ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER]
    >,
    [GameReorderTurnOrderPayload]
  >
>;

export type ResetPayloadCheck = Assert<
  Equal<
    Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.RESET]>,
    [HostSecretPayload]
  >
>;

export type CreateTeamPayloadCheck = Assert<
  Equal<
    Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.CREATE_TEAM]>,
    [SetupCreateTeamPayload]
  >
>;

export type AssignPlayerPayloadCheck = Assert<
  Equal<
    Parameters<
      ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER]
    >,
    [SetupAssignPlayerPayload]
  >
>;

export type SetWingParticipationPayloadCheck = Assert<
  Equal<
    Parameters<
      ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION]
    >,
    [ScoringSetWingParticipationPayload]
  >
>;

export type AdjustTeamScorePayloadCheck = Assert<
  Equal<
    Parameters<
      ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE]
    >,
    [ScoringAdjustTeamScorePayload]
  >
>;

export type RedoLastMutationPayloadCheck = Assert<
  Equal<
    Parameters<
      ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION]
    >,
    [HostSecretPayload]
  >
>;

export type MinigameActionPayloadCheck = Assert<
  Equal<
    Parameters<
      ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION]
    >,
    [MinigameActionEnvelopePayload]
  >
>;

export type TimerPausePayloadCheck = Assert<
  Equal<
    Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE]>,
    [HostSecretPayload]
  >
>;

export type TimerResumePayloadCheck = Assert<
  Equal<
    Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.TIMER_RESUME]>,
    [HostSecretPayload]
  >
>;

export type TimerExtendPayloadCheck = Assert<
  Equal<
    Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND]>,
    [TimerExtendPayload]
  >
>;

export type SnapshotRoomStateArgCheck = Assert<
  Equal<
    Parameters<ServerToClientEvents[typeof SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT]>,
    [RoleScopedStateSnapshotEnvelope | RoomState]
  >
>;

export type SecretIssuedHostSecretPayloadCheck = Assert<
  Equal<
    Parameters<ServerToClientEvents[typeof SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED]>,
    [HostSecretPayload]
  >
>;

export type SecretInvalidNoArgsCheck = Assert<
  Equal<
    Parameters<ServerToClientEvents[typeof SERVER_TO_CLIENT_EVENTS.SECRET_INVALID]>,
    []
  >
>;

// @ts-expect-error server:stateSnapshot must accept role-scoped snapshot envelope.
export type InvalidSnapshotPayloadCheck = Assert<Equal<Parameters<ServerToClientEvents[typeof SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT]>, [string]>>;

// @ts-expect-error client:requestState should not accept arguments.
export type InvalidRequestStateArgsCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.REQUEST_STATE]>, [number]>>;

// @ts-expect-error host:claimControl should not accept arguments.
export type InvalidClaimControlArgsCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL]>, [number]>>;

// @ts-expect-error game:nextPhase must accept host secret payload.
export type InvalidNextPhaseNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.NEXT_PHASE]>, []>>;

// @ts-expect-error game:skipTurnBoundary must accept host secret payload.
export type InvalidSkipTurnBoundaryNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY]>, []>>;

// @ts-expect-error game:reorderTurnOrder must accept host secret + teamIds payload.
export type InvalidReorderTurnOrderNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER]>, []>>;

// @ts-expect-error game:reset must accept host secret payload.
export type InvalidResetNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.RESET]>, []>>;

// @ts-expect-error setup:createTeam must accept host secret + name payload.
export type InvalidCreateTeamNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.CREATE_TEAM]>, []>>;

// @ts-expect-error setup:assignPlayer must accept host secret + player assignment payload.
export type InvalidAssignPlayerNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER]>, []>>;

// @ts-expect-error scoring:setWingParticipation must accept host secret + player participation payload.
export type InvalidSetWingParticipationNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION]>, []>>;

// @ts-expect-error scoring:adjustTeamScore must accept host secret + teamId + delta payload.
export type InvalidAdjustTeamScoreNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE]>, []>>;

// @ts-expect-error scoring:redoLastMutation must accept host secret payload.
export type InvalidRedoLastMutationNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION]>, []>>;

// @ts-expect-error minigame:action must accept minigame action envelope payload.
export type InvalidMinigameActionNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION]>, []>>;

// @ts-expect-error timer:pause must accept host secret payload.
export type InvalidTimerPauseNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE]>, []>>;

// @ts-expect-error timer:resume must accept host secret payload.
export type InvalidTimerResumeNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.TIMER_RESUME]>, []>>;

// @ts-expect-error timer:extend must accept host secret + additional seconds payload.
export type InvalidTimerExtendNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND]>, []>>;

// @ts-expect-error host:secretIssued must emit host secret payload.
export type InvalidSecretIssuedPayloadCheck = Assert<Equal<Parameters<ServerToClientEvents[typeof SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED]>, [string]>>;

// @ts-expect-error host:secretInvalid should not accept arguments.
export type InvalidSecretInvalidPayloadCheck = Assert<Equal<Parameters<ServerToClientEvents[typeof SERVER_TO_CLIENT_EVENTS.SECRET_INVALID]>, [string]>>;
