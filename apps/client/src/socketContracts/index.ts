import type {
  ClientToServerEvents,
  ServerToClientEvents
} from "@wingnight/shared";

export type OutboundSocketEvents = ClientToServerEvents;
export type InboundSocketEvents = ServerToClientEvents;
