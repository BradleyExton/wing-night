import assert from "node:assert/strict";
import test from "node:test";

import {
  MINIGAME_API_VERSION,
  Phase,
  type MinigameActionPayload
} from "@wingnight/shared";

import { registerRoomStateHandlers } from "./index.js";
import {
  buildRoomState,
  createMutationHandlers,
  createSocketHarness,
  hostAuth,
  toHostSnapshotEnvelope
} from "./testHarness.js";

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
