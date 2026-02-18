import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  Phase,
  SERVER_TO_CLIENT_EVENTS,
  type HostSecretPayload,
  type RoomState
} from "@wingnight/shared";

import { registerRoomStateHandlers } from "./registerRoomStateHandlers/index.js";

type SocketUnderTest = Parameters<typeof registerRoomStateHandlers>[0];
type MutationHandlersUnderTest = Parameters<typeof registerRoomStateHandlers>[2];

type SocketHarness = {
  socket: SocketUnderTest;
  emittedSnapshots: RoomState[];
  emittedSecretPayloads: HostSecretPayload[];
  invalidSecretEvents: number;
  triggerRequestState: () => void;
  triggerHostClaim: () => void;
  triggerNextPhase: (payload: unknown) => void;
  triggerCreateTeam: (payload: unknown) => void;
  triggerAssignPlayer: (payload: unknown) => void;
  triggerSetWingParticipation: (payload: unknown) => void;
  triggerRecordTriviaAttempt: (payload: unknown) => void;
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
    activeTurnTeamId: null,
    currentTriviaPrompt: null,
    triviaPromptCursor: 0,
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {}
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
  let recordTriviaAttemptHandler = (_payload: unknown): void => {
    assert.fail(
      `Expected ${CLIENT_TO_SERVER_EVENTS.RECORD_TRIVIA_ATTEMPT} handler to be registered.`
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
        | typeof CLIENT_TO_SERVER_EVENTS.CREATE_TEAM
        | typeof CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER
        | typeof CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION
        | typeof CLIENT_TO_SERVER_EVENTS.RECORD_TRIVIA_ATTEMPT
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

      if (event === CLIENT_TO_SERVER_EVENTS.RECORD_TRIVIA_ATTEMPT) {
        recordTriviaAttemptHandler = listener as (payload: unknown) => void;
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
    triggerCreateTeam: (payload: unknown): void => {
      createTeamHandler(payload);
    },
    triggerAssignPlayer: (payload: unknown): void => {
      assignPlayerHandler(payload);
    },
    triggerSetWingParticipation: (payload: unknown): void => {
      setWingParticipationHandler(payload);
    },
    triggerRecordTriviaAttempt: (payload: unknown): void => {
      recordTriviaAttemptHandler(payload);
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
    onAuthorizedCreateTeam: () => {
      // no-op
    },
    onAuthorizedAssignPlayer: () => {
      // no-op
    },
    onAuthorizedSetWingParticipation: () => {
      // no-op
    },
    onAuthorizedRecordTriviaAttempt: () => {
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
    () => firstState,
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

test("ignores unauthorized game:nextPhase requests", () => {
  const socketHarness = createSocketHarness();
  const initialState = buildRoomState(Phase.SETUP);
  let authorizedCallCount = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => initialState,
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

test("runs authorized next phase callback without per-socket snapshot emit", () => {
  const socketHarness = createSocketHarness();
  const initialState = buildRoomState(Phase.SETUP);
  const advancedState = buildRoomState(Phase.INTRO, 1);
  const broadcastSnapshots: RoomState[] = [];
  let authorizedCallCount = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => initialState,
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

test("runs authorized create-team callback and ignores unauthorized payloads", () => {
  const socketHarness = createSocketHarness();
  let createTeamCalls = 0;
  let createdTeamName = "";

  registerRoomStateHandlers(
    socketHarness.socket,
    () => buildRoomState(Phase.SETUP),
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

test("ignores malformed and unauthorized trivia-attempt payloads", () => {
  const socketHarness = createSocketHarness();
  const triviaAttemptCalls: boolean[] = [];

  registerRoomStateHandlers(
    socketHarness.socket,
    () => buildRoomState(Phase.SETUP),
    createMutationHandlers({
      onAuthorizedRecordTriviaAttempt: (isCorrect) => {
        triviaAttemptCalls.push(isCorrect);
      }
    }),
    true,
    hostAuth
  );

  assert.doesNotThrow(() => {
    socketHarness.triggerRecordTriviaAttempt(undefined);
    socketHarness.triggerRecordTriviaAttempt({});
    socketHarness.triggerRecordTriviaAttempt({ hostSecret: "valid-host-secret" });
    socketHarness.triggerRecordTriviaAttempt({
      hostSecret: "valid-host-secret",
      isCorrect: "yes"
    });
    socketHarness.triggerRecordTriviaAttempt({
      hostSecret: "invalid-host-secret",
      isCorrect: true
    });
    socketHarness.triggerRecordTriviaAttempt({
      hostSecret: "valid-host-secret",
      isCorrect: false
    });
  });

  assert.deepEqual(triviaAttemptCalls, [false]);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized timer pause/resume payloads", () => {
  const socketHarness = createSocketHarness();
  let pauseCalls = 0;
  let resumeCalls = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => buildRoomState(Phase.EATING),
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
