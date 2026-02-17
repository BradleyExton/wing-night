import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type SetupCreateTeamPayload
} from "@wingnight/shared";

import { requestCreateTeam } from "./index";

type CreateTeamSocket = Parameters<typeof requestCreateTeam>[0];

class MockCreateTeamSocket {
  public emittedPayloads: SetupCreateTeamPayload[] = [];

  public emit(
    event: typeof CLIENT_TO_SERVER_EVENTS.CREATE_TEAM,
    payload: SetupCreateTeamPayload
  ): void {
    if (event === CLIENT_TO_SERVER_EVENTS.CREATE_TEAM) {
      this.emittedPayloads.push(payload);
    }
  }
}

test("returns false and emits nothing when host secret is unavailable", () => {
  const socket = new MockCreateTeamSocket();
  let missingSecretCalls = 0;

  const didEmit = requestCreateTeam(
    socket as unknown as CreateTeamSocket,
    "Team One",
    () => {
      missingSecretCalls += 1;
    },
    () => null
  );

  assert.equal(didEmit, false);
  assert.equal(missingSecretCalls, 1);
  assert.deepEqual(socket.emittedPayloads, []);
});

test("returns false and emits nothing for blank team names", () => {
  const socket = new MockCreateTeamSocket();

  const didEmit = requestCreateTeam(
    socket as unknown as CreateTeamSocket,
    "   ",
    undefined,
    () => "host-secret"
  );

  assert.equal(didEmit, false);
  assert.deepEqual(socket.emittedPayloads, []);
});

test("emits setup:createTeam payload when host secret and name are valid", () => {
  const socket = new MockCreateTeamSocket();

  const didEmit = requestCreateTeam(
    socket as unknown as CreateTeamSocket,
    " Team One ",
    undefined,
    () => "host-secret"
  );

  assert.equal(didEmit, true);
  assert.deepEqual(socket.emittedPayloads, [
    { hostSecret: "host-secret", name: "Team One" }
  ]);
});
