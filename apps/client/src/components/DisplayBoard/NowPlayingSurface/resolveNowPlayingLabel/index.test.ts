import assert from "node:assert/strict";
import test from "node:test";

import { MUSIC_PLAYBACK_SOURCES } from "@wingnight/shared";

import { resolveNowPlayingLabel } from "./index";

test("names the team whose anthem is playing", () => {
  assert.equal(
    resolveNowPlayingLabel(
      MUSIC_PLAYBACK_SOURCES.ANTHEM,
      true,
      "Thunderstruck",
      "Scorch Squad"
    ),
    "Scorch Squad anthem"
  );
});

// The sample pack names every anthem after its team, so this is what a fresh
// clone renders — the label must not simply repeat the title back.
test("drops the team from the label when the title already says it", () => {
  assert.equal(
    resolveNowPlayingLabel(
      MUSIC_PLAYBACK_SOURCES.ANTHEM,
      true,
      "Molten Metal Anthem",
      "Molten Metal"
    ),
    "Team anthem"
  );
});

test("ignores casing and punctuation when comparing title to team", () => {
  assert.equal(
    resolveNowPlayingLabel(
      MUSIC_PLAYBACK_SOURCES.ANTHEM,
      true,
      "HONKY-TONK HEAT anthem",
      "Honky Tonk Heat"
    ),
    "Team anthem"
  );
});

test("falls back to the generic anthem label with no team name", () => {
  assert.equal(
    resolveNowPlayingLabel(MUSIC_PLAYBACK_SOURCES.ANTHEM, true, "Blaze", null),
    "Team anthem"
  );
});

test("labels the lobby playlist by whether it is playing", () => {
  assert.equal(
    resolveNowPlayingLabel(MUSIC_PLAYBACK_SOURCES.LOBBY, true, "Hot In Herre", null),
    "Now playing"
  );
  assert.equal(
    resolveNowPlayingLabel(MUSIC_PLAYBACK_SOURCES.LOBBY, false, "Hot In Herre", null),
    "Paused"
  );
});
