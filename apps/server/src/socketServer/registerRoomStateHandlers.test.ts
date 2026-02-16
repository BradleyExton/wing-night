import assert from "node:assert/strict";
import test from "node:test";

import { Phase, type HostSecretPayload, type RoomState } from "@wingnight/shared";

import { registerRoomStateHandlers } from "./registerRoomStateHandlers/index.js";

type SocketUnderTest = Parameters<typeof registerRoomStateHandlers>[0];

type SocketHarness = {
  socket: SocketUnderTest;
  emittedSnapshots: RoomState[];
  emittedSecretPayloads: HostSecretPayload[];
  triggerRequestState: () => void;
  triggerHostClaim: () => void;
  triggerNextPhase: (payload: unknown) => void;
};

const buildRoomState = (phase: Phase, currentRound = 0): RoomState => {
  return {
    phase,
    currentRound,
    players: [],
    teams: []
  };
};

const createSocketHarness = (): SocketHarness => {
  const emittedSnapshots: RoomState[] = [];
  const emittedSecretPayloads: HostSecretPayload[] = [];

  let requestStateHandler = (): void => {
    assert.fail("Expected client:requestState handler to be registered.");
  };
  let hostClaimHandler = (): void => {
    assert.fail("Expected host:claimControl handler to be registered.");
  };
  let nextPhaseHandler = (_payload: unknown): void => {
    assert.fail("Expected game:nextPhase handler to be registered.");
  };

  const socket = {
    emit: (
      event: "server:stateSnapshot" | "host:secretIssued",
      payload: RoomState | HostSecretPayload
    ): void => {
      if (event === "server:stateSnapshot") {
        emittedSnapshots.push(payload as RoomState);
        return;
      }

      emittedSecretPayloads.push(payload as HostSecretPayload);
    },
    on: (
      event: "client:requestState" | "host:claimControl" | "game:nextPhase",
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

      nextPhaseHandler = listener as (payload: unknown) => void;
    }
  } as unknown as SocketUnderTest;

  return {
    socket,
    emittedSnapshots,
    emittedSecretPayloads,
    triggerRequestState: (): void => {
      requestStateHandler();
    },
    triggerHostClaim: (): void => {
      hostClaimHandler();
    },
    triggerNextPhase: (payload: unknown): void => {
      nextPhaseHandler(payload);
    }
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
    () => {
      assert.fail("next phase callback should not be called in this test");
    },
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
    () => {
      assert.fail("next phase callback should not be called in this test");
    },
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
    () => {
      assert.fail("next phase callback should not be called in this test");
    },
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
    () => {
      authorizedCallCount += 1;
    },
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
    () => {
      authorizedCallCount += 1;
    },
    true,
    hostAuth
  );

  socketHarness.triggerNextPhase({ hostSecret: "invalid-host-secret" });

  assert.equal(authorizedCallCount, 0);
  assert.equal(socketHarness.emittedSnapshots.length, 1);
  assert.deepEqual(socketHarness.emittedSnapshots[0], initialState);
});

test("runs authorized next phase callback and emits updated snapshot", () => {
  const socketHarness = createSocketHarness();
  const initialState = buildRoomState(Phase.SETUP);
  const advancedState = buildRoomState(Phase.INTRO, 1);
  let snapshotReads = 0;
  let authorizedCallCount = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => {
      snapshotReads += 1;
      return snapshotReads === 1 ? initialState : advancedState;
    },
    () => {
      authorizedCallCount += 1;
    },
    true,
    hostAuth
  );

  socketHarness.triggerNextPhase({ hostSecret: "valid-host-secret" });

  assert.equal(authorizedCallCount, 1);
  assert.equal(socketHarness.emittedSnapshots.length, 2);
  assert.deepEqual(socketHarness.emittedSnapshots[0], initialState);
  assert.deepEqual(socketHarness.emittedSnapshots[1], advancedState);
});
