import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type SetupAddPlayerPayload
} from "@wingnight/shared";

import { requestAddPlayer } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type AddPlayerSocket = Parameters<typeof requestAddPlayer>[0];

test("returns false and emits nothing for blank player names", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.ADD_PLAYER,
    SetupAddPlayerPayload
  >(CLIENT_TO_SERVER_EVENTS.ADD_PLAYER);

  const didEmit = requestAddPlayer(
    socket as unknown as AddPlayerSocket,
    "   ",
    undefined,
    () => "host-secret"
  );

  assert.equal(didEmit, false);
  assert.deepEqual(emittedPayloads, []);
});

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.ADD_PLAYER,
    SetupAddPlayerPayload
  >(CLIENT_TO_SERVER_EVENTS.ADD_PLAYER);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const didEmit = requestAddPlayer(
    socket as unknown as AddPlayerSocket,
    "New Player",
    missingHostSecretTracker.onMissingHostSecret,
    () => null
  );

  assert.equal(didEmit, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.deepEqual(emittedPayloads, []);
});

test("emits setup:addPlayer payload when host secret and name are valid", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.ADD_PLAYER,
    SetupAddPlayerPayload
  >(CLIENT_TO_SERVER_EVENTS.ADD_PLAYER);

  const didEmit = requestAddPlayer(
    socket as unknown as AddPlayerSocket,
    "  New Player  ",
    undefined,
    () => "host-secret"
  );

  assert.equal(didEmit, true);
  assert.deepEqual(emittedPayloads, [
    { hostSecret: "host-secret", name: "New Player" }
  ]);
});
