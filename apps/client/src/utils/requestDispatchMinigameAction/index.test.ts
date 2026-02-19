import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  MINIGAME_ACTION_TYPES,
  type MinigameActionEnvelopePayload
} from "@wingnight/shared";

import { requestDispatchMinigameAction } from "./index";

type DispatchMinigameActionSocket = Parameters<
  typeof requestDispatchMinigameAction
>[0];

class MockDispatchMinigameActionSocket {
  public emittedPayloads: MinigameActionEnvelopePayload[] = [];

  public emit(
    event: typeof CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION,
    payload: MinigameActionEnvelopePayload
  ): void {
    if (event === CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION) {
      this.emittedPayloads.push(payload);
    }
  }
}

const triviaActionPayload = {
  minigameId: "TRIVIA" as const,
  minigameApiVersion: 1,
  actionType: MINIGAME_ACTION_TYPES.TRIVIA_RECORD_ATTEMPT,
  actionPayload: {
    isCorrect: false
  }
};

test("returns false and emits nothing when host secret is unavailable", () => {
  const socket = new MockDispatchMinigameActionSocket();
  let missingSecretCalls = 0;

  const didEmit = requestDispatchMinigameAction(
    socket as unknown as DispatchMinigameActionSocket,
    triviaActionPayload,
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
  const socket = new MockDispatchMinigameActionSocket();

  const didEmit = requestDispatchMinigameAction(
    socket as unknown as DispatchMinigameActionSocket,
    triviaActionPayload,
    undefined,
    () => "host-secret"
  );

  assert.equal(didEmit, true);
  assert.deepEqual(socket.emittedPayloads, [
    {
      hostSecret: "host-secret",
      minigameId: "TRIVIA",
      minigameApiVersion: 1,
      actionType: MINIGAME_ACTION_TYPES.TRIVIA_RECORD_ATTEMPT,
      actionPayload: {
        isCorrect: false
      }
    }
  ]);
});
