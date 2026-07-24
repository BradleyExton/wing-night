import {
  CLIENT_TO_SERVER_EVENTS,
  MINIGAME_API_VERSION,
  SERVER_TO_CLIENT_EVENTS
} from "@wingnight/shared";
import type {
  ClientToServerEvents,
  HostSecretPayload,
  RoleScopedStateSnapshotEnvelope,
  RoomState
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import {
  addPlayer,
  adjustTeamScore,
  advanceRoomStatePhase,
  assignPlayerToTeam,
  autoAssignRemainingPlayers,
  createTeam,
  dispatchMinigameAction,
  extendRoomTimer,
  getRoomStateSnapshot,
  pauseRoomTimer,
  redoLastScoringMutation,
  reorderTurnOrder,
  resetGameToSetup,
  resumeRoomTimer,
  setWingParticipation,
  skipTurnBoundary
} from "../../roomState/index.js";
import {
  isGameReorderTurnOrderPayload,
  isHostSecretPayload,
  isMinigameActionEnvelope,
  isScoringAdjustTeamScorePayload,
  isScoringSetWingParticipationPayload,
  isSetupAddPlayerPayload,
  isSetupAssignPlayerPayload,
  isSetupCreateTeamPayload,
  isTimerExtendPayload
} from "./payloadGuards/index.js";

type RoomStateSocket = {
  emit: {
    (
      event: typeof SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT,
      roomState: RoleScopedStateSnapshotEnvelope
    ): void;
    (event: typeof SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED, payload: HostSecretPayload): void;
    (event: typeof SERVER_TO_CLIENT_EVENTS.SECRET_INVALID): void;
  };
  on: {
    (event: typeof CLIENT_TO_SERVER_EVENTS.REQUEST_STATE, listener: () => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL, listener: () => void): void;
    (event: Exclude<ClientEventName, typeof CLIENT_TO_SERVER_EVENTS.REQUEST_STATE | typeof CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL>, listener: (payload: unknown) => void): void;
  };
};

type HostAuth = {
  issueHostSecret: () => HostSecretPayload;
  isValidHostSecret: (hostSecret: string) => boolean;
};

type ClientEventName =
  (typeof CLIENT_TO_SERVER_EVENTS)[keyof typeof CLIENT_TO_SERVER_EVENTS];

export type AuthorizedEventName = Exclude<
  ClientEventName,
  typeof CLIENT_TO_SERVER_EVENTS.REQUEST_STATE | typeof CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL
>;

export type AuthorizedEventPayloadByName = {
  [TEvent in AuthorizedEventName]: Parameters<ClientToServerEvents[TEvent]>[0];
};

// Invoked once a payload has passed its shape guard and host authorization.
// Production wraps `runMutation` in broadcast-after logic; test harnesses can
// observe `event` and `payload` instead.
export type AuthorizedMutationDispatch = <TEvent extends AuthorizedEventName>(
  event: TEvent,
  payload: AuthorizedEventPayloadByName[TEvent],
  runMutation: () => RoomState
) => void;

type AuthorizedEventContext = {
  isValidHostSecret: (hostSecret: string) => boolean;
  emitSecretInvalid: () => void;
  dispatchAuthorizedMutation: AuthorizedMutationDispatch;
};

type AuthorizedEventRegistration = {
  event: AuthorizedEventName;
  createListener: (context: AuthorizedEventContext) => (payload: unknown) => void;
};

const defineAuthorizedEvent = <TEvent extends AuthorizedEventName>(
  event: TEvent,
  isPayload: (payload: unknown) => payload is AuthorizedEventPayloadByName[TEvent],
  runMutation: (payload: AuthorizedEventPayloadByName[TEvent]) => RoomState
): AuthorizedEventRegistration => {
  return {
    event,
    createListener: (context) => (payload) => {
      if (!isPayload(payload)) {
        return;
      }

      if (!context.isValidHostSecret(payload.hostSecret)) {
        context.emitSecretInvalid();
        return;
      }

      context.dispatchAuthorizedMutation(event, payload, () => runMutation(payload));
    }
  };
};

const AUTHORIZED_EVENTS: AuthorizedEventRegistration[] = [
  defineAuthorizedEvent(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, isHostSecretPayload, () =>
    advanceRoomStatePhase()
  ),
  defineAuthorizedEvent(CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY, isHostSecretPayload, () =>
    skipTurnBoundary()
  ),
  defineAuthorizedEvent(
    CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER,
    isGameReorderTurnOrderPayload,
    (payload) => reorderTurnOrder(payload.teamIds)
  ),
  defineAuthorizedEvent(CLIENT_TO_SERVER_EVENTS.RESET, isHostSecretPayload, () =>
    resetGameToSetup()
  ),
  defineAuthorizedEvent(CLIENT_TO_SERVER_EVENTS.CREATE_TEAM, isSetupCreateTeamPayload, (payload) =>
    createTeam(payload.name)
  ),
  defineAuthorizedEvent(CLIENT_TO_SERVER_EVENTS.ADD_PLAYER, isSetupAddPlayerPayload, (payload) =>
    addPlayer(payload.name)
  ),
  defineAuthorizedEvent(
    CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER,
    isSetupAssignPlayerPayload,
    (payload) => assignPlayerToTeam(payload.playerId, payload.teamId)
  ),
  defineAuthorizedEvent(
    CLIENT_TO_SERVER_EVENTS.AUTO_ASSIGN_REMAINING_PLAYERS,
    isHostSecretPayload,
    () => autoAssignRemainingPlayers()
  ),
  defineAuthorizedEvent(
    CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION,
    isScoringSetWingParticipationPayload,
    (payload) => setWingParticipation(payload.playerId, payload.didEat)
  ),
  defineAuthorizedEvent(
    CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE,
    isScoringAdjustTeamScorePayload,
    (payload) => adjustTeamScore(payload.teamId, payload.delta)
  ),
  defineAuthorizedEvent(CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION, isHostSecretPayload, () =>
    redoLastScoringMutation()
  ),
  defineAuthorizedEvent(
    CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION,
    isMinigameActionEnvelope,
    (payload) => {
      if (payload.minigameApiVersion !== MINIGAME_API_VERSION) {
        return getRoomStateSnapshot();
      }

      const currentSnapshot = getRoomStateSnapshot();

      if (currentSnapshot.currentRoundConfig?.minigame !== payload.minigameId) {
        return currentSnapshot;
      }

      return dispatchMinigameAction(
        payload.minigameId,
        payload.actionType,
        payload.actionPayload as SerializableValue
      );
    }
  ),
  defineAuthorizedEvent(CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE, isHostSecretPayload, () =>
    pauseRoomTimer()
  ),
  defineAuthorizedEvent(CLIENT_TO_SERVER_EVENTS.TIMER_RESUME, isHostSecretPayload, () =>
    resumeRoomTimer()
  ),
  defineAuthorizedEvent(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND, isTimerExtendPayload, (payload) =>
    extendRoomTimer(payload.additionalSeconds)
  )
];

export const registerRoomStateHandlers = (
  socket: RoomStateSocket,
  getSnapshot: () => RoleScopedStateSnapshotEnvelope,
  dispatchAuthorizedMutation: AuthorizedMutationDispatch,
  canClaimControl: boolean,
  hostAuth: HostAuth
): void => {
  const emitSnapshot = (): void => {
    socket.emit(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, getSnapshot());
  };

  const emitSecretInvalid = (): void => {
    if (!canClaimControl) {
      return;
    }

    socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
  };

  const handleHostClaim = (): void => {
    if (!canClaimControl) {
      return;
    }

    socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED, hostAuth.issueHostSecret());
  };

  emitSnapshot();

  socket.on(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE, emitSnapshot);
  socket.on(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL, handleHostClaim);

  const authorizedEventContext: AuthorizedEventContext = {
    isValidHostSecret: hostAuth.isValidHostSecret,
    emitSecretInvalid,
    dispatchAuthorizedMutation
  };

  for (const authorizedEvent of AUTHORIZED_EVENTS) {
    socket.on(authorizedEvent.event, authorizedEvent.createListener(authorizedEventContext));
  }
};
