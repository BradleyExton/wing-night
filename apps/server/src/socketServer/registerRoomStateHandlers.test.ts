import assert from "node:assert/strict";
import test from "node:test";

import { Phase, type HostSecretPayload, type RoomState } from "@wingnight/shared";

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
};

const buildRoomState = (phase: Phase, currentRound = 0): RoomState => {
  return {
    phase,
    currentRound,
    totalRounds: 3,
    players: [],
    teams: []
  };
};

const createSocketHarness = (): SocketHarness => {
  const emittedSnapshots: RoomState[] = [];
  const emittedSecretPayloads: HostSecretPayload[] = [];
  const invalidSecretEvents = { count: 0 };

  let requestStateHandler = (): void => {
    assert.fail("Expected client:requestState handler to be registered.");
  };
  let hostClaimHandler = (): void => {
    assert.fail("Expected host:claimControl handler to be registered.");
  };
  let nextPhaseHandler = (_payload: unknown): void => {
    assert.fail("Expected game:nextPhase handler to be registered.");
  };
  let createTeamHandler = (_payload: unknown): void => {
    assert.fail("Expected setup:createTeam handler to be registered.");
  };
  let assignPlayerHandler = (_payload: unknown): void => {
    assert.fail("Expected setup:assignPlayer handler to be registered.");
  };

  const socket = {
    emit: (
      event: "server:stateSnapshot" | "host:secretIssued" | "host:secretInvalid",
      payload: RoomState | HostSecretPayload
    ): void => {
      if (event === "server:stateSnapshot") {
        emittedSnapshots.push(payload as RoomState);
        return;
      }

      if (event === "host:secretInvalid") {
        invalidSecretEvents.count += 1;
        return;
      }

      emittedSecretPayloads.push(payload as HostSecretPayload);
    },
    on: (
      event:
        | "client:requestState"
        | "host:claimControl"
        | "game:nextPhase"
        | "setup:createTeam"
        | "setup:assignPlayer",
      listener: (() => void) | ((payload: unknown) => void)
    ): void => {
      if (event === "client:requestState") {
        requestStateHandler = listener as () => void;
        return;
      }

      if (event === "host:claimControl") {
        hostClaimHandler = listener as () => void;
        return;
      }

      if (event === "game:nextPhase") {
        nextPhaseHandler = listener as (payload: unknown) => void;
        return;
      }

      if (event === "setup:createTeam") {
        createTeamHandler = listener as (payload: unknown) => void;
        return;
      }

      assignPlayerHandler = listener as (payload: unknown) => void;
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
