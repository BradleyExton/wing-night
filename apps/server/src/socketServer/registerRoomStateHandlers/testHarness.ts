import assert from "node:assert/strict";

import {
  CLIENT_TO_SERVER_EVENTS,
  CLIENT_ROLES,
  Phase,
  SERVER_TO_CLIENT_EVENTS,
  type HostSecretPayload,
  type RoleScopedStateSnapshotEnvelope,
  type RoomState
} from "@wingnight/shared";

import { registerRoomStateHandlers } from "./index.js";
import type {
  AuthorizedEventName,
  AuthorizedEventPayloadByName,
  AuthorizedMutationDispatch
} from "./index.js";

type SocketUnderTest = Parameters<typeof registerRoomStateHandlers>[0];

type SocketHarness = {
  socket: SocketUnderTest;
  emittedSnapshots: RoleScopedStateSnapshotEnvelope[];
  emittedSecretPayloads: HostSecretPayload[];
  invalidSecretEvents: number;
  triggerRequestState: () => void;
  triggerHostClaim: () => void;
  trigger: (event: AuthorizedEventName, payload: unknown) => void;
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
      const listener = resolveListener(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE) as () => void;
      listener();
    },
    triggerHostClaim: (): void => {
      const listener = resolveListener(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL) as () => void;
      listener();
    },
    trigger: (event: AuthorizedEventName, payload: unknown): void => {
      const listener = resolveListener(event) as (payload: unknown) => void;
      listener(payload);
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

type AuthorizedEventOverrides = Partial<{
  [TEvent in AuthorizedEventName]: (
    payload: AuthorizedEventPayloadByName[TEvent]
  ) => void;
}>;

export const createAuthorizedMutationDispatch = (
  overrides: AuthorizedEventOverrides = {}
): AuthorizedMutationDispatch => {
  return (event, payload) => {
    overrides[event]?.(payload);
  };
};

export const hostAuth = {
  issueHostSecret: () => ({ hostSecret: "host-secret" }),
  isValidHostSecret: (hostSecret: string) => hostSecret === "valid-host-secret"
};

type SetupHandlersOptions = {
  phase?: RoomState["phase"];
  getSnapshot?: () => RoleScopedStateSnapshotEnvelope;
  overrides?: AuthorizedEventOverrides;
  canClaimControl?: boolean;
  hostAuth?: Parameters<typeof registerRoomStateHandlers>[4];
};

export const setupHandlers = (options: SetupHandlersOptions = {}): SocketHarness => {
  const socketHarness = createSocketHarness();

  registerRoomStateHandlers(
    socketHarness.socket,
    options.getSnapshot ??
      ((): RoleScopedStateSnapshotEnvelope =>
        toHostSnapshotEnvelope(buildRoomState(options.phase ?? Phase.SETUP))),
    createAuthorizedMutationDispatch(options.overrides ?? {}),
    options.canClaimControl ?? true,
    options.hostAuth ?? hostAuth
  );

  return socketHarness;
};
