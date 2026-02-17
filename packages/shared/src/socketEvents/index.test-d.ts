import type {
  CLIENT_TO_SERVER_EVENTS,
  ClientToServerEvents,
  HostSecretPayload,
  RoomState,
  SERVER_TO_CLIENT_EVENTS,
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

export type SnapshotRoomStateArgCheck = Assert<
  Equal<
    Parameters<ServerToClientEvents[typeof SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT]>,
    [RoomState]
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

// @ts-expect-error server:stateSnapshot must accept RoomState.
export type InvalidSnapshotPayloadCheck = Assert<Equal<Parameters<ServerToClientEvents[typeof SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT]>, [string]>>;

// @ts-expect-error client:requestState should not accept arguments.
export type InvalidRequestStateArgsCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.REQUEST_STATE]>, [number]>>;

// @ts-expect-error host:claimControl should not accept arguments.
export type InvalidClaimControlArgsCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL]>, [number]>>;

// @ts-expect-error game:nextPhase must accept host secret payload.
export type InvalidNextPhaseNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.NEXT_PHASE]>, []>>;

// @ts-expect-error setup:createTeam must accept host secret + name payload.
export type InvalidCreateTeamNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.CREATE_TEAM]>, []>>;

// @ts-expect-error setup:assignPlayer must accept host secret + player assignment payload.
export type InvalidAssignPlayerNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents[typeof CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER]>, []>>;

// @ts-expect-error host:secretIssued must emit host secret payload.
export type InvalidSecretIssuedPayloadCheck = Assert<Equal<Parameters<ServerToClientEvents[typeof SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED]>, [string]>>;

// @ts-expect-error host:secretInvalid should not accept arguments.
export type InvalidSecretInvalidPayloadCheck = Assert<Equal<Parameters<ServerToClientEvents[typeof SERVER_TO_CLIENT_EVENTS.SECRET_INVALID]>, [string]>>;
