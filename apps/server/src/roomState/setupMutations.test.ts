import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { Phase } from "@wingnight/shared";

import {
  addPlayer,
  advanceRoomStatePhase,
  assignPlayerToTeam,
  autoAssignRemainingPlayers,
  createTeam,
  getRoomStateSnapshot,
  resetRoomState,
  setRoomStateGameConfig,
  setRoomStateMinigameContent,
  setRoomStateTeams,
  setRoomStatePlayers
} from "./index.js";
import {
  advanceToMinigamePlayPhase,
  gameConfigFixture,
  resolveHostPromptId,
  resolveTriviaHostView,
  setupValidTeamsAndAssignments,
  triviaPromptFixture
} from "./testHarness.js";

beforeEach(() => {
  resetRoomState();
});

test("setRoomStatePlayers stores a safe clone of player records", () => {
  const nextPlayers = [{ id: "player-1", name: "Player One" }];
  const updatedSnapshot = setRoomStatePlayers(nextPlayers);

  assert.deepEqual(updatedSnapshot.players, nextPlayers);

  nextPlayers[0].name = "Changed Locally";
  const persistedSnapshot = getRoomStateSnapshot();

  assert.equal(persistedSnapshot.players[0].name, "Player One");
});

test("setRoomStateTeams stores a safe clone of team records", () => {
  const nextTeams = [
    { id: "team-1", name: "Team One", playerIds: ["player-1"], totalScore: 0 }
  ];
  const updatedSnapshot = setRoomStateTeams(nextTeams);

  assert.deepEqual(updatedSnapshot.teams, nextTeams);

  nextTeams[0].name = "Changed Locally";
  const persistedSnapshot = getRoomStateSnapshot();

  assert.equal(persistedSnapshot.teams[0].name, "Team One");
});

test("setRoomStateGameConfig stores a safe clone and updates totalRounds", () => {
  const nextConfig = structuredClone(gameConfigFixture);
  const updatedSnapshot = setRoomStateGameConfig(nextConfig);

  assert.equal(updatedSnapshot.gameConfig?.name, gameConfigFixture.name);
  assert.equal(updatedSnapshot.totalRounds, 2);
  assert.equal(updatedSnapshot.currentRoundConfig, null);
  assert.deepEqual(updatedSnapshot.pendingMinigamePointsByTeamId, {});

  nextConfig.name = "Changed Locally";
  nextConfig.rounds.push({
    round: 3,
    label: "Hot",
    sauce: "Ghost",
    pointsPerPlayer: 4,
    minigame: "DRAWING"
  });

  const persistedSnapshot = getRoomStateSnapshot();

  assert.equal(persistedSnapshot.gameConfig?.name, gameConfigFixture.name);
  assert.equal(persistedSnapshot.totalRounds, 2);
  assert.equal(persistedSnapshot.gameConfig?.rounds.length, 2);
  assert.equal(persistedSnapshot.currentRoundConfig, null);
  assert.deepEqual(persistedSnapshot.pendingMinigamePointsByTeamId, {});
});

test("setRoomStateMinigameContent stores a safe clone of trivia prompts", () => {
  const nextPrompts = structuredClone(triviaPromptFixture);
  setRoomStateMinigameContent("TRIVIA", {
    prompts: nextPrompts
  });

  nextPrompts[0].question = "Changed Locally";
  setupValidTeamsAndAssignments();
  advanceToMinigamePlayPhase();
  const persistedSnapshot = getRoomStateSnapshot();

  assert.equal(resolveHostPromptId(persistedSnapshot), "prompt-1");
  assert.equal(
    resolveTriviaHostView(persistedSnapshot.minigameHostView)?.currentPrompt?.question,
    "Question 1?"
  );
});

test("createTeam trims team names and ignores empty values", () => {
  createTeam("  Team Alpha  ");
  createTeam("   ");

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.teams.length, 1);
  assert.equal(snapshot.teams[0].id, "team-1");
  assert.equal(snapshot.teams[0].name, "Team Alpha");
  assert.deepEqual(snapshot.teams[0].playerIds, []);
  assert.equal(snapshot.teams[0].totalScore, 0);
});

test("createTeam appends after preset team shells", () => {
  setRoomStateTeams([
    { id: "team-1", name: "Preset Team One", playerIds: [], totalScore: 0 },
    { id: "team-2", name: "Preset Team Two", playerIds: [], totalScore: 0 }
  ]);

  createTeam("Late Add Team");

  const snapshot = getRoomStateSnapshot();

  assert.deepEqual(snapshot.teams, [
    { id: "team-1", name: "Preset Team One", playerIds: [], totalScore: 0 },
    { id: "team-2", name: "Preset Team Two", playerIds: [], totalScore: 0 },
    { id: "team-3", name: "Late Add Team", playerIds: [], totalScore: 0 }
  ]);
});

test("addPlayer trims names and allocates the next player id", () => {
  setRoomStatePlayers([{ id: "player-2", name: "Existing Player" }]);

  addPlayer("  New Player  ");
  addPlayer("   ");

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.players.length, 2);
  assert.deepEqual(snapshot.players[1], {
    id: "player-3",
    name: "New Player"
  });
});

test("addPlayer ignores updates outside setup", () => {
  setupValidTeamsAndAssignments();
  advanceRoomStatePhase();

  addPlayer("Late Player");

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.INTRO);
  assert.equal(snapshot.players.some((player) => player.name === "Late Player"), false);
});

test("assignPlayerToTeam reassigns a player to only one team at a time", () => {
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" }
  ]);
  createTeam("Team Alpha");
  createTeam("Team Beta");

  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-1", "team-2");

  const snapshot = getRoomStateSnapshot();

  assert.deepEqual(snapshot.teams[0].playerIds, []);
  assert.deepEqual(snapshot.teams[1].playerIds, ["player-1"]);
});

test("assignPlayerToTeam supports unassigning via null teamId", () => {
  setRoomStatePlayers([{ id: "player-1", name: "Player One" }]);
  createTeam("Team Alpha");

  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-1", null);

  const snapshot = getRoomStateSnapshot();

  assert.deepEqual(snapshot.teams[0].playerIds, []);
});

test("assignPlayerToTeam ignores unknown players and unknown teams", () => {
  setRoomStatePlayers([{ id: "player-1", name: "Player One" }]);
  createTeam("Team Alpha");

  assignPlayerToTeam("missing-player", "team-1");
  assignPlayerToTeam("player-1", "missing-team");

  const snapshot = getRoomStateSnapshot();

  assert.deepEqual(snapshot.teams[0].playerIds, []);
});

test("autoAssignRemainingPlayers balances only unassigned players across teams", () => {
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" },
    { id: "player-3", name: "Player Three" },
    { id: "player-4", name: "Player Four" },
    { id: "player-5", name: "Player Five" }
  ]);
  createTeam("Team Alpha");
  createTeam("Team Beta");
  assignPlayerToTeam("player-1", "team-1");

  autoAssignRemainingPlayers();

  const snapshot = getRoomStateSnapshot();

  assert.deepEqual(snapshot.teams[0]?.playerIds, ["player-1", "player-3", "player-5"]);
  assert.deepEqual(snapshot.teams[1]?.playerIds, ["player-2", "player-4"]);
});

test("assignment setup helpers work with preset team shells", () => {
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" },
    { id: "player-3", name: "Player Three" }
  ]);
  setRoomStateTeams([
    { id: "team-1", name: "Preset Team One", playerIds: [], totalScore: 0 },
    { id: "team-2", name: "Preset Team Two", playerIds: [], totalScore: 0 }
  ]);

  assignPlayerToTeam("player-1", "team-1");
  autoAssignRemainingPlayers();

  const snapshot = getRoomStateSnapshot();

  assert.deepEqual(snapshot.teams, [
    {
      id: "team-1",
      name: "Preset Team One",
      playerIds: ["player-1", "player-3"],
      totalScore: 0
    },
    {
      id: "team-2",
      name: "Preset Team Two",
      playerIds: ["player-2"],
      totalScore: 0
    }
  ]);
});

test("autoAssignRemainingPlayers ignores updates outside setup", () => {
  setupValidTeamsAndAssignments();
  advanceRoomStatePhase();
  const beforeAutoAssign = getRoomStateSnapshot();

  autoAssignRemainingPlayers();

  const afterAutoAssign = getRoomStateSnapshot();

  assert.deepEqual(afterAutoAssign.teams, beforeAutoAssign.teams);
});
