import assert from "node:assert/strict";
import test from "node:test";

import { CLIENT_TO_SERVER_EVENTS, Phase, type QuickPlayStartPayload } from "@wingnight/shared";

import { setupHandlers } from "./testHarness.js";

test("ignores malformed and unauthorized quick play start payloads", () => {
  const startCalls: QuickPlayStartPayload[] = [];

  const socketHarness = setupHandlers({
    phase: Phase.SETUP,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.QUICKPLAY_START]: (payload) => {
        startCalls.push(payload);
      }
    }
  });

  const validPayload: QuickPlayStartPayload = {
    hostSecret: "valid-host-secret",
    games: [{ minigame: "TRIVIA", rules: { questionsPerTurn: 3 } }],
    teams: [
      { teamId: "team-1", playerIds: ["player-1"] },
      { teamId: "team-2", playerIds: ["player-2"] }
    ]
  };

  assert.doesNotThrow(() => {
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.QUICKPLAY_START, undefined);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.QUICKPLAY_START, {});
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.QUICKPLAY_START, {
      hostSecret: "valid-host-secret"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.QUICKPLAY_START, {
      ...validPayload,
      games: [{ minigame: "NOT_A_GAME" }]
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.QUICKPLAY_START, {
      ...validPayload,
      teams: [{ teamId: "team-1", playerIds: [1] }]
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.QUICKPLAY_START, {
      ...validPayload,
      hostSecret: "invalid-host-secret"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.QUICKPLAY_START, validPayload);
  });

  assert.deepEqual(startCalls, [validPayload]);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});
