import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type {
  SongGuessMinigameHostView,
  SongGuessPhase,
  SongGuessTeamScore
} from "@wingnight/shared";

import { HostSongGuessSurface } from "./index.js";

const TEAM_NAMES = new Map([
  ["team-1", "Team Heat"],
  ["team-2", "Team Chill"]
]);

const hostView = (
  overrides: Partial<SongGuessMinigameHostView> = {}
): SongGuessMinigameHostView => ({
  minigame: "SONG_GUESS",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 3, "team-2": 1 },
  phase: "idle",
  songCursor: 0,
  songsTotal: 4,
  replayUsed: false,
  currentSong: {
    id: "song-1",
    audioFileName: "creep.mp3",
    clipStart: 22,
    clipEnd: 36,
    revealStart: 55,
    correctTitle: "Creep",
    correctArtist: "Radiohead",
    difficulty: "medium",
    hint: "Two guitar stabs before the chorus"
  },
  currentScore: { title: null, artist: null },
  scoresBySongId: {},
  ...overrides
});

const renderSurface = (
  view: SongGuessMinigameHostView | null,
  phase: "intro" | "play" = "play",
  canDispatchAction = true
): string => {
  return renderToStaticMarkup(
    <HostSongGuessSurface
      phase={phase}
      minigameType="SONG_GUESS"
      minigameHostView={view}
      activeTeamName="Team Heat"
      teamNameByTeamId={TEAM_NAMES}
      canDispatchAction={canDispatchAction}
      onDispatchAction={(): void => {}}
      serverOrigin={null}
      players={[]}
      teams={[]}
    />
  );
};

const buttonFor = (html: string, label: string): string | null => {
  const buttons = html.match(/<button[^>]*>[\s\S]*?<\/button>/g) ?? [];

  return buttons.find((button) => button.includes(label)) ?? null;
};

// Matches the ATTRIBUTE, not the word: every control carries
// `disabled:opacity-40` in its class list, so a substring check on "disabled"
// reports every button as disabled and quietly passes the whole suite.
const isDisabled = (html: string, label: string): boolean => {
  const button = buttonFor(html, label);

  assert.notEqual(button, null, `expected a "${label}" button`);
  return /<button[^>]*\sdisabled=""/.test(button ?? "");
};

const renderAtPhase = (phase: SongGuessPhase, extra = {}): string => {
  return renderSurface(hostView({ phase, ...extra }));
};

test("shows the answer to the host from the moment the song loads", () => {
  const html = renderAtPhase("idle");

  assert.match(html, /Creep/);
  assert.match(html, /Radiohead/);
  assert.match(html, /Song 1 of 4/);
});

test("surfaces the difficulty badge and hint when the pack supplies them", () => {
  const html = renderAtPhase("idle");

  assert.match(html, /medium/);
  assert.match(html, /Two guitar stabs/);
});

test("offers play but not pause before the clip starts", () => {
  const html = renderAtPhase("idle");

  assert.equal(isDisabled(html, "Play clip"), false);
  assert.equal(isDisabled(html, "Pause"), true);
});

test("offers pause while the clip is playing", () => {
  const html = renderAtPhase("clip_playing");

  assert.equal(isDisabled(html, "Pause"), false);
  assert.equal(isDisabled(html, "Play clip"), true);
});

test("labels play as resume once the host has paused mid-clip", () => {
  const html = renderAtPhase("clip_paused");

  assert.match(html, /Resume/);
  assert.equal(isDisabled(html, "Resume"), false);
});

test("enables reveal only once the clip is paused", () => {
  assert.equal(isDisabled(renderAtPhase("idle"), "Reveal answer"), true);
  assert.equal(isDisabled(renderAtPhase("clip_playing"), "Reveal answer"), true);
  assert.equal(isDisabled(renderAtPhase("clip_paused"), "Reveal answer"), false);
});

test("allows a replay while paused and refuses a second one", () => {
  assert.equal(isDisabled(renderAtPhase("clip_paused"), "Replay"), false);

  const spent = renderAtPhase("clip_paused", { replayUsed: true });

  assert.equal(isDisabled(spent, "Replay used"), true);
});

test("keeps replay unavailable outside the paused phase", () => {
  assert.equal(isDisabled(renderAtPhase("idle"), "Replay"), true);
  assert.equal(isDisabled(renderAtPhase("clip_playing"), "Replay"), true);
});

test("swaps reveal for the scoring deck and next song once revealed", () => {
  const html = renderAtPhase("reveal");

  assert.match(html, /data-song-guess-scoring/);
  assert.match(html, /Score this song/);
  assert.equal(isDisabled(html, "Next song"), false);
  assert.equal(buttonFor(html, "Reveal answer"), null);
});

test("hides the scoring deck until the answer is revealed", () => {
  for (const phase of ["idle", "clip_playing", "clip_paused"] as const) {
    assert.doesNotMatch(renderAtPhase(phase), /data-song-guess-scoring/);
  }
});

test("reflects a ruling the host has already made", () => {
  const currentScore: SongGuessTeamScore = { title: true, artist: false };
  const html = renderSurface(hostView({ phase: "reveal", currentScore }));

  assert.match(html, /aria-pressed="true"/);
});

test("offers the skip escape hatch before the answer is on screen", () => {
  assert.equal(isDisabled(renderAtPhase("idle"), "Skip song"), false);
  assert.equal(isDisabled(renderAtPhase("clip_playing"), "Skip song"), false);
  assert.equal(isDisabled(renderAtPhase("clip_paused"), "Skip song"), false);
  assert.equal(isDisabled(renderAtPhase("reveal"), "Skip song"), true);
});

test("tells the host the set is finished", () => {
  assert.match(renderAtPhase("done"), /advance the phase/);
});

test("lists every team's running total, not just the active one", () => {
  const html = renderAtPhase("idle");

  assert.match(html, /Team Heat/);
  assert.match(html, /Team Chill/);
  assert.match(html, /3 pts/);
  assert.match(html, /1 pt</);
});

test("disables every control when the host cannot act", () => {
  const html = renderSurface(hostView({ phase: "clip_paused" }), "play", false);

  assert.equal(isDisabled(html, "Resume"), true);
  assert.equal(isDisabled(html, "Reveal answer"), true);
  assert.equal(isDisabled(html, "Skip song"), true);
});

test("explains the round instead of showing controls during the intro", () => {
  const html = renderSurface(hostView(), "intro");

  assert.match(html, /Lounge covers/);
  assert.equal(buttonFor(html, "Play clip"), null);
});

test("points the host at the content pack when no song is loaded", () => {
  const html = renderSurface(hostView({ currentSong: null }));

  assert.match(html, /song-guess.json/);
});
