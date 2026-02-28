import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type ScoringSetWingParticipationPayload
} from "@wingnight/shared";

import { requestSetWingParticipation } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type SetWingParticipationSocket = Parameters<typeof requestSetWingParticipation>[0];

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION,
    ScoringSetWingParticipationPayload
  >(CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const didEmit = requestSetWingParticipation(
    socket as unknown as SetWingParticipationSocket,
    "player-1",
    true,
    missingHostSecretTracker.onMissingHostSecret,
    () => null
  );

  assert.equal(didEmit, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.deepEqual(emittedPayloads, []);
});

test("emits scoring:setWingParticipation payload when host secret exists", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION,
    ScoringSetWingParticipationPayload
  >(CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION);

  const didEmit = requestSetWingParticipation(
    socket as unknown as SetWingParticipationSocket,
    "player-7",
    true,
    undefined,
    () => "host-secret"
  );

  assert.equal(didEmit, true);
  assert.deepEqual(emittedPayloads, [
    {
      hostSecret: "host-secret",
      playerId: "player-7",
      didEat: true
    }
  ]);
});
