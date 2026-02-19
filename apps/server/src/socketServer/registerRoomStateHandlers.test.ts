import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  MINIGAME_ACTION_TYPES,
  Phase,
  SERVER_TO_CLIENT_EVENTS,
  type HostSecretPayload,
  type MinigameActionEnvelopePayload,
  type RoomState
} from "@wingnight/shared";

import { registerRoomStateHandlers } from "./registerRoomStateHandlers/index.js";

type SocketUnderTest = Parameters<typeof registerRoomStateHandlers>[0];
type MutationHandlersUnderTest = Parameters<typeof registerRoomStateHandlers>[3];

type SocketHarness = {
  socket: SocketUnderTest;
  emittedSnapshots: RoomState[];
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
    triviaPrompts: [],
    currentRoundConfig: null,
    turnOrderTeamIds: [],
    roundTurnCursor: -1,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: null,
    activeTurnTeamId: null,
    currentTriviaPrompt: null,
    triviaPromptCursor: 0,
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
  const emittedSnapshots: RoomState[] = [];
  const emittedSecretPayloads: HostSecretPayload[] = [];
  const invalidSecretEvents = { count: 0 };

  let requestStateHandler = (): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.REQUEST_STATE} handler to be registered.`
    );
  };
  let hostClaimHandler = (): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL} handler to be registered.`
    );
  };
  let nextPhaseHandler = (_payload: unknown): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.NEXT_PHASE} handler to be registered.`
    );
  };
  let skipTurnBoundaryHandler = (_payload: unknown): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY} handler to be registered.`
    );
  };
  let reorderTurnOrderHandler = (_payload: unknown): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER} handler to be registered.`
    );
  };
  let resetGameHandler = (_payload: unknown): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.RESET} handler to be registered.`
    );
  };
  let createTeamHandler = (_payload: unknown): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.CREATE_TEAM} handler to be registered.`
    );
  };
  let assignPlayerHandler = (_payload: unknown): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER} handler to be registered.`
    );
  };
  let setWingParticipationHandler = (_payload: unknown): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION} handler to be registered.`
    );
  };
  let adjustTeamScoreHandler = (_payload: unknown): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE} handler to be registered.`
    );
  };
  let redoLastMutationHandler = (_payload: unknown): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION} handler to be registered.`
    );
  };
  let minigameActionHandler = (_payload: unknown): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION} handler to be registered.`
    );
  };
  let timerPauseHandler = (_payload: unknown): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE} handler to be registered.`
    );
  };
  let timerResumeHandler = (_payload: unknown): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.TIMER_RESUME} handler to be registered.`
    );
  };
  let timerExtendHandler = (_payload: unknown): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND} handler to be registered.`
    );
  };

  const socket = {
    emit: (
      event:
        | typeof SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT
        | typeof SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED
        | typeof SERVER_TO_CLIENT_EVENTS.SECRET_INVALID,
      payload: RoomState | HostSecretPayload
    ): void => {
      if (event === SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT) {
        emittedSnapshots.push(payload as RoomState);
        return;
      }

      if (event === SERVER_TO_CLIENT_EVENTS.SECRET_INVALID) {
        invalidSecretEvents.count += 1;
        return;
      }

      emittedSecretPayloads.push(payload as HostSecretPayload);
    },
    on: (
      event:
        | typeof CLIENT_TO_SERVER_EVENTS.REQUEST_STATE
        | typeof CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL
        | typeof CLIENT_TO_SERVER_EVENTS.NEXT_PHASE
        | typeof CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY
        | typeof CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER
        | typeof CLIENT_TO_SERVER_EVENTS.RESET
        | typeof CLIENT_TO_SERVER_EVENTS.CREATE_TEAM
        | typeof CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER
        | typeof CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION
        | typeof CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE
        | typeof CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION
        | typeof CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION
        | typeof CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE
        | typeof CLIENT_TO_SERVER_EVENTS.TIMER_RESUME
        | typeof CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND,
      listener: (() => void) | ((payload: unknown) => void)
    ): void => {
      if (event === CLIENT_TO_SERVER_EVENTS.REQUEST_STATE) {
        requestStateHandler = listener as () => void;
        return;
      }

      if (event === CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL) {
        hostClaimHandler = listener as () => void;
        return;
      }

      if (event === CLIENT_TO_SERVER_EVENTS.NEXT_PHASE) {
        nextPhaseHandler = listener as (payload: unknown) => void;
        return;
      }

      if (event === CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY) {
        skipTurnBoundaryHandler = listener as (payload: unknown) => void;
        return;
      }

      if (event === CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER) {
        reorderTurnOrderHandler = listener as (payload: unknown) => void;
        return;
      }

      if (event === CLIENT_TO_SERVER_EVENTS.RESET) {
        resetGameHandler = listener as (payload: unknown) => void;
        return;
      }

      if (event === CLIENT_TO_SERVER_EVENTS.CREATE_TEAM) {
        createTeamHandler = listener as (payload: unknown) => void;
        return;
      }

      if (event === CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER) {
        assignPlayerHandler = listener as (payload: unknown) => void;
        return;
      }

      if (event === CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION) {
        setWingParticipationHandler = listener as (payload: unknown) => void;
        return;
      }

      if (event === CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE) {
        adjustTeamScoreHandler = listener as (payload: unknown) => void;
        return;
      }

      if (event === CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION) {
        redoLastMutationHandler = listener as (payload: unknown) => void;
        return;
      }

      if (event === CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION) {
        minigameActionHandler = listener as (payload: unknown) => void;
        return;
      }

      if (event === CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE) {
        timerPauseHandler = listener as (payload: unknown) => void;
        return;
      }

      if (event === CLIENT_TO_SERVER_EVENTS.TIMER_RESUME) {
        timerResumeHandler = listener as (payload: unknown) => void;
        return;
      }

      if (event === CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND) {
        timerExtendHandler = listener as (payload: unknown) => void;
      }
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
      requestStateHandler();
    },
    triggerHostClaim: (): void => {
      hostClaimHandler();
    },
    triggerNextPhase: (payload: unknown): void => {
      nextPhaseHandler(payload);
    },
    triggerSkipTurnBoundary: (payload: unknown): void => {
      skipTurnBoundaryHandler(payload);
    },
    triggerReorderTurnOrder: (payload: unknown): void => {
      reorderTurnOrderHandler(payload);
    },
    triggerResetGame: (payload: unknown): void => {
      resetGameHandler(payload);
    },
    triggerCreateTeam: (payload: unknown): void => {
      createTeamHandler(payload);
    },
    triggerAssignPlayer: (payload: unknown): void => {
      assignPlayerHandler(payload);
    },
    triggerSetWingParticipation: (payload: unknown): void => {
      setWingParticipationHandler(payload);
    },
    triggerAdjustTeamScore: (payload: unknown): void => {
      adjustTeamScoreHandler(payload);
    },
    triggerRedoLastMutation: (payload: unknown): void => {
      redoLastMutationHandler(payload);
    },
    triggerMinigameAction: (payload: unknown): void => {
      minigameActionHandler(payload);
    },
    triggerTimerPause: (payload: unknown): void => {
      timerPauseHandler(payload);
    },
    triggerTimerResume: (payload: unknown): void => {
      timerResumeHandler(payload);
    },
    triggerTimerExtend: (payload: unknown): void => {
      timerExtendHandler(payload);
    }
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
    onAuthorizedDispatchMinigameAction: () => {
      // no-op
    },
    onMinigameActionRejectedForCompatibility: () => {
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

const defaultActiveMinigameContract = () => {
  return {
    minigameId: "TRIVIA" as const,
    minigameApiVersion: 1,
    capabilityFlags: [MINIGAME_ACTION_TYPES.TRIVIA_RECORD_ATTEMPT]
  };
};

const validTriviaMinigameActionPayload: MinigameActionEnvelopePayload = {
  hostSecret: "valid-host-secret",
  minigameId: "TRIVIA",
  minigameApiVersion: 1,
  actionType: MINIGAME_ACTION_TYPES.TRIVIA_RECORD_ATTEMPT,
  actionPayload: {
    isCorrect: false
  }
};

test("emits state snapshot immediately and on client request", () => {
  const socketHarness = createSocketHarness();
  const firstState = buildRoomState(Phase.SETUP, 0);

  registerRoomStateHandlers(
    socketHarness.socket,
    () => firstState,
    defaultActiveMinigameContract,
    createMutationHandlers({
      onAuthorizedNextPhase: () => {
        assert.fail("next phase callback should not be called in this test");
      }
    }),
    true,
    hostAuth
  );

  assert.equal(socketHarness.emittedSnapshots.length, 1);
  assert.deepEqual(socketHarness.emittedSnapshots[0], firstState);

  socketHarness.triggerRequestState();

  assert.equal(socketHarness.emittedSnapshots.length, 2);
  assert.deepEqual(socketHarness.emittedSnapshots[1], firstState);
});

test("emits host secret when host claims control and socket is authorized", () => {
  const socketHarness = createSocketHarness();

  registerRoomStateHandlers(
    socketHarness.socket,
    () => buildRoomState(Phase.SETUP),
    defaultActiveMinigameContract,
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
    () => buildRoomState(Phase.SETUP),
    defaultActiveMinigameContract,
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
    () => initialState,
    defaultActiveMinigameContract,
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
  assert.deepEqual(socketHarness.emittedSnapshots[0], initialState);
});

test("does not validate host secret for malformed game:nextPhase payloads", () => {
  const socketHarness = createSocketHarness();
  let hostSecretValidationCalls = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => buildRoomState(Phase.SETUP),
    defaultActiveMinigameContract,
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
    () => initialState,
    defaultActiveMinigameContract,
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
  assert.deepEqual(socketHarness.emittedSnapshots[0], initialState);
});

test("does not emit invalid-secret event when client cannot claim control", () => {
  const socketHarness = createSocketHarness();
  let authorizedCallCount = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => buildRoomState(Phase.SETUP),
    defaultActiveMinigameContract,
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
    () => initialState,
    defaultActiveMinigameContract,
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
  assert.deepEqual(socketHarness.emittedSnapshots[0], initialState);
  assert.deepEqual(broadcastSnapshots, [advancedState]);
});

test("ignores malformed and unauthorized skip-turn-boundary payloads", () => {
  const socketHarness = createSocketHarness();
  let skipCalls = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => buildRoomState(Phase.EATING),
    defaultActiveMinigameContract,
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
    () => buildRoomState(Phase.ROUND_INTRO),
    defaultActiveMinigameContract,
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
    () => buildRoomState(Phase.ROUND_RESULTS),
    defaultActiveMinigameContract,
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
    () => buildRoomState(Phase.SETUP),
    defaultActiveMinigameContract,
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
    () => buildRoomState(Phase.SETUP),
    defaultActiveMinigameContract,
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
    () => buildRoomState(Phase.SETUP),
    defaultActiveMinigameContract,
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
    () => buildRoomState(Phase.ROUND_RESULTS),
    defaultActiveMinigameContract,
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
    () => buildRoomState(Phase.ROUND_RESULTS),
    defaultActiveMinigameContract,
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
  const actionPayloads: MinigameActionEnvelopePayload[] = [];

  registerRoomStateHandlers(
    socketHarness.socket,
    () => buildRoomState(Phase.MINIGAME_PLAY),
    defaultActiveMinigameContract,
    createMutationHandlers({
      onAuthorizedDispatchMinigameAction: (payload) => {
        actionPayloads.push(payload);
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
      ...validTriviaMinigameActionPayload,
      actionPayload: "invalid-payload"
    });
    socketHarness.triggerMinigameAction({
      ...validTriviaMinigameActionPayload,
      hostSecret: "invalid-host-secret"
    });
    socketHarness.triggerMinigameAction(validTriviaMinigameActionPayload);
  });

  assert.deepEqual(actionPayloads, [validTriviaMinigameActionPayload]);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("rejects minigame-action when active minigame does not match payload", () => {
  const socketHarness = createSocketHarness();
  const mismatchMessages: string[] = [];
  let authorizedCalls = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => buildRoomState(Phase.MINIGAME_PLAY),
    () => ({
      minigameId: "GEO",
      minigameApiVersion: 1,
      capabilityFlags: []
    }),
    createMutationHandlers({
      onAuthorizedDispatchMinigameAction: () => {
        authorizedCalls += 1;
      },
      onMinigameActionRejectedForCompatibility: (message) => {
        mismatchMessages.push(message);
      }
    }),
    true,
    hostAuth
  );

  socketHarness.triggerMinigameAction(validTriviaMinigameActionPayload);

  assert.equal(authorizedCalls, 0);
  assert.deepEqual(mismatchMessages, [
    "Active minigame changed. Refresh host and try again."
  ]);
});

test("rejects minigame-action when api version mismatches active contract", () => {
  const socketHarness = createSocketHarness();
  const mismatchMessages: string[] = [];

  registerRoomStateHandlers(
    socketHarness.socket,
    () => buildRoomState(Phase.MINIGAME_PLAY),
    defaultActiveMinigameContract,
    createMutationHandlers({
      onMinigameActionRejectedForCompatibility: (message) => {
        mismatchMessages.push(message);
      }
    }),
    true,
    hostAuth
  );

  socketHarness.triggerMinigameAction({
    ...validTriviaMinigameActionPayload,
    minigameApiVersion: 2
  });

  assert.deepEqual(mismatchMessages, [
    "Minigame API version mismatch. Refresh host and try again."
  ]);
});

test("rejects minigame-action when action type is unsupported by active contract", () => {
  const socketHarness = createSocketHarness();
  const mismatchMessages: string[] = [];
  let authorizedCalls = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => buildRoomState(Phase.MINIGAME_PLAY),
    defaultActiveMinigameContract,
    createMutationHandlers({
      onAuthorizedDispatchMinigameAction: () => {
        authorizedCalls += 1;
      },
      onMinigameActionRejectedForCompatibility: (message) => {
        mismatchMessages.push(message);
      }
    }),
    true,
    hostAuth
  );

  socketHarness.triggerMinigameAction({
    ...validTriviaMinigameActionPayload,
    actionType: "trivia:unsupportedAction"
  });

  assert.equal(authorizedCalls, 0);
  assert.deepEqual(mismatchMessages, [
    "Unsupported minigame action. Refresh host and try again."
  ]);
});

test("ignores malformed and unauthorized timer pause/resume payloads", () => {
  const socketHarness = createSocketHarness();
  let pauseCalls = 0;
  let resumeCalls = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => buildRoomState(Phase.EATING),
    defaultActiveMinigameContract,
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
    () => buildRoomState(Phase.EATING),
    defaultActiveMinigameContract,
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
