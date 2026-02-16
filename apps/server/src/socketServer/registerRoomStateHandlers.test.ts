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
  triggerNextPhase: (payload: HostSecretPayload) => void;
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
  let nextPhaseHandler = (_payload: HostSecretPayload): void => {
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
      listener: (() => void) | ((payload: HostSecretPayload) => void)
    ): void => {
      if (event === "client:requestState") {
        requestStateHandler = listener as () => void;
        return;
      }

      if (event === "host:claimControl") {
        hostClaimHandler = listener as () => void;
        return;
      }

      nextPhaseHandler = listener as (payload: HostSecretPayload) => void;
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
    triggerNextPhase: (payload: HostSecretPayload): void => {
      nextPhaseHandler(payload);
    }
  };
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
    {
      issueHostSecret: () => ({ hostSecret: "host-secret" }),
      isValidHostSecret: () => false
    }
  );

  assert.equal(socketHarness.emittedSnapshots.length, 1);
  assert.deepEqual(socketHarness.emittedSnapshots[0], firstState);

  socketHarness.triggerRequestState();

  assert.equal(socketHarness.emittedSnapshots.length, 2);
  assert.deepEqual(socketHarness.emittedSnapshots[1], firstState);
});

test("emits host secret when host claims control", () => {
  const socketHarness = createSocketHarness();
  const issuedPayload: HostSecretPayload = { hostSecret: "issued-host-secret" };

  registerRoomStateHandlers(
    socketHarness.socket,
    () => buildRoomState(Phase.SETUP),
    () => {
      assert.fail("next phase callback should not be called in this test");
    },
    {
      issueHostSecret: () => issuedPayload,
      isValidHostSecret: () => false
    }
  );

  socketHarness.triggerHostClaim();

  assert.deepEqual(socketHarness.emittedSecretPayloads, [issuedPayload]);
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
    {
      issueHostSecret: () => ({ hostSecret: "host-secret" }),
      isValidHostSecret: (hostSecret) => hostSecret === "valid-host-secret"
    }
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
    {
      issueHostSecret: () => ({ hostSecret: "host-secret" }),
      isValidHostSecret: (hostSecret) => hostSecret === "valid-host-secret"
    }
  );

  socketHarness.triggerNextPhase({ hostSecret: "valid-host-secret" });

  assert.equal(authorizedCallCount, 1);
  assert.equal(socketHarness.emittedSnapshots.length, 2);
  assert.deepEqual(socketHarness.emittedSnapshots[0], initialState);
  assert.deepEqual(socketHarness.emittedSnapshots[1], advancedState);
});
