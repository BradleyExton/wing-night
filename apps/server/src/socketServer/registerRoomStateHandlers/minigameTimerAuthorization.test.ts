import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  MINIGAME_API_VERSION,
  Phase,
  type MinigameActionPayload
} from "@wingnight/shared";

import { setupHandlers } from "./testHarness.js";

test("ignores malformed and unauthorized minigame-action payloads", () => {
  const minigameActionCalls: MinigameActionPayload[] = [];

  const socketHarness = setupHandlers({
    phase: Phase.SETUP,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION]: (payload) => {
        minigameActionCalls.push(payload);
      }
    }
  });

  assert.doesNotThrow(() => {
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION, undefined);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION, {});
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION, {
      hostSecret: "valid-host-secret"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION, {
      hostSecret: "valid-host-secret",
      minigameApiVersion: MINIGAME_API_VERSION,
      minigameId: "TRIVIA",
      actionType: "recordAttempt"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION, {
      hostSecret: "valid-host-secret",
      minigameApiVersion: MINIGAME_API_VERSION,
      minigameId: "TRIVIA",
      actionType: "recordAttempt",
      actionPayload: {
        isCorrect: "yes"
      }
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION, {
      hostSecret: "invalid-host-secret",
      minigameApiVersion: MINIGAME_API_VERSION,
      minigameId: "TRIVIA",
      actionType: "recordAttempt",
      actionPayload: {
        isCorrect: true
      }
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION, {
      hostSecret: "valid-host-secret",
      minigameApiVersion: MINIGAME_API_VERSION,
      minigameId: "TRIVIA",
      actionType: "recordAttempt",
      actionPayload: {
        isCorrect: false
      }
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION, {
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
  let pauseCalls = 0;
  let resumeCalls = 0;

  const socketHarness = setupHandlers({
    phase: Phase.EATING,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE]: () => {
        pauseCalls += 1;
      },
      [CLIENT_TO_SERVER_EVENTS.TIMER_RESUME]: () => {
        resumeCalls += 1;
      }
    }
  });

  assert.doesNotThrow(() => {
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE, undefined);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE, {});
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE, {
      hostSecret: "invalid-host-secret"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE, {
      hostSecret: "valid-host-secret"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_RESUME, undefined);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_RESUME, {});
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_RESUME, {
      hostSecret: "invalid-host-secret"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_RESUME, {
      hostSecret: "valid-host-secret"
    });
  });

  assert.equal(pauseCalls, 1);
  assert.equal(resumeCalls, 1);
  assert.equal(socketHarness.invalidSecretEvents, 2);
});

test("ignores malformed and unauthorized timer extend payloads", () => {
  const timerExtendCalls: number[] = [];

  const socketHarness = setupHandlers({
    phase: Phase.EATING,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND]: (payload) => {
        timerExtendCalls.push(payload.additionalSeconds);
      }
    }
  });

  assert.doesNotThrow(() => {
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND, undefined);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND, {});
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND, {
      hostSecret: "valid-host-secret"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND, {
      hostSecret: "valid-host-secret",
      additionalSeconds: "15"
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND, {
      hostSecret: "valid-host-secret",
      additionalSeconds: -5
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND, {
      hostSecret: "valid-host-secret",
      additionalSeconds: 601
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND, {
      hostSecret: "invalid-host-secret",
      additionalSeconds: 15
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND, {
      hostSecret: "valid-host-secret",
      additionalSeconds: 15
    });
  });

  assert.deepEqual(timerExtendCalls, [15]);
  assert.equal(socketHarness.invalidSecretEvents, 1);
});
