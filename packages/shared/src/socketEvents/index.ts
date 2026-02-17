import type { RoomState } from "../roomState/index.js";

export type HostSecretPayload = Record<"hostSecret", string>;
export type SetupCreateTeamPayload = HostSecretPayload & Record<"name", string>;
export type SetupAssignPlayerPayload = HostSecretPayload &
  Record<"playerId", string> &
  Record<"teamId", string | null>;
export type ScoringSetWingParticipationPayload = HostSecretPayload &
  Record<"playerId", string> &
  Record<"didEat", boolean>;
export type MinigameRecordTriviaAttemptPayload = HostSecretPayload &
  Record<"isCorrect", boolean>;
export type MinigameTogglePassAndPlayLockPayload = HostSecretPayload;

export const CLIENT_TO_SERVER_EVENTS = {
  REQUEST_STATE: "client:requestState",
  CLAIM_CONTROL: "host:claimControl",
  NEXT_PHASE: "game:nextPhase",
  CREATE_TEAM: "setup:createTeam",
  ASSIGN_PLAYER: "setup:assignPlayer",
  SET_WING_PARTICIPATION: "scoring:setWingParticipation",
  RECORD_TRIVIA_ATTEMPT: "minigame:recordTriviaAttempt",
  TOGGLE_PASS_AND_PLAY_LOCK: "minigame:togglePassAndPlayLock"
} as const;

export const SERVER_TO_CLIENT_EVENTS = {
  STATE_SNAPSHOT: "server:stateSnapshot",
  SECRET_ISSUED: "host:secretIssued",
  SECRET_INVALID: "host:secretInvalid"
} as const;

export type ClientToServerEventName =
  (typeof CLIENT_TO_SERVER_EVENTS)[keyof typeof CLIENT_TO_SERVER_EVENTS];

export type ServerToClientEventName =
  (typeof SERVER_TO_CLIENT_EVENTS)[keyof typeof SERVER_TO_CLIENT_EVENTS];

export type ClientToServerEvents = {
  [CLIENT_TO_SERVER_EVENTS.REQUEST_STATE]: () => void;
  [CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL]: () => void;
  [CLIENT_TO_SERVER_EVENTS.NEXT_PHASE]: (payload: HostSecretPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.CREATE_TEAM]: (
    payload: SetupCreateTeamPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER]: (
    payload: SetupAssignPlayerPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION]: (
    payload: ScoringSetWingParticipationPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.RECORD_TRIVIA_ATTEMPT]: (
    payload: MinigameRecordTriviaAttemptPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.TOGGLE_PASS_AND_PLAY_LOCK]: (
    payload: MinigameTogglePassAndPlayLockPayload
  ) => void;
};

export type ServerToClientEvents = {
  [SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT]: (roomState: RoomState) => void;
  [SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED]: (payload: HostSecretPayload) => void;
  [SERVER_TO_CLIENT_EVENTS.SECRET_INVALID]: () => void;
};
