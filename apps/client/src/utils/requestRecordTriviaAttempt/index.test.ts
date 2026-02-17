import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type MinigameRecordTriviaAttemptPayload
} from "@wingnight/shared";

import { requestRecordTriviaAttempt } from "./index";

type RecordTriviaAttemptSocket = Parameters<typeof requestRecordTriviaAttempt>[0];

class MockRecordTriviaAttemptSocket {
  public emittedPayloads: MinigameRecordTriviaAttemptPayload[] = [];

  public emit(
    event: typeof CLIENT_TO_SERVER_EVENTS.RECORD_TRIVIA_ATTEMPT,
    payload: MinigameRecordTriviaAttemptPayload
  ): void {
    if (event === CLIENT_TO_SERVER_EVENTS.RECORD_TRIVIA_ATTEMPT) {
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

test("emits minigame:recordTriviaAttempt payload when host secret exists", () => {
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
      isCorrect: false
    }
  ]);
});
