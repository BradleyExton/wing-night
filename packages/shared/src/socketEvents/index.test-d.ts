import type {
  ClientToServerEvents,
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

export type NextPhaseNoArgsCheck = Assert<
  Equal<Parameters<ClientToServerEvents["game:nextPhase"]>, []>
>;

export type SnapshotRoomStateArgCheck = Assert<
  Equal<Parameters<ServerToClientEvents["server:stateSnapshot"]>, [RoomState]>
>;

// @ts-expect-error server:stateSnapshot must accept RoomState.
export type InvalidSnapshotPayloadCheck = Assert<Equal<Parameters<ServerToClientEvents["server:stateSnapshot"]>, [string]>>;

// @ts-expect-error client:requestState should not accept arguments.
export type InvalidRequestStateArgsCheck = Assert<Equal<Parameters<ClientToServerEvents["client:requestState"]>, [number]>>;

// @ts-expect-error game:nextPhase should not accept arguments.
export type InvalidNextPhaseArgsCheck = Assert<Equal<Parameters<ClientToServerEvents["game:nextPhase"]>, [number]>>;
