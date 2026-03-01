import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  CLIENT_ROLES,
  MINIGAME_API_VERSION,
  Phase,
  SERVER_TO_CLIENT_EVENTS,
  type HostSecretPayload,
  type MinigameActionPayload,
  type RoleScopedStateSnapshotEnvelope,
  type RoomState
} from "@wingnight/shared";

import { registerRoomStateHandlers } from "./registerRoomStateHandlers/index.js";

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
  triggerAssignPlayer: (payload: unknown) => void;
  triggerSetWingParticipation: (payload: unknown) => void;
  triggerAdjustTeamScore: (payload: unknown) => void;
  triggerRedoLastMutation: (payload: unknown) => void;
  triggerMinigameAction: (payload: unknown) => void;
  triggerTimerPause: (payload: unknown) => void;
  triggerTimerResume: (payload: unknown) => void;
  triggerTimerExtend: (payload: unknown) => void;
};

const buildRoomState = (phase: Phase, currentRound = 0): RoomState => {
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

const createSocketHarness = (): SocketHarness => {
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
    triggerAssignPlayer: (payload: unknown): void => {
      triggerPayloadEvent(CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER, payload);
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

const toHostSnapshotEnvelope = (
  roomState: RoomState
): RoleScopedStateSnapshotEnvelope => {
  return {
    clientRole: CLIENT_ROLES.HOST,
    roomState
  };
};

const createMutationHandlers = (
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
    onAuthorizedAssignPlayer: () => {
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

const hostAuth = {
  issueHostSecret: () => ({ hostSecret: "host-secret" }),
  isValidHostSecret: (hostSecret: string) => hostSecret === "valid-host-secret"
};

test("emits state snapshot immediately and on client request", () => {
  const socketHarness = createSocketHarness();
  const firstState = buildRoomState(Phase.SETUP, 0);

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(firstState),
    createMutationHandlers({
      onAuthorizedNextPhase: () => {
        assert.fail("next phase callback should not be called in this test");
      }
    }),
    true,
    hostAuth
  );

  assert.equal(socketHarness.emittedSnapshots.length, 1);
  assert.deepEqual(socketHarness.emittedSnapshots[0], toHostSnapshotEnvelope(firstState));

  socketHarness.triggerRequestState();

  assert.equal(socketHarness.emittedSnapshots.length, 2);
  assert.deepEqual(socketHarness.emittedSnapshots[1], toHostSnapshotEnvelope(firstState));
});

test("emits host secret when host claims control and socket is authorized", () => {
  const socketHarness = createSocketHarness();

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.SETUP)),
    createMutationHandlers({
      onAuthorizedNextPhase: () => {
        assert.fail("next phase callback should not be called in this test");
      }
    }),
    true,
    {
      issueHostSecret: () => ({ hostSecret: "issued-host-secret" }),
      isValidHostSecret: () => false
    }
  );

  socketHarness.triggerHostClaim();

  assert.deepEqual(socketHarness.emittedSecretPayloads, [
    { hostSecret: "issued-host-secret" }
  ]);
});

test("does not emit host secret when socket is not allowed to claim control", () => {
  const socketHarness = createSocketHarness();

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.SETUP)),
    createMutationHandlers({
      onAuthorizedNextPhase: () => {
        assert.fail("next phase callback should not be called in this test");
      }
    }),
    false,
    hostAuth
  );

  socketHarness.triggerHostClaim();

  assert.equal(socketHarness.emittedSecretPayloads.length, 0);
});

test("ignores malformed game:nextPhase payloads", () => {
  const socketHarness = createSocketHarness();
  const initialState = buildRoomState(Phase.SETUP);
  let authorizedCallCount = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(initialState),
    createMutationHandlers({
      onAuthorizedNextPhase: () => {
        authorizedCallCount += 1;
      }
    }),
    true,
    hostAuth
  );

  assert.doesNotThrow(() => {
    socketHarness.triggerNextPhase(undefined);
    socketHarness.triggerNextPhase(null);
    socketHarness.triggerNextPhase({});
    socketHarness.triggerNextPhase({ hostSecret: 1234 });
    socketHarness.triggerNextPhase("not-an-object");
  });

  assert.equal(authorizedCallCount, 0);
  assert.equal(socketHarness.emittedSnapshots.length, 1);
  assert.deepEqual(socketHarness.emittedSnapshots[0], toHostSnapshotEnvelope(initialState));
});

test("does not validate host secret for malformed game:nextPhase payloads", () => {
  const socketHarness = createSocketHarness();
  let hostSecretValidationCalls = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.SETUP)),
    createMutationHandlers(),
    true,
    {
      issueHostSecret: () => ({ hostSecret: "issued-host-secret" }),
      isValidHostSecret: () => {
        hostSecretValidationCalls += 1;
        return false;
      }
    }
  );

  socketHarness.triggerNextPhase(undefined);
  socketHarness.triggerNextPhase(null);
  socketHarness.triggerNextPhase({});
  socketHarness.triggerNextPhase({ hostSecret: 1234 });

  assert.equal(hostSecretValidationCalls, 0);
  assert.equal(socketHarness.invalidSecretEvents, 0);
});

test("ignores unauthorized game:nextPhase requests", () => {
  const socketHarness = createSocketHarness();
  const initialState = buildRoomState(Phase.SETUP);
  let authorizedCallCount = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(initialState),
    createMutationHandlers({
      onAuthorizedNextPhase: () => {
        authorizedCallCount += 1;
      }
    }),
    true,
    hostAuth
  );

  socketHarness.triggerNextPhase({ hostSecret: "invalid-host-secret" });

  assert.equal(authorizedCallCount, 0);
  assert.equal(socketHarness.invalidSecretEvents, 1);
  assert.equal(socketHarness.emittedSnapshots.length, 1);
  assert.deepEqual(socketHarness.emittedSnapshots[0], toHostSnapshotEnvelope(initialState));
});

test("does not emit invalid-secret event when client cannot claim control", () => {
  const socketHarness = createSocketHarness();
  let authorizedCallCount = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.SETUP)),
    createMutationHandlers({
      onAuthorizedNextPhase: () => {
        authorizedCallCount += 1;
      }
    }),
    false,
    hostAuth
  );

  socketHarness.triggerNextPhase({ hostSecret: "invalid-host-secret" });

  assert.equal(authorizedCallCount, 0);
  assert.equal(socketHarness.invalidSecretEvents, 0);
});

test("runs authorized next phase callback without per-socket snapshot emit", () => {
  const socketHarness = createSocketHarness();
  const initialState = buildRoomState(Phase.SETUP);
  const advancedState = buildRoomState(Phase.INTRO, 1);
  const broadcastSnapshots: RoomState[] = [];
  let authorizedCallCount = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(initialState),
    createMutationHandlers({
      onAuthorizedNextPhase: () => {
        authorizedCallCount += 1;
        broadcastSnapshots.push(advancedState);
      }
    }),
    true,
    hostAuth
  );

  socketHarness.triggerNextPhase({ hostSecret: "valid-host-secret" });

  assert.equal(authorizedCallCount, 1);
  assert.equal(socketHarness.emittedSnapshots.length, 1);
  assert.deepEqual(socketHarness.emittedSnapshots[0], toHostSnapshotEnvelope(initialState));
  assert.deepEqual(broadcastSnapshots, [advancedState]);
});

test("ignores malformed and unauthorized skip-turn-boundary payloads", () => {
  const socketHarness = createSocketHarness();
  let skipCalls = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.EATING)),
    createMutationHandlers({
      onAuthorizedSkipTurnBoundary: () => {
        skipCalls += 1;
      }
    }),
    true,
    hostAuth
  );

  assert.doesNotThrow(() => {
    socketHarness.triggerSkipTurnBoundary(undefined);
    socketHarness.triggerSkipTurnBoundary({});
    socketHarness.triggerSkipTurnBoundary({ hostSecret: "invalid-host-secret" });
    socketHarness.triggerSkipTurnBoundary({ hostSecret: "valid-host-secret" });
  });

  assert.equal(skipCalls, 1);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized reorder-turn-order payloads", () => {
  const socketHarness = createSocketHarness();
  const reorderCalls: string[][] = [];

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.ROUND_INTRO)),
    createMutationHandlers({
      onAuthorizedReorderTurnOrder: (teamIds) => {
        reorderCalls.push(teamIds);
      }
    }),
    true,
    hostAuth
  );

  assert.doesNotThrow(() => {
    socketHarness.triggerReorderTurnOrder(undefined);
    socketHarness.triggerReorderTurnOrder({});
    socketHarness.triggerReorderTurnOrder({ hostSecret: "valid-host-secret" });
    socketHarness.triggerReorderTurnOrder({
      hostSecret: "valid-host-secret",
      teamIds: "team-1"
    });
    socketHarness.triggerReorderTurnOrder({
      hostSecret: "valid-host-secret",
      teamIds: ["team-1", 3]
    });
    socketHarness.triggerReorderTurnOrder({
      hostSecret: "invalid-host-secret",
      teamIds: ["team-1", "team-2"]
    });
    socketHarness.triggerReorderTurnOrder({
      hostSecret: "valid-host-secret",
      teamIds: ["team-2", "team-1"]
    });
  });

  assert.deepEqual(reorderCalls, [["team-2", "team-1"]]);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized reset payloads", () => {
  const socketHarness = createSocketHarness();
  let resetCalls = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.ROUND_RESULTS)),
    createMutationHandlers({
      onAuthorizedResetGame: () => {
        resetCalls += 1;
      }
    }),
    true,
    hostAuth
  );

  assert.doesNotThrow(() => {
    socketHarness.triggerResetGame(undefined);
    socketHarness.triggerResetGame({});
    socketHarness.triggerResetGame({ hostSecret: "invalid-host-secret" });
    socketHarness.triggerResetGame({ hostSecret: "valid-host-secret" });
  });

  assert.equal(resetCalls, 1);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("runs authorized create-team callback and ignores unauthorized payloads", () => {
  const socketHarness = createSocketHarness();
  let createTeamCalls = 0;
  let createdTeamName = "";

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.SETUP)),
    createMutationHandlers({
      onAuthorizedCreateTeam: (name) => {
        createTeamCalls += 1;
        createdTeamName = name;
      }
    }),
    true,
    hostAuth
  );

  socketHarness.triggerCreateTeam({ hostSecret: "invalid-host-secret", name: "Team One" });
  socketHarness.triggerCreateTeam({ hostSecret: "valid-host-secret", name: "Team Two" });

  assert.equal(createTeamCalls, 1);
  assert.equal(createdTeamName, "Team Two");
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized assign-player payloads", () => {
  const socketHarness = createSocketHarness();
  const assignmentCalls: Array<{ playerId: string; teamId: string | null }> = [];

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.SETUP)),
    createMutationHandlers({
      onAuthorizedAssignPlayer: (playerId, teamId) => {
        assignmentCalls.push({ playerId, teamId });
      }
    }),
    true,
    hostAuth
  );

  assert.doesNotThrow(() => {
    socketHarness.triggerAssignPlayer(undefined);
    socketHarness.triggerAssignPlayer({});
    socketHarness.triggerAssignPlayer({ hostSecret: "valid-host-secret" });
    socketHarness.triggerAssignPlayer({
      hostSecret: "valid-host-secret",
      playerId: 10,
      teamId: "team-1"
    });
    socketHarness.triggerAssignPlayer({
      hostSecret: "invalid-host-secret",
      playerId: "player-1",
      teamId: "team-1"
    });
    socketHarness.triggerAssignPlayer({
      hostSecret: "valid-host-secret",
      playerId: "player-1",
      teamId: null
    });
  });

  assert.deepEqual(assignmentCalls, [{ playerId: "player-1", teamId: null }]);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized wing-participation payloads", () => {
  const socketHarness = createSocketHarness();
  const participationCalls: Array<{ playerId: string; didEat: boolean }> = [];

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.SETUP)),
    createMutationHandlers({
      onAuthorizedSetWingParticipation: (playerId, didEat) => {
        participationCalls.push({ playerId, didEat });
      }
    }),
    true,
    hostAuth
  );

  assert.doesNotThrow(() => {
    socketHarness.triggerSetWingParticipation(undefined);
    socketHarness.triggerSetWingParticipation({});
    socketHarness.triggerSetWingParticipation({ hostSecret: "valid-host-secret" });
    socketHarness.triggerSetWingParticipation({
      hostSecret: "valid-host-secret",
      playerId: 10,
      didEat: true
    });
    socketHarness.triggerSetWingParticipation({
      hostSecret: "valid-host-secret",
      playerId: "player-1",
      didEat: "yes"
    });
    socketHarness.triggerSetWingParticipation({
      hostSecret: "invalid-host-secret",
      playerId: "player-1",
      didEat: true
    });
    socketHarness.triggerSetWingParticipation({
      hostSecret: "valid-host-secret",
      playerId: "player-2",
      didEat: false
    });
  });

  assert.deepEqual(participationCalls, [{ playerId: "player-2", didEat: false }]);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized adjust-team-score payloads", () => {
  const socketHarness = createSocketHarness();
  const adjustmentCalls: Array<{ teamId: string; delta: number }> = [];

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.ROUND_RESULTS)),
    createMutationHandlers({
      onAuthorizedAdjustTeamScore: (teamId, delta) => {
        adjustmentCalls.push({ teamId, delta });
      }
    }),
    true,
    hostAuth
  );

  assert.doesNotThrow(() => {
    socketHarness.triggerAdjustTeamScore(undefined);
    socketHarness.triggerAdjustTeamScore({});
    socketHarness.triggerAdjustTeamScore({ hostSecret: "valid-host-secret" });
    socketHarness.triggerAdjustTeamScore({
      hostSecret: "valid-host-secret",
      teamId: "team-1",
      delta: 0
    });
    socketHarness.triggerAdjustTeamScore({
      hostSecret: "valid-host-secret",
      teamId: 1,
      delta: 3
    });
    socketHarness.triggerAdjustTeamScore({
      hostSecret: "invalid-host-secret",
      teamId: "team-1",
      delta: 3
    });
    socketHarness.triggerAdjustTeamScore({
      hostSecret: "valid-host-secret",
      teamId: "team-1",
      delta: -2
    });
  });

  assert.deepEqual(adjustmentCalls, [{ teamId: "team-1", delta: -2 }]);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized redo-last-mutation payloads", () => {
  const socketHarness = createSocketHarness();
  let redoCalls = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.ROUND_RESULTS)),
    createMutationHandlers({
      onAuthorizedRedoLastMutation: () => {
        redoCalls += 1;
      }
    }),
    true,
    hostAuth
  );

  assert.doesNotThrow(() => {
    socketHarness.triggerRedoLastMutation(undefined);
    socketHarness.triggerRedoLastMutation({});
    socketHarness.triggerRedoLastMutation({ hostSecret: "invalid-host-secret" });
    socketHarness.triggerRedoLastMutation({ hostSecret: "valid-host-secret" });
  });

  assert.equal(redoCalls, 1);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized minigame-action payloads", () => {
  const socketHarness = createSocketHarness();
  const minigameActionCalls: MinigameActionPayload[] = [];

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.SETUP)),
    createMutationHandlers({
      onAuthorizedMinigameAction: (payload) => {
        minigameActionCalls.push(payload);
      }
    }),
    true,
    hostAuth
  );

  assert.doesNotThrow(() => {
    socketHarness.triggerMinigameAction(undefined);
    socketHarness.triggerMinigameAction({});
    socketHarness.triggerMinigameAction({ hostSecret: "valid-host-secret" });
    socketHarness.triggerMinigameAction({
      hostSecret: "valid-host-secret",
      minigameApiVersion: MINIGAME_API_VERSION,
      minigameId: "TRIVIA",
      actionType: "recordAttempt"
    });
    socketHarness.triggerMinigameAction({
      hostSecret: "valid-host-secret",
      minigameApiVersion: MINIGAME_API_VERSION,
      minigameId: "TRIVIA",
      actionType: "recordAttempt",
      actionPayload: {
        isCorrect: "yes"
      }
    });
    socketHarness.triggerMinigameAction({
      hostSecret: "invalid-host-secret",
      minigameApiVersion: MINIGAME_API_VERSION,
      minigameId: "TRIVIA",
      actionType: "recordAttempt",
      actionPayload: {
        isCorrect: true
      }
    });
    socketHarness.triggerMinigameAction({
      hostSecret: "valid-host-secret",
      minigameApiVersion: MINIGAME_API_VERSION,
      minigameId: "TRIVIA",
      actionType: "recordAttempt",
      actionPayload: {
        isCorrect: false
      }
    });
    socketHarness.triggerMinigameAction({
      hostSecret: "valid-host-secret",
      minigameApiVersion: MINIGAME_API_VERSION,
      minigameId: "GEO",
      actionType: "recordAttempt",
      actionPayload: {
        isCorrect: true
      }
    });
  });

  assert.deepEqual(minigameActionCalls, [
    {
      hostSecret: "valid-host-secret",
      minigameApiVersion: MINIGAME_API_VERSION,
      minigameId: "TRIVIA",
      actionType: "recordAttempt",
      actionPayload: {
        isCorrect: "yes"
      }
    },
    {
      hostSecret: "valid-host-secret",
      minigameApiVersion: MINIGAME_API_VERSION,
      minigameId: "TRIVIA",
      actionType: "recordAttempt",
      actionPayload: {
        isCorrect: false
      }
    },
    {
      hostSecret: "valid-host-secret",
      minigameApiVersion: MINIGAME_API_VERSION,
      minigameId: "GEO",
      actionType: "recordAttempt",
      actionPayload: {
        isCorrect: true
      }
    }
  ]);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized timer pause/resume payloads", () => {
  const socketHarness = createSocketHarness();
  let pauseCalls = 0;
  let resumeCalls = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.EATING)),
    createMutationHandlers({
      onAuthorizedPauseTimer: () => {
        pauseCalls += 1;
      },
      onAuthorizedResumeTimer: () => {
        resumeCalls += 1;
      }
    }),
    true,
    hostAuth
  );

  assert.doesNotThrow(() => {
    socketHarness.triggerTimerPause(undefined);
    socketHarness.triggerTimerPause({});
    socketHarness.triggerTimerPause({ hostSecret: "invalid-host-secret" });
    socketHarness.triggerTimerPause({ hostSecret: "valid-host-secret" });
    socketHarness.triggerTimerResume(undefined);
    socketHarness.triggerTimerResume({});
    socketHarness.triggerTimerResume({ hostSecret: "invalid-host-secret" });
    socketHarness.triggerTimerResume({ hostSecret: "valid-host-secret" });
  });

  assert.equal(pauseCalls, 1);
  assert.equal(resumeCalls, 1);
  assert.equal(socketHarness.invalidSecretEvents, 2);
});

test("ignores malformed and unauthorized timer extend payloads", () => {
  const socketHarness = createSocketHarness();
  const timerExtendCalls: number[] = [];

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.EATING)),
    createMutationHandlers({
      onAuthorizedExtendTimer: (additionalSeconds) => {
        timerExtendCalls.push(additionalSeconds);
      }
    }),
    true,
    hostAuth
  );

  assert.doesNotThrow(() => {
    socketHarness.triggerTimerExtend(undefined);
    socketHarness.triggerTimerExtend({});
    socketHarness.triggerTimerExtend({ hostSecret: "valid-host-secret" });
    socketHarness.triggerTimerExtend({
      hostSecret: "valid-host-secret",
      additionalSeconds: "15"
    });
    socketHarness.triggerTimerExtend({
      hostSecret: "valid-host-secret",
      additionalSeconds: -5
    });
    socketHarness.triggerTimerExtend({
      hostSecret: "valid-host-secret",
      additionalSeconds: 601
    });
    socketHarness.triggerTimerExtend({
      hostSecret: "invalid-host-secret",
      additionalSeconds: 15
    });
    socketHarness.triggerTimerExtend({
      hostSecret: "valid-host-secret",
      additionalSeconds: 15
    });
  });

  assert.deepEqual(timerExtendCalls, [15]);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});
