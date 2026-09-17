import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveAnthemForRound,
  resolveAnthemIndexForRound,
  resolveNextTrackIndex,
  resolveTrackTitle
} from "./index.js";

const ANTHEMS = ["one.mp3", "two.mp3", "three.mp3"];

test("rotates anthems by round when the round count is within the list", () => {
  assert.equal(resolveAnthemForRound(ANTHEMS, 1), "one.mp3");
  assert.equal(resolveAnthemForRound(ANTHEMS, 2), "two.mp3");
  assert.equal(resolveAnthemForRound(ANTHEMS, 3), "three.mp3");
});

test("wraps to the top of the list when there are more rounds than anthems", () => {
  assert.equal(resolveAnthemForRound(ANTHEMS, 4), "one.mp3");
  assert.equal(resolveAnthemForRound(ANTHEMS, 5), "two.mp3");
});

// The determinism contract: a display refresh mid-MINIGAME_INTRO resolves from
// the same inputs and must land on the same track.
test("resolves the same anthem when called twice for the same round", () => {
  assert.equal(resolveAnthemForRound(ANTHEMS, 2), resolveAnthemForRound(ANTHEMS, 2));
});

test("returns the only anthem when a team has exactly one", () => {
  assert.equal(resolveAnthemForRound(["only.mp3"], 7), "only.mp3");
});

test("falls back to the first anthem when the round is pre-game or unknown", () => {
  assert.equal(resolveAnthemForRound(ANTHEMS, 0), "one.mp3");
  assert.equal(resolveAnthemForRound(ANTHEMS, null), "one.mp3");
});

test("returns null when a team has no anthems at all", () => {
  assert.equal(resolveAnthemForRound([], 1), null);
  assert.equal(resolveAnthemForRound(null, 1), null);
});

// The index is what the server stores in `musicPlayback.trackIndex`, so it has
// to agree with the filename selector above rather than merely resemble it.
test("resolves an anthem index that agrees with the anthem it selects", () => {
  for (const round of [null, 0, 1, 2, 3, 4, 5, 9]) {
    const index = resolveAnthemIndexForRound(ANTHEMS.length, round);

    assert.equal(ANTHEMS[index], resolveAnthemForRound(ANTHEMS, round));
  }
});

test("resolves an anthem index of zero when the team has no anthems", () => {
  assert.equal(resolveAnthemIndexForRound(0, 4), 0);
});

test("advances the track cursor sequentially and wraps at the end", () => {
  assert.equal(resolveNextTrackIndex(0, 3), 1);
  assert.equal(resolveNextTrackIndex(1, 3), 2);
  assert.equal(resolveNextTrackIndex(2, 3), 0);
});

test("holds the track cursor at zero when there are no tracks", () => {
  assert.equal(resolveNextTrackIndex(0, 0), 0);
});

test("derives a title by stripping the ordering prefix and the extension", () => {
  assert.equal(resolveTrackTitle("01-hot-in-herre.mp3"), "Hot In Herre");
});

test("accepts the underscore and space spellings of the ordering prefix", () => {
  assert.equal(resolveTrackTitle("02_lose_yourself.mp3"), "Lose Yourself");
  assert.equal(resolveTrackTitle("03 shake it off.mp3"), "Shake It Off");
});

// Whatever casing the host typed in the rest of a word survives, so an acronym
// is not mangled into a word.
test("capitalizes only the first letter of each word", () => {
  assert.equal(resolveTrackTitle("04-TNT.mp3"), "TNT");
  assert.equal(resolveTrackTitle("05-dj-KHALED.mp3"), "Dj KHALED");
});

test("keeps a title that carries no ordering prefix", () => {
  assert.equal(resolveTrackTitle("thunderstruck.mp3"), "Thunderstruck");
});

test("handles the uppercase extension a host's downloader produced", () => {
  assert.equal(resolveTrackTitle("01-Track.MP3"), "Track");
});

// A bare number is a title of sorts, and beats showing nothing.
test("keeps a filename that is nothing but a track number", () => {
  assert.equal(resolveTrackTitle("01.mp3"), "01");
});

// `loadLobbyPlaylist` takes whatever MP3s are in the directory, so a filename
// with nothing left after the prefix strip is reachable.
test("falls back to the unstripped name when nothing survives the strip", () => {
  assert.equal(resolveTrackTitle("01-.mp3"), "01");
});
