import type { RoomState } from "../roomState/index.js";

export type ClientToServerEvents = {
  "client:requestState": () => void;
  "game:nextPhase": () => void;
};

export type ServerToClientEvents = {
  "server:stateSnapshot": (roomState: RoomState) => void;
};
