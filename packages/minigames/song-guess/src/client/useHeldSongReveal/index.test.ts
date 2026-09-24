import assert from "node:assert/strict";
import test from "node:test";

import type { SongGuessMinigameDisplayView } from "@wingnight/shared";

import {
  resolveHeldSongReveal,
  resolveLiveRevealView,
  resolveRenderedSongView,
  resolveSongRevealKey,
  type HeldSongReveal,
  type SongGuessRevealView
} from "./index.js";

const baseView = {
  minigame: "SONG_GUESS",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 2 },
  songsTotal: 4,
  replayUsed: false
} as const;

const revealView = (
  songCursor: number,
  revealedAtMs: number,
  verdictTitle = true
): SongGuessRevealView => ({
  ...baseView,
  songCursor,
  phase: "reveal",
  reveal: {
    title: "Creep",
    artist: "Radiohead",
    audioFileName: "creep.mp3",
    revealStart: 55,
    verdict: { title: verdictTitle, artist: true },
    pointsEarned: verdictTitle ? 2 : 1,
    revealedAtMs,
    expiresAtMs: revealedAtMs + 2000
  }
});

const rulingView: SongGuessMinigameDisplayView = {
  ...baseView,
  songCursor: 0,
  phase: "reveal",
  reveal: null
};

const nextSongView: SongGuessMinigameDisplayView = {
  ...baseView,
  songCursor: 1,
  phase: "idle",
  clip: { audioFileName: "billie-jean.mp3", clipStart: 8, clipEnd: 22 }
};

test("treats the reveal phase as live only once the card is on the view", () => {
  assert.equal(resolveLiveRevealView(rulingView), null);
  assert.equal(resolveLiveRevealView(nextSongView), null);
  assert.equal(resolveLiveRevealView(null), null);
  assert.notEqual(resolveLiveRevealView(revealView(0, 1_000)), null);
});

test("keys a reveal on its slot and its server stamp", () => {
  assert.equal(resolveSongRevealKey(revealView(0, 1_000)), "0:1000");
  assert.notEqual(
    resolveSongRevealKey(revealView(0, 1_000)),
    resolveSongRevealKey(revealView(0, 9_000))
  );
});

test("opens a fresh hold when a new reveal arrives", () => {
  const held = resolveHeldSongReveal(null, revealView(0, 1_000));

  assert.deepEqual(held, {
    key: "0:1000",
    view: revealView(0, 1_000),
    isExpired: false
  });
});

test("refreshes the card without restarting the hold when a verdict changes", () => {
  const first = revealView(0, 1_000);
  const held: HeldSongReveal = { key: "0:1000", view: first, isExpired: true };
  const reRuled = revealView(0, 1_000, false);
  const refreshed = resolveHeldSongReveal(held, reRuled);

  assert.equal(refreshed?.view, reRuled);
  assert.equal(refreshed?.isExpired, true);
  assert.equal(resolveHeldSongReveal(held, first), held);
});

test("keeps the hold when the live view moves on to the next song", () => {
  const held = resolveHeldSongReveal(null, revealView(0, 1_000));

  assert.equal(resolveHeldSongReveal(held, null), held);
});

test("renders the live card while the host is on the reveal", () => {
  const live = revealView(0, 1_000);
  const held: HeldSongReveal = { key: "0:1000", view: live, isExpired: true };

  assert.deepEqual(resolveRenderedSongView(live, held), { view: live, isHeld: false });
});

// The beat itself: the server has advanced, the TV has not — yet.
test("holds the card over the next song's screen until the window runs out", () => {
  const card = revealView(0, 1_000);
  const open: HeldSongReveal = { key: "0:1000", view: card, isExpired: false };
  const expired: HeldSongReveal = { ...open, isExpired: true };

  assert.deepEqual(resolveRenderedSongView(nextSongView, open), {
    view: card,
    isHeld: true
  });
  assert.deepEqual(resolveRenderedSongView(nextSongView, expired), {
    view: nextSongView,
    isHeld: false
  });
});

test("renders a later song's ruling screen once the hold has expired", () => {
  const stale: HeldSongReveal = {
    key: "0:1000",
    view: revealView(0, 1_000),
    isExpired: true
  };

  assert.deepEqual(resolveRenderedSongView(rulingView, stale), {
    view: rulingView,
    isHeld: false
  });
});

test("renders nothing held before any reveal has arrived", () => {
  assert.deepEqual(resolveRenderedSongView(nextSongView, null), {
    view: nextSongView,
    isHeld: false
  });
  assert.deepEqual(resolveRenderedSongView(null, null), { view: null, isHeld: false });
});
