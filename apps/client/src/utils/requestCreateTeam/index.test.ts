import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type SetupCreateTeamPayload
} from "@wingnight/shared";

import { requestCreateTeam } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type CreateTeamSocket = Parameters<typeof requestCreateTeam>[0];

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.CREATE_TEAM,
    SetupCreateTeamPayload
  >(CLIENT_TO_SERVER_EVENTS.CREATE_TEAM);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const didEmit = requestCreateTeam(
    socket as unknown as CreateTeamSocket,
    "Team One",
    missingHostSecretTracker.onMissingHostSecret,
    () => null
  );

  assert.equal(didEmit, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.deepEqual(emittedPayloads, []);
});

test("returns false and emits nothing for blank team names", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.CREATE_TEAM,
    SetupCreateTeamPayload
  >(CLIENT_TO_SERVER_EVENTS.CREATE_TEAM);

  const didEmit = requestCreateTeam(
    socket as unknown as CreateTeamSocket,
    "   ",
    undefined,
    () => "host-secret"
  );

  assert.equal(didEmit, false);
  assert.deepEqual(emittedPayloads, []);
});

test("emits setup:createTeam payload when host secret and name are valid", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.CREATE_TEAM,
    SetupCreateTeamPayload
  >(CLIENT_TO_SERVER_EVENTS.CREATE_TEAM);

  const didEmit = requestCreateTeam(
    socket as unknown as CreateTeamSocket,
    " Team One ",
    undefined,
    () => "host-secret"
  );

  assert.equal(didEmit, true);
  assert.deepEqual(emittedPayloads, [
    { hostSecret: "host-secret", name: "Team One" }
  ]);
});
