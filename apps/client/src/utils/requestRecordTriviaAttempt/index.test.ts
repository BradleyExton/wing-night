import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type MinigameActionPayload
} from "@wingnight/shared";

import { requestRecordTriviaAttempt } from "./index";

type RecordTriviaAttemptSocket = Parameters<typeof requestRecordTriviaAttempt>[0];

class MockRecordTriviaAttemptSocket {
  public emittedPayloads: MinigameActionPayload[] = [];

  public emit(
    event: typeof CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION,
    payload: MinigameActionPayload
  ): void {
    if (event === CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION) {
      this.emittedPayloads.push(payload);
    }
  }
}

test("returns false and emits nothing when host secret is unavailable", () => {
  const socket = new MockRecordTriviaAttemptSocket();
  let missingSecretCalls = 0;

  const didEmit = requestRecordTriviaAttempt(
    socket as unknown as RecordTriviaAttemptSocket,
    true,
    () => {
      missingSecretCalls += 1;
    },
    () => null
  );

  assert.equal(didEmit, false);
  assert.equal(missingSecretCalls, 1);
  assert.deepEqual(socket.emittedPayloads, []);
});

test("emits minigame:action payload when host secret exists", () => {
  const socket = new MockRecordTriviaAttemptSocket();

  const didEmit = requestRecordTriviaAttempt(
    socket as unknown as RecordTriviaAttemptSocket,
    false,
    undefined,
    () => "host-secret"
  );

  assert.equal(didEmit, true);
  assert.deepEqual(socket.emittedPayloads, [
    {
      hostSecret: "host-secret",
      minigameId: "TRIVIA",
      actionType: "recordAttempt",
      actionPayload: {
        isCorrect: false
      }
    }
  ]);
});
