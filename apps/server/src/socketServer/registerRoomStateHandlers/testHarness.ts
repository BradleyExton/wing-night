import assert from "node:assert/strict";

import {
  CLIENT_TO_SERVER_EVENTS,
  CLIENT_ROLES,
  Phase,
  SERVER_TO_CLIENT_EVENTS,
  type ConfigResultPayload,
  type HostSecretPayload,
  type RoleScopedStateSnapshotEnvelope,
  type RoomState
} from "@wingnight/shared";

import {
  applyRoomStateMutation,
  type RoomStateMutationResult
} from "../../roomState/index.js";
import type { ConfigService } from "../../configService/index.js";
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
  emittedConfigResults: ConfigResultPayload[];
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
  const emittedConfigResults: ConfigResultPayload[] = [];
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
        | typeof SERVER_TO_CLIENT_EVENTS.SECRET_INVALID
        | typeof SERVER_TO_CLIENT_EVENTS.CONFIG_RESULT,
      payload:
        | RoleScopedStateSnapshotEnvelope
        | HostSecretPayload
        | ConfigResultPayload
    ): void => {
      if (event === SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT) {
        emittedSnapshots.push(payload as RoleScopedStateSnapshotEnvelope);
        return;
      }

      if (event === SERVER_TO_CLIENT_EVENTS.SECRET_INVALID) {
        invalidSecretEvents.count += 1;
        return;
      }

      if (event === SERVER_TO_CLIENT_EVENTS.CONFIG_RESULT) {
        emittedConfigResults.push(payload as ConfigResultPayload);
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
    emittedConfigResults,
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

// The production dispatch, minus the socket. `socketServer`'s `broadcastAfter`
// is exactly `applyRoomStateMutation(runMutation)` followed by a broadcast iff
// `didMutate` — so running the thunk through the real `applyRoomStateMutation`
// and recording its result puts a test one line away from the broadcast, and
// `didMutate === true` is what decides whether that line is reached.
export const createRealMutationDispatch = (
  observedMutations: RoomStateMutationResult[]
): AuthorizedMutationDispatch => {
  return (_event, _payload, runMutation) => {
    observedMutations.push(applyRoomStateMutation(runMutation));
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
  dispatch?: AuthorizedMutationDispatch;
  configService?: ConfigService;
};

export const setupHandlers = (options: SetupHandlersOptions = {}): SocketHarness => {
  const socketHarness = createSocketHarness();

  registerRoomStateHandlers(
    socketHarness.socket,
    options.getSnapshot ??
      ((): RoleScopedStateSnapshotEnvelope =>
        toHostSnapshotEnvelope(buildRoomState(options.phase ?? Phase.SETUP))),
    options.dispatch ?? createAuthorizedMutationDispatch(options.overrides ?? {}),
    options.canClaimControl ?? true,
    options.hostAuth ?? hostAuth,
    // Only the config:* tests pass one. Everything else registers handlers it
    // never triggers, so the production service is never asked to touch disk.
    options.configService
  );

  return socketHarness;
};
