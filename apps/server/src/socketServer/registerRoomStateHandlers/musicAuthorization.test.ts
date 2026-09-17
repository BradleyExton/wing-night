import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  MUSIC_PLAYBACK_SOURCES,
  Phase
} from "@wingnight/shared";

import { setupHandlers } from "./testHarness.js";

const HOST_MUSIC_EVENTS = [
  CLIENT_TO_SERVER_EVENTS.MUSIC_PAUSE,
  CLIENT_TO_SERVER_EVENTS.MUSIC_RESUME,
  CLIENT_TO_SERVER_EVENTS.MUSIC_SKIP
] as const;

for (const event of HOST_MUSIC_EVENTS) {
  test(`ignores malformed and unauthorized ${event} payloads`, () => {
    let calls = 0;

    const socketHarness = setupHandlers({
      phase: Phase.SETUP,
      overrides: {
        [event]: () => {
          calls += 1;
        }
      }
    });

    assert.doesNotThrow(() => {
      socketHarness.trigger(event, undefined);
      socketHarness.trigger(event, {});
      socketHarness.trigger(event, { hostSecret: "invalid-host-secret" });
      socketHarness.trigger(event, { hostSecret: "valid-host-secret" });
    });

    assert.equal(calls, 1);
    assert.equal(socketHarness.invalidSecretEvents, 1);
  });
}

// The display's report is the ONE client event that carries no host secret, so
// this pins the thing that makes that safe: the payload still has to be the
// exact shape, and nothing about it can reach a game-state mutation.
test("accepts a well-formed track-ended report with no host secret", () => {
  const reports: unknown[] = [];

  const socketHarness = setupHandlers({
    phase: Phase.SETUP,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.MUSIC_TRACK_ENDED]: (payload) => {
        reports.push(payload);
      }
    }
  });

  assert.doesNotThrow(() => {
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.MUSIC_TRACK_ENDED, {
      source: MUSIC_PLAYBACK_SOURCES.LOBBY,
      trackIndex: 0
    });
  });

  assert.deepEqual(reports, [
    { source: MUSIC_PLAYBACK_SOURCES.LOBBY, trackIndex: 0 }
  ]);
  assert.equal(socketHarness.invalidSecretEvents, 0);
});

test("ignores malformed track-ended reports", () => {
  let reportCalls = 0;

  const socketHarness = setupHandlers({
    phase: Phase.SETUP,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.MUSIC_TRACK_ENDED]: () => {
        reportCalls += 1;
      }
    }
  });

  assert.doesNotThrow(() => {
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.MUSIC_TRACK_ENDED, undefined);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.MUSIC_TRACK_ENDED, {});
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.MUSIC_TRACK_ENDED, {
      source: "SOMETHING_ELSE",
      trackIndex: 0
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.MUSIC_TRACK_ENDED, {
      source: MUSIC_PLAYBACK_SOURCES.LOBBY,
      trackIndex: -1
    });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.MUSIC_TRACK_ENDED, {
      source: MUSIC_PLAYBACK_SOURCES.LOBBY,
      trackIndex: 1.5
    });
  });

  assert.equal(reportCalls, 0);
  assert.equal(socketHarness.invalidSecretEvents, 0);
});
