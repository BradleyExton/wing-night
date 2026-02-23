import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type MinigameActionPayload
} from "@wingnight/shared";

import { requestMinigameAction } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type RequestMinigameActionSocket = Parameters<typeof requestMinigameAction>[0];

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION,
    MinigameActionPayload
  >(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const didEmit = requestMinigameAction(
    socket as unknown as RequestMinigameActionSocket,
    "TRIVIA",
    "recordAttempt",
    { isCorrect: true },
    missingHostSecretTracker.onMissingHostSecret,
    () => null
  );

  assert.equal(didEmit, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.deepEqual(emittedPayloads, []);
});

test("emits minigame:action payload when host secret exists", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION,
    MinigameActionPayload
  >(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION);

  const didEmit = requestMinigameAction(
    socket as unknown as RequestMinigameActionSocket,
    "TRIVIA",
    "recordAttempt",
    { isCorrect: false },
    undefined,
    () => "host-secret"
  );

  assert.equal(didEmit, true);
  assert.deepEqual(emittedPayloads, [
    {
      hostSecret: "host-secret",
      minigameApiVersion: 1,
      minigameId: "TRIVIA",
      actionType: "recordAttempt",
      actionPayload: {
        isCorrect: false
      }
    }
  ]);
});
