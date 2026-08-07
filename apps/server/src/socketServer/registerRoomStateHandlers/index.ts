import {
  CLIENT_TO_SERVER_EVENTS,
  CONFIG_ACTIONS,
  CONFIG_ERROR_CODES,
  MINIGAME_API_VERSION,
  Phase,
  SERVER_TO_CLIENT_EVENTS
} from "@wingnight/shared";
import type {
  ClientToServerEvents,
  ConfigResultPayload,
  ConfigSavePayload,
  HostSecretPayload,
  RoleScopedStateSnapshotEnvelope,
  RoomState
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { createConfigService, type ConfigService } from "../../configService/index.js";

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
  isConfigSavePayload,
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
    (
      event: typeof SERVER_TO_CLIENT_EVENTS.CONFIG_RESULT,
      payload: ConfigResultPayload
    ): void;
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

type ConfigEventContext = {
  isValidHostSecret: (hostSecret: string) => boolean;
  emitSecretInvalid: () => void;
  emitConfigResult: (payload: ConfigResultPayload) => void;
  dispatchAuthorizedMutation: AuthorizedMutationDispatch;
  configService: ConfigService;
};

type ConfigEventRegistration = {
  event: ConfigEventName;
  createListener: (context: ConfigEventContext) => (payload: unknown) => void;
};

type ConfigEventName =
  | typeof CLIENT_TO_SERVER_EVENTS.CONFIG_READ
  | typeof CLIENT_TO_SERVER_EVENTS.CONFIG_SAVE
  | typeof CLIENT_TO_SERVER_EVENTS.CONFIG_APPLY;

const CONFIG_ACTION_BY_EVENT = {
  [CLIENT_TO_SERVER_EVENTS.CONFIG_READ]: CONFIG_ACTIONS.READ,
  [CLIENT_TO_SERVER_EVENTS.CONFIG_SAVE]: CONFIG_ACTIONS.SAVE,
  [CLIENT_TO_SERVER_EVENTS.CONFIG_APPLY]: CONFIG_ACTIONS.APPLY
} as const;

// The config events cannot go through `defineAuthorizedEvent`: its
// `runMutation` must return `RoomState` and the dispatch discards the result,
// so there is nowhere to put a reply. These carry theirs on `config:result`.
//
// The try/catch is not defensive habit — it is load-bearing. Every content
// loader throws by design, socket.io v4 dispatches listeners inside
// `process.nextTick` with no surrounding catch, and this server installs no
// `uncaughtException` handler. Without it, a `config:read` against a broken
// local file would take the whole process down in exactly the situation the
// config surface exists to repair.
const defineConfigEvent = (
  event: ConfigEventName,
  isPayload: (payload: unknown) => payload is ConfigSavePayload,
  handle: (payload: ConfigSavePayload, context: ConfigEventContext) => void
): ConfigEventRegistration => {
  const action = CONFIG_ACTION_BY_EVENT[event];

  return {
    event,
    createListener: (context) => (payload) => {
      if (!isPayload(payload)) {
        context.emitConfigResult({
          action,
          ok: false,
          code: CONFIG_ERROR_CODES.BAD_REQUEST,
          message: "Malformed config request payload.",
          issues: []
        });
        return;
      }

      if (!context.isValidHostSecret(payload.hostSecret)) {
        context.emitSecretInvalid();
        return;
      }

      try {
        handle(payload, context);
      } catch (error) {
        context.emitConfigResult({
          action,
          ok: false,
          code: CONFIG_ERROR_CODES.LOAD_FAILED,
          message: error instanceof Error ? error.message : String(error),
          issues: []
        });
      }
    }
  };
};

const handleConfigApply = (
  payload: ConfigSavePayload,
  context: ConfigEventContext
): void => {
  // Saves stay legal past SETUP so next week's config can be prepped mid-night;
  // apply does not, because re-seeding room state mid-game would move the
  // ground under a running round. Reset Game is the escape hatch.
  if (getRoomStateSnapshot().phase !== Phase.SETUP) {
    context.emitConfigResult({
      action: CONFIG_ACTIONS.APPLY,
      ok: false,
      code: CONFIG_ERROR_CODES.LOCKED,
      message: "Config can only be applied during SETUP. Reset the game first.",
      issues: []
    });
    return;
  }

  const saveResult = context.configService.save(payload.files);

  if (!saveResult.ok) {
    context.emitConfigResult({ ...saveResult, action: CONFIG_ACTIONS.APPLY });
    return;
  }

  // The re-seed has to run INSIDE the dispatch's thunk. `applyRoomStateMutation`
  // clears its mutation flag on entry and reads it the instant the thunk
  // returns, so a reload run before or after this call would raise the flag
  // with nobody reading it — room state would change and neither host nor
  // display would hear about it. Held in an object because the compiler cannot
  // see that the callback runs synchronously.
  const applyOutcome: { result: ConfigResultPayload } = {
    result: {
      action: CONFIG_ACTIONS.APPLY,
      ok: false,
      code: CONFIG_ERROR_CODES.LOAD_FAILED,
      message: "Config reload did not run.",
      issues: []
    }
  };

  context.dispatchAuthorizedMutation(
    CLIENT_TO_SERVER_EVENTS.CONFIG_APPLY,
    payload,
    () => {
      applyOutcome.result = context.configService.reload();
      return getRoomStateSnapshot();
    }
  );

  context.emitConfigResult(applyOutcome.result);
};

const CONFIG_EVENTS: ConfigEventRegistration[] = [
  defineConfigEvent(
    CLIENT_TO_SERVER_EVENTS.CONFIG_READ,
    // Read carries no files; the save guard accepts the host-secret envelope
    // plus an absent-or-empty `files`, so it is reused rather than duplicated.
    (payload): payload is ConfigSavePayload => isHostSecretPayload(payload),
    (_payload, context) => {
      context.emitConfigResult(context.configService.read());
    }
  ),
  defineConfigEvent(
    CLIENT_TO_SERVER_EVENTS.CONFIG_SAVE,
    isConfigSavePayload,
    (payload, context) => {
      context.emitConfigResult(context.configService.save(payload.files));
    }
  ),
  defineConfigEvent(
    CLIENT_TO_SERVER_EVENTS.CONFIG_APPLY,
    isConfigSavePayload,
    handleConfigApply
  )
];

export const registerRoomStateHandlers = (
  socket: RoomStateSocket,
  getSnapshot: () => RoleScopedStateSnapshotEnvelope,
  dispatchAuthorizedMutation: AuthorizedMutationDispatch,
  canClaimControl: boolean,
  hostAuth: HostAuth,
  configService: ConfigService = createConfigService()
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

  const configEventContext: ConfigEventContext = {
    isValidHostSecret: hostAuth.isValidHostSecret,
    emitSecretInvalid,
    emitConfigResult: (payload) => {
      socket.emit(SERVER_TO_CLIENT_EVENTS.CONFIG_RESULT, payload);
    },
    dispatchAuthorizedMutation,
    configService
  };

  for (const configEvent of CONFIG_EVENTS) {
    socket.on(configEvent.event, configEvent.createListener(configEventContext));
  }
};
