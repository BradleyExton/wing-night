import type { RoomState } from "../roomState/index.js";

export type HostSecretPayload = Record<"hostSecret", string>;

export type ClientToServerEvents = {
  "client:requestState": () => void;
  "host:claimControl": () => void;
  "game:nextPhase": (payload: HostSecretPayload) => void;
};

export type ServerToClientEvents = {
  "server:stateSnapshot": (roomState: RoomState) => void;
  "host:secretIssued": (payload: HostSecretPayload) => void;
};
