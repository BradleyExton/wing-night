import assert from "node:assert/strict";
import test from "node:test";

import { CLIENT_TO_SERVER_EVENTS, Phase } from "@wingnight/shared";

import { setupHandlers } from "./testHarness.js";

test("ignores malformed and unauthorized skip-turn-boundary payloads", () => {
  let skipCalls = 0;

  const socketHarness = setupHandlers({
    phase: Phase.EATING,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY]: () => {
        skipCalls += 1;
      }
    }
  });

  assert.doesNotThrow(() => {
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY, undefined);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY, {});
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY, {
      hostSecret: "invalid-host-secret"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY, {
      hostSecret: "valid-host-secret"
    });
  });

  assert.equal(skipCalls, 1);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized reorder-turn-order payloads", () => {
  const reorderCalls: string[][] = [];

  const socketHarness = setupHandlers({
    phase: Phase.ROUND_INTRO,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER]: (payload) => {
        reorderCalls.push(payload.teamIds);
      }
    }
  });

  assert.doesNotThrow(() => {
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER, undefined);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER, {});
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER, {
      hostSecret: "valid-host-secret"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER, {
      hostSecret: "valid-host-secret",
      teamIds: "team-1"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER, {
      hostSecret: "valid-host-secret",
      teamIds: ["team-1", 3]
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER, {
      hostSecret: "invalid-host-secret",
      teamIds: ["team-1", "team-2"]
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER, {
      hostSecret: "valid-host-secret",
      teamIds: ["team-2", "team-1"]
    });
  });

  assert.deepEqual(reorderCalls, [["team-2", "team-1"]]);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized reset payloads", () => {
  let resetCalls = 0;

  const socketHarness = setupHandlers({
    phase: Phase.ROUND_RESULTS,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.RESET]: () => {
        resetCalls += 1;
      }
    }
  });

  assert.doesNotThrow(() => {
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.RESET, undefined);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.RESET, {});
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.RESET, {
      hostSecret: "invalid-host-secret"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.RESET, {
      hostSecret: "valid-host-secret"
    });
  });

  assert.equal(resetCalls, 1);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("runs authorized create-team callback and ignores unauthorized payloads", () => {
  let createTeamCalls = 0;
  let createdTeamName = "";

  const socketHarness = setupHandlers({
    phase: Phase.SETUP,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.CREATE_TEAM]: (payload) => {
        createTeamCalls += 1;
        createdTeamName = payload.name;
      }
    }
  });

  socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.CREATE_TEAM, {
    hostSecret: "invalid-host-secret",
    name: "Team One"
  });
  socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.CREATE_TEAM, {
    hostSecret: "valid-host-secret",
    name: "Team Two"
  });

  assert.equal(createTeamCalls, 1);
  assert.equal(createdTeamName, "Team Two");
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("runs authorized add-player callback and ignores unauthorized payloads", () => {
  let addPlayerCalls = 0;
  let addedPlayerName = "";

  const socketHarness = setupHandlers({
    phase: Phase.SETUP,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.ADD_PLAYER]: (payload) => {
        addPlayerCalls += 1;
        addedPlayerName = payload.name;
      }
    }
  });

  socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.ADD_PLAYER, {
    hostSecret: "invalid-host-secret",
    name: "Player One"
  });
  socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.ADD_PLAYER, {
    hostSecret: "valid-host-secret",
    name: "Player Two"
  });

  assert.equal(addPlayerCalls, 1);
  assert.equal(addedPlayerName, "Player Two");
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized assign-player payloads", () => {
  const assignmentCalls: Array<{ playerId: string; teamId: string | null }> = [];

  const socketHarness = setupHandlers({
    phase: Phase.SETUP,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER]: (payload) => {
        assignmentCalls.push({ playerId: payload.playerId, teamId: payload.teamId });
      }
    }
  });

  assert.doesNotThrow(() => {
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER, undefined);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER, {});
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER, {
      hostSecret: "valid-host-secret"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER, {
      hostSecret: "valid-host-secret",
      playerId: 10,
      teamId: "team-1"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER, {
      hostSecret: "invalid-host-secret",
      playerId: "player-1",
      teamId: "team-1"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER, {
      hostSecret: "valid-host-secret",
      playerId: "player-1",
      teamId: null
    });
  });

  assert.deepEqual(assignmentCalls, [{ playerId: "player-1", teamId: null }]);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized auto-assign payloads", () => {
  let autoAssignCalls = 0;

  const socketHarness = setupHandlers({
    phase: Phase.SETUP,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.AUTO_ASSIGN_REMAINING_PLAYERS]: () => {
        autoAssignCalls += 1;
      }
    }
  });

  assert.doesNotThrow(() => {
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.AUTO_ASSIGN_REMAINING_PLAYERS, undefined);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.AUTO_ASSIGN_REMAINING_PLAYERS, {});
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.AUTO_ASSIGN_REMAINING_PLAYERS, {
      hostSecret: "invalid-host-secret"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.AUTO_ASSIGN_REMAINING_PLAYERS, {
      hostSecret: "valid-host-secret"
    });
  });

  assert.equal(autoAssignCalls, 1);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized wing-participation payloads", () => {
  const participationCalls: Array<{ playerId: string; didEat: boolean }> = [];

  const socketHarness = setupHandlers({
    phase: Phase.SETUP,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION]: (payload) => {
        participationCalls.push({ playerId: payload.playerId, didEat: payload.didEat });
      }
    }
  });

  assert.doesNotThrow(() => {
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION, undefined);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION, {});
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION, {
      hostSecret: "valid-host-secret"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION, {
      hostSecret: "valid-host-secret",
      playerId: 10,
      didEat: true
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION, {
      hostSecret: "valid-host-secret",
      playerId: "player-1",
      didEat: "yes"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION, {
      hostSecret: "invalid-host-secret",
      playerId: "player-1",
      didEat: true
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION, {
      hostSecret: "valid-host-secret",
      playerId: "player-2",
      didEat: false
    });
  });

  assert.deepEqual(participationCalls, [{ playerId: "player-2", didEat: false }]);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized adjust-team-score payloads", () => {
  const adjustmentCalls: Array<{ teamId: string; delta: number }> = [];

  const socketHarness = setupHandlers({
    phase: Phase.ROUND_RESULTS,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE]: (payload) => {
        adjustmentCalls.push({ teamId: payload.teamId, delta: payload.delta });
      }
    }
  });

  assert.doesNotThrow(() => {
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE, undefined);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE, {});
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE, {
      hostSecret: "valid-host-secret"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE, {
      hostSecret: "valid-host-secret",
      teamId: "team-1",
      delta: 0
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE, {
      hostSecret: "valid-host-secret",
      teamId: 1,
      delta: 3
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE, {
      hostSecret: "invalid-host-secret",
      teamId: "team-1",
      delta: 3
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE, {
      hostSecret: "valid-host-secret",
      teamId: "team-1",
      delta: -2
    });
  });

  assert.deepEqual(adjustmentCalls, [{ teamId: "team-1", delta: -2 }]);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});

test("ignores malformed and unauthorized redo-last-mutation payloads", () => {
  let redoCalls = 0;

  const socketHarness = setupHandlers({
    phase: Phase.ROUND_RESULTS,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION]: () => {
        redoCalls += 1;
      }
    }
  });

  assert.doesNotThrow(() => {
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION, undefined);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION, {});
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION, {
      hostSecret: "invalid-host-secret"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION, {
      hostSecret: "valid-host-secret"
    });
  });

  assert.equal(redoCalls, 1);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});
