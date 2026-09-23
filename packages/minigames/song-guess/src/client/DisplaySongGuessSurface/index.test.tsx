import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { marqueeBulbs } from "@wingnight/surface";
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

const revealView: SongGuessMinigameDisplayView = {
  ...baseView,
  phase: "reveal",
  reveal: {
    title: ANSWER_TITLE,
    artist: ANSWER_ARTIST,
    audioFileName: "smells-like-teen-spirit.mp3",
    revealStart: 45
  }
};

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
// must not be able to read the answer off it before the host reveals.
test("never renders the title or artist before the reveal", () => {
  for (const phase of ["idle", "clip_playing", "clip_paused"] as const) {
    const html = renderSurface(clipView(phase));

    assert.doesNotMatch(html, new RegExp(ANSWER_TITLE));
    assert.doesNotMatch(html, new RegExp(ANSWER_ARTIST));
  }
});

test("shows the title and original artist on reveal", () => {
  const html = renderSurface(revealView);

  assert.match(html, new RegExp(ANSWER_TITLE));
  assert.match(html, new RegExp(ANSWER_ARTIST));
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

// Every other display marquee hangs the dotted bulb ring inside its gold
// border; three of them were copied without it and had it restored at T5.2.
// A new marquee arriving without one would recreate that bug exactly.
test("does hang the shared bulb ring on the marquee", () => {
  assert.ok(renderSurface(clipView("idle")).includes(marqueeBulbs));
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
      serverOrigin={null}
    />
  );

  assert.match(html, /Song 2 of 4/);
});
