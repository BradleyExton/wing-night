import assert from "node:assert/strict";
import test from "node:test";

import { MUSIC_PLAYBACK_SOURCES, Phase } from "@wingnight/shared";

import { createInitialRoomState } from "../createInitialRoomState/index.js";
import { resolveMusicForPhase, resolveMusicTrackList, resolveStrictLeaderTeamId } from "./index.js";

const buildState = () => {
  const state = createInitialRoomState();

  state.teams = [
    { id: "team-a", name: "A", playerIds: [], totalScore: 3, anthems: ["a1.mp3", "a2.mp3"] },
    { id: "team-b", name: "B", playerIds: [], totalScore: 5, anthems: ["b1.mp3"] },
    { id: "team-c", name: "C", playerIds: [], totalScore: 1, anthems: [] }
  ];
  state.turnOrderTeamIds = ["team-a", "team-b", "team-c"];
  state.currentRound = 2;
  state.roundTurnCursor = 1;
  state.activeRoundTeamId = "team-a";
  state.lobbyPlaylist = ["lobby.mp3"];
  state.eatingPlaylist = ["e1.mp3", "e2.mp3"];

  return state;
};

test("does crown the one team strictly ahead and nobody on a tie", () => {
  assert.equal(
    resolveStrictLeaderTeamId([
      { id: "x", totalScore: 2 },
      { id: "y", totalScore: 4 }
    ]),
    "y"
  );
  assert.equal(
    resolveStrictLeaderTeamId([
      { id: "x", totalScore: 4 },
      { id: "y", totalScore: 4 }
    ]),
    null
  );
  assert.equal(resolveStrictLeaderTeamId([]), null);
});

test("does put the eating playlist under EATING, on the turn's track", () => {
  const music = resolveMusicForPhase(buildState(), Phase.EATING);

  // Round 2, second turn, three teams a round: the night's fourth turn opens on track 4 mod 2.
  assert.deepEqual(music, {
    source: MUSIC_PLAYBACK_SOURCES.EATING,
    trackFileName: "e1.mp3",
    trackIndex: 0,
    trackCount: 2,
    isPlaying: true
  });
});

test("does play the active team's anthem at the briefing and name the team", () => {
  const music = resolveMusicForPhase(buildState(), Phase.MINIGAME_INTRO);

  assert.equal(music?.source, MUSIC_PLAYBACK_SOURCES.ANTHEM);
  assert.equal(music?.anthemTeamId, "team-a");
  // Round two plays the team's second anthem.
  assert.equal(music?.trackFileName, "a2.mp3");
});

test("does play the leader's anthem on the results screens, not the active team's", () => {
  const roundResults = resolveMusicForPhase(buildState(), Phase.ROUND_RESULTS);
  const finalResults = resolveMusicForPhase(buildState(), Phase.FINAL_RESULTS);

  assert.equal(roundResults?.anthemTeamId, "team-b");
  assert.equal(roundResults?.trackFileName, "b1.mp3");
  assert.equal(finalResults?.anthemTeamId, "team-b");
});

test("does stay silent on the results when the top is tied or the leader has no anthem", () => {
  const tied = buildState();

  tied.teams[0]!.totalScore = 5;
  assert.equal(resolveMusicForPhase(tied, Phase.ROUND_RESULTS), null);

  const anthemless = buildState();

  anthemless.teams[2]!.totalScore = 9;
  assert.equal(resolveMusicForPhase(anthemless, Phase.ROUND_RESULTS), null);
});

test("does stay silent under play and the turn results", () => {
  assert.equal(resolveMusicForPhase(buildState(), Phase.MINIGAME_PLAY), null);
  assert.equal(resolveMusicForPhase(buildState(), Phase.TURN_RESULTS), null);
});

test("does re-read an anthem's list from the team it names, and the active team's when unnamed", () => {
  const state = buildState();

  assert.deepEqual(
    resolveMusicTrackList(state, { source: MUSIC_PLAYBACK_SOURCES.ANTHEM, anthemTeamId: "team-b" }),
    ["b1.mp3"]
  );
  assert.deepEqual(resolveMusicTrackList(state, { source: MUSIC_PLAYBACK_SOURCES.ANTHEM }), [
    "a1.mp3",
    "a2.mp3"
  ]);
  assert.deepEqual(resolveMusicTrackList(state, { source: MUSIC_PLAYBACK_SOURCES.EATING }), [
    "e1.mp3",
    "e2.mp3"
  ]);
});
