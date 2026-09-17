import { Phase } from "@wingnight/shared";
import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveNextLobbyTrackIndex,
  shouldPlayLobbyPlaylist
} from "./index";

test("plays the lobby playlist at SETUP when the pack has tracks", () => {
  assert.equal(shouldPlayLobbyPlaylist(Phase.SETUP, true), true);
});

test("stays silent at SETUP when the host dropped no files in", () => {
  assert.equal(shouldPlayLobbyPlaylist(Phase.SETUP, false), false);
});

// Asserted across every phase the display can hold, so a rule narrowed to one
// specific successor phase goes red rather than leaving a bed under the game.
test("plays in no phase other than SETUP", () => {
  const nonSetupPhases = Object.values(Phase).filter(
    (phase) => phase !== Phase.SETUP
  );

  for (const phase of nonSetupPhases) {
    assert.equal(
      shouldPlayLobbyPlaylist(phase, true),
      false,
      `expected no lobby music at ${phase}`
    );
  }

  assert.equal(shouldPlayLobbyPlaylist(null, true), false);
});

test("advances one track at a time", () => {
  assert.equal(resolveNextLobbyTrackIndex(0, 3), 1);
  assert.equal(resolveNextLobbyTrackIndex(1, 3), 2);
});

test("loops back to the first track after the last one", () => {
  assert.equal(resolveNextLobbyTrackIndex(2, 3), 0);
});

test("stays on the single track of a one-file playlist", () => {
  assert.equal(resolveNextLobbyTrackIndex(0, 1), 0);
});

test("resolves to the top of an empty playlist rather than dividing by zero", () => {
  assert.equal(resolveNextLobbyTrackIndex(0, 0), 0);
});
