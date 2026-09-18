import assert from "node:assert/strict";
import test from "node:test";

import type {
  SongGuessContentFile,
  SongGuessMinigameDisplayView,
  SongGuessMinigameHostView
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { songGuessMinigameId, songGuessRuntimePlugin } from "./index.js";
import { parseSongGuessContentFile } from "./content/index.js";
import { isSongGuessRules, resolveSongGuessRules } from "./rules/index.js";
import {
  DEFAULT_SONG_GUESS_SONGS_PER_TURN,
  type SongGuessRuntimeState
} from "./types/index.js";

const songFixture = (index: number): SongGuessContentFile["prompts"][number] => ({
  id: `song-${index}`,
  file: `song-${index}.mp3`,
  clipStart: index,
  clipEnd: index + 10,
  revealStart: index + 20,
  correctTitle: `Title ${index}`,
  correctArtist: `Artist ${index}`
});

const contentFixture: SongGuessContentFile = {
  prompts: Array.from({ length: 8 }, (_unused, index) => songFixture(index + 1))
};

type InitializeOverrides = Partial<{
  teamIds: string[];
  // This game never looks at the roster; JOUST is the one that does.
  players: [],
  teams: [],
  activeRoundTeamId: string | null;
  pointsMax: number;
  pendingPointsByTeamId: Record<string, number>;
  rules: SerializableValue | null;
  content: SerializableValue | null;
}>;

const initialize = (
  overrides: InitializeOverrides = {}
): SerializableValue | null => {
  return songGuessRuntimePlugin.initialize({
    teamIds: overrides.teamIds ?? ["team-1", "team-2"],
    // This game never looks at the roster; JOUST is the one that does.
    players: [],
    teams: [],
    activeRoundTeamId:
      overrides.activeRoundTeamId === undefined
        ? "team-1"
        : overrides.activeRoundTeamId,
    pointsMax: overrides.pointsMax ?? 15,
    pendingPointsByTeamId: overrides.pendingPointsByTeamId ?? {},
    rules: overrides.rules === undefined ? { songsPerTurn: 4 } : overrides.rules,
    content: overrides.content === undefined ? contentFixture : overrides.content
  });
};

const initializeState = (
  overrides: InitializeOverrides = {}
): SongGuessRuntimeState => {
  const state = initialize(overrides);

  assert.notEqual(state, null);
  return state as SongGuessRuntimeState;
};

const reduce = (
  state: SerializableValue,
  actionType: string,
  actionPayload: SerializableValue = {},
  options: Partial<{ pointsMax: number; content: SerializableValue | null }> = {}
): { state: SerializableValue; didMutate: boolean } => {
  return songGuessRuntimePlugin.reduceAction({
    state,
    envelope: { actionType, actionPayload },
    pointsMax: options.pointsMax ?? 15,
    rules: { songsPerTurn: 4 },
    content: options.content === undefined ? contentFixture : options.content
  });
};

const advanceTo = (
  state: SerializableValue,
  ...actions: string[]
): SerializableValue => {
  return actions.reduce<SerializableValue>((currentState, actionType) => {
    return reduce(currentState, actionType).state;
  }, state);
};

const hostViewOf = (state: SerializableValue): SongGuessMinigameHostView => {
  const view = songGuessRuntimePlugin.selectHostView({
    state,
    rules: { songsPerTurn: 4 },
    content: contentFixture
  });

  assert.notEqual(view, null);
  assert.equal(view?.minigame, "SONG_GUESS");
  return view as SongGuessMinigameHostView;
};

const displayViewOf = (state: SerializableValue): SongGuessMinigameDisplayView => {
  const view = songGuessRuntimePlugin.selectDisplayView({
    state,
    rules: { songsPerTurn: 4 },
    content: contentFixture
  });

  assert.notEqual(view, null);
  assert.equal(view?.minigame, "SONG_GUESS");
  return view as SongGuessMinigameDisplayView;
};

test("registers under the SONG_GUESS minigame id", () => {
  assert.equal(songGuessMinigameId, "SONG_GUESS");
  assert.equal(songGuessRuntimePlugin.id, "SONG_GUESS");
});

test("selects exactly songsPerTurn songs when the pack is large enough", () => {
  const state = initializeState();

  assert.equal(state.selectedSongIds.length, 4);
  assert.equal(new Set(state.selectedSongIds).size, 4);
  assert.equal(state.phase, "idle");
  assert.equal(state.songCursor, 0);
});

test("gives each team in the turn order a different setlist", () => {
  const first = initializeState({ activeRoundTeamId: "team-1" });
  const second = initializeState({ activeRoundTeamId: "team-2" });

  assert.deepEqual(
    first.selectedSongIds.filter((songId) => second.selectedSongIds.includes(songId)),
    []
  );
});

test("rehydrates the same setlist when a turn is initialized twice", () => {
  assert.deepEqual(
    initializeState().selectedSongIds,
    initializeState().selectedSongIds
  );
});

test("plays what the pack has when it holds fewer songs than songsPerTurn", () => {
  const state = initializeState({
    content: { prompts: [songFixture(1), songFixture(2)] }
  });

  assert.equal(state.selectedSongIds.length, 2);
});

test("returns null when the pack holds no songs at all", () => {
  assert.equal(initialize({ content: { prompts: [] } }), null);
  assert.equal(initialize({ content: null }), null);
});

test("defaults songsPerTurn when the round carries no rules block", () => {
  const state = initializeState({ rules: null });

  assert.equal(state.selectedSongIds.length, DEFAULT_SONG_GUESS_SONGS_PER_TURN);
});

test("moves from idle to clip_playing when the host plays the clip", () => {
  const result = reduce(initializeState(), "playClip");

  assert.equal(result.didMutate, true);
  assert.equal((result.state as SongGuessRuntimeState).phase, "clip_playing");
});

test("ignores a pause while nothing is playing", () => {
  const result = reduce(initializeState(), "pauseClip");

  assert.equal(result.didMutate, false);
});

test("pauses a playing clip into the guessing phase", () => {
  const state = advanceTo(initializeState(), "playClip");
  const result = reduce(state, "pauseClip");

  assert.equal(result.didMutate, true);
  assert.equal((result.state as SongGuessRuntimeState).phase, "clip_paused");
});

test("allows exactly one replay per song", () => {
  const paused = advanceTo(initializeState(), "playClip", "pauseClip");
  const replayed = reduce(paused, "replayClip");

  assert.equal(replayed.didMutate, true);
  assert.equal((replayed.state as SongGuessRuntimeState).replayUsed, true);
  assert.equal((replayed.state as SongGuessRuntimeState).phase, "clip_playing");

  const secondAttempt = reduce(
    advanceTo(replayed.state, "pauseClip"),
    "replayClip"
  );

  assert.equal(secondAttempt.didMutate, false);
});

test("restores the replay allowance on the next song", () => {
  const scored = advanceTo(
    initializeState(),
    "playClip",
    "pauseClip",
    "replayClip",
    "pauseClip",
    "triggerReveal",
    "nextSong"
  );

  assert.equal((scored as SongGuessRuntimeState).replayUsed, false);
  assert.equal((scored as SongGuessRuntimeState).songCursor, 1);
});

test("ignores a reveal that is not preceded by a pause", () => {
  assert.equal(reduce(initializeState(), "triggerReveal").didMutate, false);
  assert.equal(
    reduce(advanceTo(initializeState(), "playClip"), "triggerReveal").didMutate,
    false
  );
});

test("awards a point each for a correct title and artist", () => {
  const revealed = advanceTo(
    initializeState(),
    "playClip",
    "pauseClip",
    "triggerReveal"
  );
  const marked = reduce(
    reduce(revealed, "markTitle", { correct: true }).state,
    "markArtist",
    { correct: true }
  ).state;

  assert.equal(hostViewOf(marked).pendingPointsByTeamId["team-1"], 2);
});

test("takes the point back when the host changes a ruling", () => {
  const revealed = advanceTo(
    initializeState(),
    "playClip",
    "pauseClip",
    "triggerReveal"
  );
  const awarded = reduce(revealed, "markTitle", { correct: true }).state;
  const revoked = reduce(awarded, "markTitle", { correct: false }).state;

  assert.equal(hostViewOf(revoked).pendingPointsByTeamId["team-1"], 0);
  assert.equal(hostViewOf(revoked).currentScore.title, false);
});

test("ignores a repeated identical ruling", () => {
  const revealed = advanceTo(
    initializeState(),
    "playClip",
    "pauseClip",
    "triggerReveal"
  );
  const awarded = reduce(revealed, "markTitle", { correct: true }).state;

  assert.equal(reduce(awarded, "markTitle", { correct: true }).didMutate, false);
});

test("clamps pending points to the round maximum", () => {
  const revealed = advanceTo(
    initializeState({ pendingPointsByTeamId: { "team-1": 3 } }),
    "playClip",
    "pauseClip",
    "triggerReveal"
  );
  const marked = reduce(
    reduce(revealed, "markTitle", { correct: true }, { pointsMax: 3 }).state,
    "markArtist",
    { correct: true },
    { pointsMax: 3 }
  ).state;

  assert.equal(hostViewOf(marked).pendingPointsByTeamId["team-1"], 3);
});

test("ignores a mark outside the reveal phase", () => {
  assert.equal(
    reduce(initializeState(), "markTitle", { correct: true }).didMutate,
    false
  );
});

test("ignores a mark with a malformed payload", () => {
  const revealed = advanceTo(
    initializeState(),
    "playClip",
    "pauseClip",
    "triggerReveal"
  );

  assert.equal(reduce(revealed, "markTitle", {}).didMutate, false);
  assert.equal(reduce(revealed, "markTitle", { correct: "yes" }).didMutate, false);
  assert.equal(reduce(revealed, "markArtist", null).didMutate, false);
});

test("lands on done after the last song is revealed and advanced", () => {
  let state: SerializableValue = initializeState();

  for (let songIndex = 0; songIndex < 4; songIndex += 1) {
    state = advanceTo(state, "playClip", "pauseClip", "triggerReveal", "nextSong");
  }

  assert.equal((state as SongGuessRuntimeState).phase, "done");
  assert.equal(hostViewOf(state).phase, "done");
});

test("ignores every transport action once the set is done", () => {
  let state: SerializableValue = initializeState();

  for (let songIndex = 0; songIndex < 4; songIndex += 1) {
    state = advanceTo(state, "playClip", "pauseClip", "triggerReveal", "nextSong");
  }

  for (const actionType of [
    "playClip",
    "pauseClip",
    "replayClip",
    "triggerReveal",
    "nextSong",
    "skipSong"
  ]) {
    assert.equal(reduce(state, actionType).didMutate, false, actionType);
  }
});

test("skips a song from any phase before the answer is on screen", () => {
  for (const setup of [[], ["playClip"], ["playClip", "pauseClip"]]) {
    const state = advanceTo(initializeState(), ...setup);
    const skipped = reduce(state, "skipSong");

    assert.equal(skipped.didMutate, true);
    assert.equal((skipped.state as SongGuessRuntimeState).songCursor, 1);
    assert.equal((skipped.state as SongGuessRuntimeState).phase, "idle");
  }
});

test("scores nothing for a skipped song", () => {
  const skipped = reduce(initializeState(), "skipSong").state;

  assert.deepEqual((skipped as SongGuessRuntimeState).scoresBySongId, {});
});

test("ignores an unknown action type", () => {
  assert.equal(reduce(initializeState(), "dropTheBeat").didMutate, false);
});

test("ignores every action when the state is not song guess state", () => {
  assert.equal(reduce({ promptCursor: 0 }, "playClip").didMutate, false);
  assert.equal(songGuessRuntimePlugin.selectHostView({
    state: { promptCursor: 0 },
    rules: null,
    content: contentFixture
  }), null);
});

test("keeps the answer off the display until the host reveals it", () => {
  const state = initializeState();
  const currentSong = contentFixture.prompts.find(
    (prompt) => prompt.id === state.selectedSongIds[0]
  );

  assert.notEqual(currentSong, undefined);

  for (const phaseState of [
    state as SerializableValue,
    advanceTo(state, "playClip"),
    advanceTo(state, "playClip", "pauseClip")
  ]) {
    const serialized = JSON.stringify(displayViewOf(phaseState));

    assert.doesNotMatch(serialized, new RegExp(currentSong!.correctTitle));
    assert.doesNotMatch(serialized, new RegExp(currentSong!.correctArtist));
  }
});

test("puts the title and artist on the display only in the reveal phase", () => {
  const state = initializeState();
  const revealed = advanceTo(state, "playClip", "pauseClip", "triggerReveal");
  const view = displayViewOf(revealed);
  const currentSong = contentFixture.prompts.find(
    (prompt) => prompt.id === state.selectedSongIds[0]
  );

  assert.equal(view.phase, "reveal");
  assert.equal(
    view.phase === "reveal" ? view.reveal.title : null,
    currentSong?.correctTitle
  );
  assert.equal(
    view.phase === "reveal" ? view.reveal.artist : null,
    currentSong?.correctArtist
  );
});

test("hands the display the clip asset it needs to play the round", () => {
  const view = displayViewOf(advanceTo(initializeState(), "playClip"));

  assert.equal(view.phase, "clip_playing");
  assert.equal(
    view.phase === "clip_playing" ? view.clip.audioFileName.endsWith(".mp3") : false,
    true
  );
});

test("gives the host the answer and the clip timings throughout", () => {
  const view = hostViewOf(initializeState());

  assert.notEqual(view.currentSong, null);
  assert.equal(typeof view.currentSong?.correctTitle, "string");
  assert.equal(typeof view.currentSong?.clipStart, "number");
  assert.equal(view.songsTotal, 4);
});

test("replaces pending points when the host adjusts a score mid-turn", () => {
  const synced = songGuessRuntimePlugin.syncPendingPoints?.({
    state: initializeState(),
    pendingPointsByTeamId: { "team-1": 7 }
  });

  assert.equal(
    (synced as SongGuessRuntimeState).pendingPointsByTeamId["team-1"],
    7
  );
});

test("drops songs that a content reload removed from the pack", () => {
  const state = initializeState();
  const synced = songGuessRuntimePlugin.syncContent?.({
    state,
    rules: { songsPerTurn: 4 },
    content: { prompts: [songFixture(1)] }
  });

  assert.equal(
    (synced as SongGuessRuntimeState).selectedSongIds.every((songId) =>
      songId === "song-1"
    ),
    true
  );
});

test("accepts a well-formed rules block and rejects a malformed one", () => {
  assert.equal(isSongGuessRules({}), true);
  assert.equal(isSongGuessRules({ songsPerTurn: 6 }), true);
  assert.equal(isSongGuessRules({ songsPerTurn: 0 }), false);
  assert.equal(isSongGuessRules({ songsPerTurn: 2.5 }), false);
  assert.equal(isSongGuessRules([]), false);
  assert.equal(resolveSongGuessRules(null).songsPerTurn, 4);
});

test("throws with file context when the content file is not valid JSON", () => {
  assert.throws(
    () => parseSongGuessContentFile("{ nope", "/tmp/song-guess.json"),
    /Failed to parse song guess content at "\/tmp\/song-guess.json"/
  );
});

test("throws with the expected shape when the content file is the wrong shape", () => {
  assert.throws(
    () => parseSongGuessContentFile('{"prompts":[]}', "/tmp/song-guess.json"),
    /Invalid song guess content at "\/tmp\/song-guess.json"/
  );
});
