import type {
  ClientToServerEvents,
  ServerToClientEvents
} from "@wingnight/shared";

export type IncomingSocketEvents = ClientToServerEvents;
export type OutgoingSocketEvents = ServerToClientEvents;
