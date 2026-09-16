import assert from "node:assert/strict";
import test from "node:test";

import {
  hasReachedClipEnd,
  resolveSongPlaybackIntent,
  type SongPlaybackSnapshot
} from "./index.js";

const snapshot = (
  overrides: Partial<SongPlaybackSnapshot> = {}
): SongPlaybackSnapshot => ({
  phase: "idle",
  songCursor: 0,
  replayUsed: false,
  clipStartSeconds: 12,
  revealStartSeconds: 40,
  ...overrides
});

test("starts the clip from clipStart when play follows idle", () => {
  assert.deepEqual(
    resolveSongPlaybackIntent(
      snapshot({ phase: "idle" }),
      snapshot({ phase: "clip_playing" })
    ),
    { kind: "play", seekToSeconds: 12 }
  );
});

// Play from paused is a RESUME. Restarting here would hand the room a second
// listen without spending the one replay the rules allow.
test("resumes without seeking when play follows a pause", () => {
  assert.deepEqual(
    resolveSongPlaybackIntent(
      snapshot({ phase: "clip_paused" }),
      snapshot({ phase: "clip_playing" })
    ),
    { kind: "play", seekToSeconds: null }
  );
});

test("restarts from the top when the replay allowance is spent", () => {
  assert.deepEqual(
    resolveSongPlaybackIntent(
      snapshot({ phase: "clip_paused", replayUsed: false }),
      snapshot({ phase: "clip_playing", replayUsed: true })
    ),
    { kind: "play", seekToSeconds: 12 }
  );
});

test("does nothing on a re-render that changes nothing", () => {
  assert.deepEqual(
    resolveSongPlaybackIntent(
      snapshot({ phase: "clip_playing" }),
      snapshot({ phase: "clip_playing" })
    ),
    { kind: "none" }
  );
});

test("starts from clipStart on the first render of a turn", () => {
  assert.deepEqual(resolveSongPlaybackIntent(null, snapshot({ phase: "clip_playing" })), {
    kind: "play",
    seekToSeconds: 12
  });
});

test("restarts when the song changes even if the phase did not", () => {
  assert.deepEqual(
    resolveSongPlaybackIntent(
      snapshot({ phase: "clip_playing", songCursor: 0 }),
      snapshot({ phase: "clip_playing", songCursor: 1 })
    ),
    { kind: "play", seekToSeconds: 12 }
  );
});

test("seeks to revealStart when the host reveals the answer", () => {
  assert.deepEqual(
    resolveSongPlaybackIntent(
      snapshot({ phase: "clip_paused" }),
      snapshot({ phase: "reveal" })
    ),
    { kind: "play", seekToSeconds: 40 }
  );
});

test("does not restart the cover on a re-render during reveal", () => {
  assert.deepEqual(
    resolveSongPlaybackIntent(
      snapshot({ phase: "reveal" }),
      snapshot({ phase: "reveal" })
    ),
    { kind: "none" }
  );
});

test("pauses when the host stops the clip", () => {
  assert.deepEqual(
    resolveSongPlaybackIntent(
      snapshot({ phase: "clip_playing" }),
      snapshot({ phase: "clip_paused" })
    ),
    { kind: "pause" }
  );
});

test("pauses when the set finishes", () => {
  assert.deepEqual(
    resolveSongPlaybackIntent(
      snapshot({ phase: "reveal" }),
      snapshot({ phase: "done" })
    ),
    { kind: "pause" }
  );
});

test("stops the clip at its end rather than at the end of the file", () => {
  assert.equal(hasReachedClipEnd(26.9, 27), false);
  assert.equal(hasReachedClipEnd(27, 27), true);
  assert.equal(hasReachedClipEnd(99, null), false);
});
