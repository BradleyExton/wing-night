import type { MinigameType } from "../content/gameConfig/index.js";
import type { RoleScopedStateSnapshotEnvelope } from "../roomState/index.js";

export type HostSecretPayload = Record<"hostSecret", string>;
export type GameReorderTurnOrderPayload = HostSecretPayload &
  Record<"teamIds", string[]>;
export type SetupCreateTeamPayload = HostSecretPayload & Record<"name", string>;
export type SetupAssignPlayerPayload = HostSecretPayload &
  Record<"playerId", string> &
  Record<"teamId", string | null>;
export type ScoringSetWingParticipationPayload = HostSecretPayload &
  Record<"playerId", string> &
  Record<"didEat", boolean>;
export type ScoringAdjustTeamScorePayload = HostSecretPayload &
  Record<"teamId", string> &
  Record<"delta", number>;
export type MinigameActionEnvelopePayload = HostSecretPayload &
  Record<"minigameId", MinigameType> &
  Record<"minigameApiVersion", number> &
  Record<"capabilityFlags", string[]> &
  Record<"actionType", string> &
  Record<"actionPayload", unknown>;
export type TimerExtendPayload = HostSecretPayload &
  Record<"additionalSeconds", number>;
export const TIMER_EXTEND_MAX_SECONDS = 600;

export const CLIENT_TO_SERVER_EVENTS = {
  REQUEST_STATE: "client:requestState",
  CLAIM_CONTROL: "host:claimControl",
  NEXT_PHASE: "game:nextPhase",
  SKIP_TURN_BOUNDARY: "game:skipTurnBoundary",
  REORDER_TURN_ORDER: "game:reorderTurnOrder",
  RESET: "game:reset",
  CREATE_TEAM: "setup:createTeam",
  ASSIGN_PLAYER: "setup:assignPlayer",
  SET_WING_PARTICIPATION: "scoring:setWingParticipation",
  ADJUST_TEAM_SCORE: "scoring:adjustTeamScore",
  REDO_LAST_MUTATION: "scoring:redoLastMutation",
  MINIGAME_ACTION: "minigame:action",
  TIMER_PAUSE: "timer:pause",
  TIMER_RESUME: "timer:resume",
  TIMER_EXTEND: "timer:extend"
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
  [CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY]: (
    payload: HostSecretPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER]: (
    payload: GameReorderTurnOrderPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.RESET]: (payload: HostSecretPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.CREATE_TEAM]: (
    payload: SetupCreateTeamPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER]: (
    payload: SetupAssignPlayerPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION]: (
    payload: ScoringSetWingParticipationPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE]: (
    payload: ScoringAdjustTeamScorePayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION]: (
    payload: HostSecretPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION]: (
    payload: MinigameActionEnvelopePayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE]: (payload: HostSecretPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.TIMER_RESUME]: (payload: HostSecretPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND]: (payload: TimerExtendPayload) => void;
};

export type ServerToClientEvents = {
  [SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT]: (
    payload: RoleScopedStateSnapshotEnvelope
  ) => void;
  [SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED]: (payload: HostSecretPayload) => void;
  [SERVER_TO_CLIENT_EVENTS.SECRET_INVALID]: () => void;
};
