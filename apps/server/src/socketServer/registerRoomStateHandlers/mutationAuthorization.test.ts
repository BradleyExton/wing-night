import assert from "node:assert/strict";
import test from "node:test";

import { Phase } from "@wingnight/shared";

import { registerRoomStateHandlers } from "./index.js";
import {
  buildRoomState,
  createMutationHandlers,
  createSocketHarness,
  hostAuth,
  toHostSnapshotEnvelope
} from "./testHarness.js";

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
