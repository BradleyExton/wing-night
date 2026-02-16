import type { RoomState } from "../roomState/index.js";

export type HostSecretPayload = Record<"hostSecret", string>;
export type SetupCreateTeamPayload = HostSecretPayload & Record<"name", string>;
export type SetupAssignPlayerPayload = HostSecretPayload &
  Record<"playerId", string> &
  Record<"teamId", string | null>;

export type ClientToServerEvents = {
  "client:requestState": () => void;
  "host:claimControl": () => void;
  "game:nextPhase": (payload: HostSecretPayload) => void;
  "setup:createTeam": (payload: SetupCreateTeamPayload) => void;
  "setup:assignPlayer": (payload: SetupAssignPlayerPayload) => void;
};

export type ServerToClientEvents = {
  "server:stateSnapshot": (roomState: RoomState) => void;
  "host:secretIssued": (payload: HostSecretPayload) => void;
  "host:secretInvalid": () => void;
};
