import type {
  ClientToServerEvents,
  HostSecretPayload,
  RoomState,
  ServerToClientEvents
} from "../index.js";

type Assert<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? true
    : false;

export type RequestStateNoArgsCheck = Assert<
  Equal<Parameters<ClientToServerEvents["client:requestState"]>, []>
>;

export type ClaimControlNoArgsCheck = Assert<
  Equal<Parameters<ClientToServerEvents["host:claimControl"]>, []>
>;

export type NextPhaseHostSecretPayloadCheck = Assert<
  Equal<Parameters<ClientToServerEvents["game:nextPhase"]>, [HostSecretPayload]>
>;

export type SnapshotRoomStateArgCheck = Assert<
  Equal<Parameters<ServerToClientEvents["server:stateSnapshot"]>, [RoomState]>
>;

export type SecretIssuedHostSecretPayloadCheck = Assert<
  Equal<Parameters<ServerToClientEvents["host:secretIssued"]>, [HostSecretPayload]>
>;

// @ts-expect-error server:stateSnapshot must accept RoomState.
export type InvalidSnapshotPayloadCheck = Assert<Equal<Parameters<ServerToClientEvents["server:stateSnapshot"]>, [string]>>;

// @ts-expect-error client:requestState should not accept arguments.
export type InvalidRequestStateArgsCheck = Assert<Equal<Parameters<ClientToServerEvents["client:requestState"]>, [number]>>;

// @ts-expect-error host:claimControl should not accept arguments.
export type InvalidClaimControlArgsCheck = Assert<Equal<Parameters<ClientToServerEvents["host:claimControl"]>, [number]>>;

// @ts-expect-error game:nextPhase must accept host secret payload.
export type InvalidNextPhaseNoPayloadCheck = Assert<Equal<Parameters<ClientToServerEvents["game:nextPhase"]>, []>>;

// @ts-expect-error host:secretIssued must emit host secret payload.
export type InvalidSecretIssuedPayloadCheck = Assert<Equal<Parameters<ServerToClientEvents["host:secretIssued"]>, [string]>>;
