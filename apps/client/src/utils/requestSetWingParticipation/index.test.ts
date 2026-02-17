import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type ScoringSetWingParticipationPayload
} from "@wingnight/shared";

import { requestSetWingParticipation } from "./index";

type SetWingParticipationSocket = Parameters<typeof requestSetWingParticipation>[0];

class MockSetWingParticipationSocket {
  public emittedPayloads: ScoringSetWingParticipationPayload[] = [];

  public emit(
    event: typeof CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION,
    payload: ScoringSetWingParticipationPayload
  ): void {
    if (event === CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION) {
      this.emittedPayloads.push(payload);
    }
  }
}

test("returns false and emits nothing when host secret is unavailable", () => {
  const socket = new MockSetWingParticipationSocket();
  let missingSecretCalls = 0;

  const didEmit = requestSetWingParticipation(
    socket as unknown as SetWingParticipationSocket,
    "player-1",
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

test("emits scoring:setWingParticipation payload when host secret exists", () => {
  const socket = new MockSetWingParticipationSocket();

  const didEmit = requestSetWingParticipation(
    socket as unknown as SetWingParticipationSocket,
    "player-7",
    true,
    undefined,
    () => "host-secret"
  );

  assert.equal(didEmit, true);
  assert.deepEqual(socket.emittedPayloads, [
    {
      hostSecret: "host-secret",
      playerId: "player-7",
      didEat: true
    }
  ]);
});
