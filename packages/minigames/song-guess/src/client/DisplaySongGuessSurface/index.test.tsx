import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { SongGuessMinigameDisplayView } from "@wingnight/shared";

import { DisplaySongGuessSurface } from "./index.js";

const ANSWER_TITLE = "Smells Like Teen Spirit";
const ANSWER_ARTIST = "Nirvana";

const baseView = {
  minigame: "SONG_GUESS",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 4, "team-2": 2 },
  songCursor: 1,
  songsTotal: 4,
  replayUsed: false
} as const;

const clipView = (
  phase: "idle" | "clip_playing" | "clip_paused"
): SongGuessMinigameDisplayView => ({
  ...baseView,
  phase,
  clip: {
    audioFileName: "smells-like-teen-spirit.mp3",
    clipStart: 12.5,
    clipEnd: 27
  }
});

// The host has opened the ruling and has not finished it.
const rulingView: SongGuessMinigameDisplayView = {
  ...baseView,
  phase: "reveal",
  reveal: null
};

const revealViewWith = (
  verdict: { title: boolean; artist: boolean },
  pointsEarned: number
): SongGuessMinigameDisplayView => ({
  ...baseView,
  phase: "reveal",
  reveal: {
    title: ANSWER_TITLE,
    artist: ANSWER_ARTIST,
    audioFileName: "smells-like-teen-spirit.mp3",
    revealStart: 45,
    verdict,
    pointsEarned,
    revealedAtMs: 1_000,
    expiresAtMs: 3_000
  }
});

const revealView = revealViewWith({ title: true, artist: true }, 2);

const renderSurface = (
  minigameDisplayView: SongGuessMinigameDisplayView | null,
  phase: "intro" | "play" = "play"
): string => {
  return renderToStaticMarkup(
    <DisplaySongGuessSurface
      phase={phase}
      minigameType="SONG_GUESS"
      minigameDisplayView={minigameDisplayView}
      activeTeamName="Team Heat"
      clock={null}
      clockLine={null}
      serverOrigin="http://localhost:3000"
    />
  );
};

test("counts the song the room is on", () => {
  assert.match(renderSurface(clipView("idle")), /Song 2 of 4/);
});

test("prompts the room to listen while the clip is queued or playing", () => {
  assert.match(renderSurface(clipView("idle")), /Listen closely/);
  assert.match(renderSurface(clipView("clip_playing")), /Listen closely/);
});

test("switches to the lock-in prompt when the host pauses", () => {
  const html = renderSurface(clipView("clip_paused"));

  assert.match(html, /Lock in your answers/);
  assert.doesNotMatch(html, /Listen closely/);
});

// The whole point of the answer-safe projection: a player looking at the TV
// must not be able to read the answer off it before the host has ruled on
// both halves — the ruling screen included.
test("never renders the title or artist before the ruling is complete", () => {
  for (const view of [
    clipView("idle"),
    clipView("clip_playing"),
    clipView("clip_paused"),
    rulingView
  ]) {
    const html = renderSurface(view);

    assert.doesNotMatch(html, new RegExp(ANSWER_TITLE));
    assert.doesNotMatch(html, new RegExp(ANSWER_ARTIST));
  }
});

test("says the ruling is coming while the host is still marking", () => {
  const html = renderSurface(rulingView);

  assert.match(html, /data-song-guess-ruling/);
  assert.match(html, /And the ruling is/);
  assert.doesNotMatch(html, /data-song-guess-reveal/);
});

test("shows the title and original artist once both halves are ruled", () => {
  const html = renderSurface(revealView);

  assert.match(html, /data-song-guess-reveal/);
  assert.match(html, new RegExp(ANSWER_TITLE));
  assert.match(html, new RegExp(ANSWER_ARTIST));
});

// The react half of the beat: each ruling as a hit or a miss, and what the
// song was worth — this song's points, never the running total.
test("marks each half a hit or a miss with the points the song earned", () => {
  const html = renderSurface(revealViewWith({ title: true, artist: false }, 1));

  assert.match(html, /data-song-guess-verdict="hit"/);
  assert.match(html, /data-song-guess-verdict="miss"/);
  assert.match(html, /\+1 point this song/);
  assert.doesNotMatch(html, /\+4/);
});

test("says when the song earned nothing", () => {
  const html = renderSurface(revealViewWith({ title: false, artist: false }, 0));

  assert.match(html, /No points this song/);
  assert.doesNotMatch(html, /\+\d/);
});

// Under react-dom/server no effect runs, so nothing is ever held: the card
// that renders is the live one.
test("renders the live card, not a held one, on a static render", () => {
  assert.doesNotMatch(renderSurface(revealView), /data-song-guess-reveal-held/);
});

// The marquee is the surface's chrome for the whole of the play phase, so the
// screen that closes the set still names the team whose set it was — the room
// wants to know who just finished, the way TRIVIA's marquee keeps naming a team
// under "Turn complete". What this test has always actually guarded is the
// SCORES: they go up at the end of the round and never on this surface, so no
// `+N` reaches the TV even though the view carries the pending points.
test("closes the set without putting scores on the TV", () => {
  const html = renderSurface({ ...baseView, phase: "done" });

  assert.match(html, /That&#x27;s the set/);
  assert.match(html, /Team Heat/);
  assert.doesNotMatch(html, /\+\d/);
});

// ADR-0006: the marquee is one shared component, not a container each game
// copies and a ring each copy could forget. This pins that the surface hangs
// THAT sign and not a private one — the drift the bulb-ring test used to catch.
test("does hang the shared neon marquee", () => {
  assert.ok(renderSurface(clipView("idle")).includes("data-neon-marquee"));
});

// SONG_GUESS was the only one of the nine displays that never told the room
// whose turn it was.
test("names the active team on the marquee", () => {
  assert.match(renderSurface(clipView("idle")), /Team Heat/);
});

// The show's name lived in copy.ts and painted only on the intro screen. The
// marquee title is where the other displays carry it.
test("carries the show title on the marquee for the whole set", () => {
  for (const view of [clipView("clip_paused"), revealView]) {
    assert.match(renderSurface(view), /Who&#x27;s That Song/);
  }
});

// Moved out of the body and into the counter cell, which means the reveal —
// which never had it — now shows it too.
test("counts the set from the marquee through the reveal", () => {
  assert.match(renderSurface(revealView), /Song 2 of 4/);
});

test("renders the rules summary during the minigame intro", () => {
  const html = renderSurface(null, "intro");

  assert.match(html, /Who&#x27;s That Song/);
  assert.match(html, /who did it first/);
});

test("falls back to a waiting note when the view has not arrived", () => {
  assert.match(renderSurface(null), /Waiting for the host/);
});

// The element must exist for the whole surface lifetime so seeking between the
// clip and the reveal never has to re-create it mid-round.
test("always renders the audio element", () => {
  for (const html of [
    renderSurface(clipView("idle")),
    renderSurface(revealView),
    renderSurface(null)
  ]) {
    assert.match(html, /data-song-guess-audio/);
  }
});

// Resolving the src reads the server origin, which react-dom/server cannot do —
// so the markup must render without one rather than throwing.
test("renders with no server origin resolved yet", () => {
  const html = renderToStaticMarkup(
    <DisplaySongGuessSurface
      phase="play"
      minigameType="SONG_GUESS"
      minigameDisplayView={clipView("idle")}
      activeTeamName="Team Heat"
      clock={null}
      clockLine={null}
      serverOrigin={null}
    />
  );

  assert.match(html, /Song 2 of 4/);
});
