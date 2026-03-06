import assert from "node:assert/strict";

import {
  CLIENT_TO_SERVER_EVENTS,
  CLIENT_ROLES,
  SERVER_TO_CLIENT_EVENTS,
  type HostSecretPayload,
  type RoleScopedStateSnapshotEnvelope,
  type RoomState
} from "@wingnight/shared";

import { registerRoomStateHandlers } from "./index.js";

type SocketUnderTest = Parameters<typeof registerRoomStateHandlers>[0];
type MutationHandlersUnderTest = Parameters<typeof registerRoomStateHandlers>[2];

type SocketHarness = {
  socket: SocketUnderTest;
  emittedSnapshots: RoleScopedStateSnapshotEnvelope[];
  emittedSecretPayloads: HostSecretPayload[];
  invalidSecretEvents: number;
  triggerRequestState: () => void;
  triggerHostClaim: () => void;
  triggerNextPhase: (payload: unknown) => void;
  triggerSkipTurnBoundary: (payload: unknown) => void;
  triggerReorderTurnOrder: (payload: unknown) => void;
  triggerResetGame: (payload: unknown) => void;
  triggerCreateTeam: (payload: unknown) => void;
  triggerAddPlayer: (payload: unknown) => void;
  triggerAssignPlayer: (payload: unknown) => void;
  triggerAutoAssignRemainingPlayers: (payload: unknown) => void;
  triggerSetWingParticipation: (payload: unknown) => void;
  triggerAdjustTeamScore: (payload: unknown) => void;
  triggerRedoLastMutation: (payload: unknown) => void;
  triggerMinigameAction: (payload: unknown) => void;
  triggerTimerPause: (payload: unknown) => void;
  triggerTimerResume: (payload: unknown) => void;
  triggerTimerExtend: (payload: unknown) => void;
};

export const buildRoomState = (phase: RoomState["phase"], currentRound = 0): RoomState => {
  return {
    phase,
    currentRound,
    totalRounds: 3,
    players: [],
    teams: [],
    gameConfig: null,
    currentRoundConfig: null,
    turnOrderTeamIds: [],
    roundTurnCursor: -1,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: null,
    activeTurnTeamId: null,
    minigameHostView: null,
    minigameDisplayView: null,
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false,
    canAdvancePhase: true
  };
};

export const createSocketHarness = (): SocketHarness => {
  const emittedSnapshots: RoleScopedStateSnapshotEnvelope[] = [];
  const emittedSecretPayloads: HostSecretPayload[] = [];
  const invalidSecretEvents = { count: 0 };

  type ClientEventName =
    (typeof CLIENT_TO_SERVER_EVENTS)[keyof typeof CLIENT_TO_SERVER_EVENTS];
  type EventListener = (() => void) | ((payload: unknown) => void);

  const listeners = new Map<ClientEventName, EventListener>();

  const resolveListener = (event: ClientEventName): EventListener => {
    const listener = listeners.get(event);

    if (!listener) {
      assert.fail(`Expected ${event} handler to be registered.`);
    }

    return listener;
  };

  const triggerNoPayloadEvent = (
    event:
      | typeof CLIENT_TO_SERVER_EVENTS.REQUEST_STATE
      | typeof CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL
  ): void => {
    const listener = resolveListener(event) as () => void;
    listener();
  };

  const triggerPayloadEvent = (
    event: Exclude<
      ClientEventName,
      | typeof CLIENT_TO_SERVER_EVENTS.REQUEST_STATE
      | typeof CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL
    >,
    payload: unknown
  ): void => {
    const listener = resolveListener(event) as (payload: unknown) => void;
    listener(payload);
  };

  const socket = {
    emit: (
      event:
        | typeof SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT
        | typeof SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED
        | typeof SERVER_TO_CLIENT_EVENTS.SECRET_INVALID,
      payload: RoleScopedStateSnapshotEnvelope | HostSecretPayload
    ): void => {
      if (event === SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT) {
        emittedSnapshots.push(payload as RoleScopedStateSnapshotEnvelope);
        return;
      }

      if (event === SERVER_TO_CLIENT_EVENTS.SECRET_INVALID) {
        invalidSecretEvents.count += 1;
        return;
      }

      emittedSecretPayloads.push(payload as HostSecretPayload);
    },
    on: (event: ClientEventName, listener: EventListener): void => {
      listeners.set(event, listener);
    }
  } as unknown as SocketUnderTest;

  return {
    socket,
    emittedSnapshots,
    emittedSecretPayloads,
    get invalidSecretEvents(): number {
      return invalidSecretEvents.count;
    },
    triggerRequestState: (): void => {
      triggerNoPayloadEvent(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE);
    },
    triggerHostClaim: (): void => {
      triggerNoPayloadEvent(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
    },
    triggerNextPhase: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, payload);
    },
    triggerSkipTurnBoundary: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY, payload);
    },
    triggerReorderTurnOrder: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER, payload);
    },
    triggerResetGame: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.RESET, payload);
    },
    triggerCreateTeam: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.CREATE_TEAM, payload);
    },
    triggerAddPlayer: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.ADD_PLAYER, payload);
    },
    triggerAssignPlayer: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER, payload);
    },
    triggerAutoAssignRemainingPlayers: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.AUTO_ASSIGN_REMAINING_PLAYERS, payload);
    },
    triggerSetWingParticipation: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION, payload);
    },
    triggerAdjustTeamScore: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE, payload);
    },
    triggerRedoLastMutation: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION, payload);
    },
    triggerMinigameAction: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION, payload);
    },
    triggerTimerPause: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE, payload);
    },
    triggerTimerResume: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.TIMER_RESUME, payload);
    },
    triggerTimerExtend: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND, payload);
    }
  };
};

export const toHostSnapshotEnvelope = (
  roomState: RoomState
): RoleScopedStateSnapshotEnvelope => {
  return {
    clientRole: CLIENT_ROLES.HOST,
    roomState
  };
};

export const createMutationHandlers = (
  overrides: Partial<MutationHandlersUnderTest> = {}
): MutationHandlersUnderTest => {
  return {
    onAuthorizedNextPhase: () => {
      // no-op
    },
    onAuthorizedSkipTurnBoundary: () => {
      // no-op
    },
    onAuthorizedReorderTurnOrder: () => {
      // no-op
    },
    onAuthorizedResetGame: () => {
      // no-op
    },
    onAuthorizedCreateTeam: () => {
      // no-op
    },
    onAuthorizedAddPlayer: () => {
      // no-op
    },
    onAuthorizedAssignPlayer: () => {
      // no-op
    },
    onAuthorizedAutoAssignRemainingPlayers: () => {
      // no-op
    },
    onAuthorizedSetWingParticipation: () => {
      // no-op
    },
    onAuthorizedAdjustTeamScore: () => {
      // no-op
    },
    onAuthorizedRedoLastMutation: () => {
      // no-op
    },
    onAuthorizedMinigameAction: () => {
      // no-op
    },
    onAuthorizedPauseTimer: () => {
      // no-op
    },
    onAuthorizedResumeTimer: () => {
      // no-op
    },
    onAuthorizedExtendTimer: () => {
      // no-op
    },
    ...overrides
  };
};

export const hostAuth = {
  issueHostSecret: () => ({ hostSecret: "host-secret" }),
  isValidHostSecret: (hostSecret: string) => hostSecret === "valid-host-secret"
};
