import assert from "node:assert/strict";
import test from "node:test";

import { Phase, type GameConfigFile } from "@wingnight/shared";

import {
  advanceRoomStatePhase,
  assignPlayerToTeam,
  createTeam,
  createInitialRoomState,
  getRoomStateSnapshot,
  resetRoomState,
  setPendingMinigamePoints,
  setRoomStateGameConfig,
  setWingParticipation,
  setRoomStatePlayers
} from "./index.js";

const gameConfigFixture: GameConfigFile = {
  name: "Fixture Config",
  rounds: [
    {
      round: 1,
      label: "Warm Up",
      sauce: "Frank's",
      pointsPerPlayer: 2,
      minigame: "TRIVIA"
    },
    {
      round: 2,
      label: "Medium",
      sauce: "Buffalo",
      pointsPerPlayer: 3,
      minigame: "GEO"
    }
  ],
  minigameScoring: {
    defaultMax: 15,
    finalRoundMax: 20
  },
  timers: {
    eatingSeconds: 120,
    triviaSeconds: 30,
    geoSeconds: 45,
    drawingSeconds: 60
  }
};

const setupValidTeamsAndAssignments = (): void => {
  setRoomStateGameConfig(gameConfigFixture);
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" }
  ]);
  createTeam("Team Alpha");
  createTeam("Team Beta");
  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-2", "team-2");
};

const advanceToEatingPhase = (): void => {
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
};

const advanceToMinigamePlayPhase = (): void => {
  advanceToEatingPhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
};

const advanceToFinalRoundMinigamePlayPhase = (): void => {
  advanceToMinigamePlayPhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
};

test("createInitialRoomState returns setup defaults", () => {
  assert.deepEqual(createInitialRoomState(), {
    phase: Phase.SETUP,
    currentRound: 0,
    totalRounds: 3,
    players: [],
    teams: [],
    gameConfig: null,
    currentRoundConfig: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {}
  });
});

test("getRoomStateSnapshot returns a safe clone", () => {
  resetRoomState();

  const firstSnapshot = getRoomStateSnapshot();
  firstSnapshot.players.push({ id: "p1", name: "Player One" });

  const secondSnapshot = getRoomStateSnapshot();

  assert.equal(secondSnapshot.players.length, 0);
});

test("advanceRoomStatePhase transitions setup to intro", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  const nextState = advanceRoomStatePhase();

  assert.equal(nextState.phase, Phase.INTRO);
  assert.equal(nextState.currentRound, 0);
});

test("advanceRoomStatePhase sets currentRound to 1 on INTRO -> ROUND_INTRO", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  advanceRoomStatePhase();
  const nextState = advanceRoomStatePhase();

  assert.equal(nextState.phase, Phase.ROUND_INTRO);
  assert.equal(nextState.currentRound, 1);
  assert.deepEqual(nextState.currentRoundConfig, gameConfigFixture.rounds[0]);
});

test("advanceRoomStatePhase preserves currentRound after round intro", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  const nextState = advanceRoomStatePhase();

  assert.equal(nextState.phase, Phase.EATING);
  assert.equal(nextState.currentRound, 1);
  assert.deepEqual(nextState.currentRoundConfig, gameConfigFixture.rounds[0]);
});

test("advanceRoomStatePhase is idempotent at FINAL_RESULTS", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  for (let step = 0; step < 25; step += 1) {
    advanceRoomStatePhase();
  }

  const finalSnapshot = getRoomStateSnapshot();

  assert.equal(finalSnapshot.phase, Phase.FINAL_RESULTS);
  assert.equal(finalSnapshot.currentRound, 2);
  assert.equal(finalSnapshot.currentRoundConfig, null);
});

test("advanceRoomStatePhase blocks SETUP -> INTRO until setup is valid", () => {
  resetRoomState();
  setRoomStateGameConfig(gameConfigFixture);
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" }
  ]);
  createTeam("Team Alpha");
  assignPlayerToTeam("player-1", "team-1");

  const blockedSnapshot = advanceRoomStatePhase();

  assert.equal(blockedSnapshot.phase, Phase.SETUP);
  assert.equal(blockedSnapshot.currentRound, 0);
});

test("advanceRoomStatePhase blocks SETUP -> INTRO when game config is missing", () => {
  resetRoomState();
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" }
  ]);
  createTeam("Team Alpha");
  createTeam("Team Beta");
  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-2", "team-2");

  const blockedSnapshot = advanceRoomStatePhase();

  assert.equal(blockedSnapshot.phase, Phase.SETUP);
  assert.equal(blockedSnapshot.currentRound, 0);
  assert.equal(blockedSnapshot.currentRoundConfig, null);
});

test("advanceRoomStatePhase increments round after ROUND_RESULTS when rounds remain", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  const nextState = advanceRoomStatePhase();

  assert.equal(nextState.phase, Phase.ROUND_INTRO);
  assert.equal(nextState.currentRound, 2);
  assert.deepEqual(nextState.currentRoundConfig, gameConfigFixture.rounds[1]);
});

test("advanceRoomStatePhase logs transition metadata", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  const originalConsoleWarn = console.warn;
  const logCalls: unknown[][] = [];

  console.warn = ((...args: unknown[]): void => {
    logCalls.push(args);
  }) as typeof console.warn;

  try {
    advanceRoomStatePhase();
  } finally {
    console.warn = originalConsoleWarn;
  }

  const transitionLog = logCalls.find(
    (args) => args[0] === "server:phaseTransition"
  );

  assert.ok(transitionLog);
  assert.deepEqual(transitionLog[1], {
    previousPhase: Phase.SETUP,
    nextPhase: Phase.INTRO,
    currentRound: 0
  });
});

test("setRoomStatePlayers stores a safe clone of player records", () => {
  resetRoomState();

  const nextPlayers = [{ id: "player-1", name: "Player One" }];
  const updatedSnapshot = setRoomStatePlayers(nextPlayers);

  assert.deepEqual(updatedSnapshot.players, nextPlayers);

  nextPlayers[0].name = "Changed Locally";
  const persistedSnapshot = getRoomStateSnapshot();

  assert.equal(persistedSnapshot.players[0].name, "Player One");
});

test("setRoomStateGameConfig stores a safe clone and updates totalRounds", () => {
  resetRoomState();

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

test("createTeam trims team names and ignores empty values", () => {
  resetRoomState();

  createTeam("  Team Alpha  ");
  createTeam("   ");

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.teams.length, 1);
  assert.equal(snapshot.teams[0].id, "team-1");
  assert.equal(snapshot.teams[0].name, "Team Alpha");
  assert.deepEqual(snapshot.teams[0].playerIds, []);
  assert.equal(snapshot.teams[0].totalScore, 0);
});

test("assignPlayerToTeam reassigns a player to only one team at a time", () => {
  resetRoomState();
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
  resetRoomState();
  setRoomStatePlayers([{ id: "player-1", name: "Player One" }]);
  createTeam("Team Alpha");

  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-1", null);

  const snapshot = getRoomStateSnapshot();

  assert.deepEqual(snapshot.teams[0].playerIds, []);
});

test("assignPlayerToTeam ignores unknown players and unknown teams", () => {
  resetRoomState();
  setRoomStatePlayers([{ id: "player-1", name: "Player One" }]);
  createTeam("Team Alpha");

  assignPlayerToTeam("missing-player", "team-1");
  assignPlayerToTeam("player-1", "missing-team");

  const snapshot = getRoomStateSnapshot();

  assert.deepEqual(snapshot.teams[0].playerIds, []);
});

test("setWingParticipation computes pending wing points per team during EATING", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  let snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.wingParticipationByPlayerId["player-1"], true);
  assert.equal(snapshot.pendingWingPointsByTeamId["team-1"], 2);
  assert.equal(snapshot.pendingWingPointsByTeamId["team-2"], 0);

  setWingParticipation("player-2", true);

  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingWingPointsByTeamId["team-1"], 2);
  assert.equal(snapshot.pendingWingPointsByTeamId["team-2"], 2);
});

test("setWingParticipation recomputes totals when a player is unchecked", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);
  setWingParticipation("player-1", false);

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.wingParticipationByPlayerId["player-1"], false);
  assert.equal(snapshot.pendingWingPointsByTeamId["team-1"], 0);
});

test("setWingParticipation ignores invalid mutations", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  setWingParticipation("player-1", true);
  let snapshot = getRoomStateSnapshot();
  assert.deepEqual(snapshot.wingParticipationByPlayerId, {});

  advanceToEatingPhase();
  setWingParticipation("missing-player", true);
  snapshot = getRoomStateSnapshot();
  assert.deepEqual(snapshot.wingParticipationByPlayerId, {});
});

test("setWingParticipation ignores updates for players not assigned to a team", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" },
    { id: "player-3", name: "Player Three" }
  ]);
  advanceToEatingPhase();
  const beforeMutation = getRoomStateSnapshot();

  setWingParticipation("player-3", true);

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.wingParticipationByPlayerId["player-3"], undefined);
  assert.deepEqual(
    snapshot.pendingWingPointsByTeamId,
    beforeMutation.pendingWingPointsByTeamId
  );
});

test("entering EATING clears wing participation from the previous round", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.EATING);
  assert.deepEqual(snapshot.wingParticipationByPlayerId, {});
  assert.deepEqual(snapshot.pendingWingPointsByTeamId, {});
});

test("setPendingMinigamePoints enforces default-round scoring cap", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToMinigamePlayPhase();

  setPendingMinigamePoints({ "team-1": 15 });
  let snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 15);

  setPendingMinigamePoints({ "team-1": 16 });
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 15);
});

test("setPendingMinigamePoints enforces final-round scoring cap", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToFinalRoundMinigamePlayPhase();

  assert.equal(getRoomStateSnapshot().currentRound, 2);

  setPendingMinigamePoints({ "team-1": 20 });
  let snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 20);

  setPendingMinigamePoints({ "team-1": 21 });
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 20);
});

test("applies wing and minigame points on MINIGAME_PLAY -> ROUND_RESULTS", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setPendingMinigamePoints({
    "team-1": 5,
    "team-2": 3
  });
  advanceRoomStatePhase();

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.ROUND_RESULTS);
  assert.equal(snapshot.teams[0].totalScore, 7);
  assert.equal(snapshot.teams[1].totalScore, 3);
});

test("does not double apply round points after leaving ROUND_RESULTS", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-1": 4 });
  advanceRoomStatePhase();
  const scoreAtRoundResults = getRoomStateSnapshot().teams[0].totalScore;

  advanceRoomStatePhase();
  const scoreAfterNextPhase = getRoomStateSnapshot().teams[0].totalScore;

  assert.equal(scoreAtRoundResults, 6);
  assert.equal(scoreAfterNextPhase, 6);
});

test("clears pending round score maps after leaving ROUND_RESULTS", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-1": 2 });
  advanceRoomStatePhase();
  advanceRoomStatePhase();

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.ROUND_INTRO);
  assert.deepEqual(snapshot.pendingWingPointsByTeamId, {});
  assert.deepEqual(snapshot.pendingMinigamePointsByTeamId, {});
});

test("applies scores cumulatively across rounds", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  advanceToEatingPhase();
  setWingParticipation("player-1", true);
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-1": 3 });
  advanceRoomStatePhase();
  advanceRoomStatePhase();

  advanceRoomStatePhase();
  setWingParticipation("player-1", true);
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-1": 4 });
  advanceRoomStatePhase();

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.ROUND_RESULTS);
  assert.equal(snapshot.teams[0].totalScore, 12);
});

test("logs score mutation metadata when applying round points", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-1": 6 });

  const originalConsoleWarn = console.warn;
  const logCalls: unknown[][] = [];

  console.warn = ((...args: unknown[]): void => {
    logCalls.push(args);
  }) as typeof console.warn;

  try {
    advanceRoomStatePhase();
  } finally {
    console.warn = originalConsoleWarn;
  }

  const scoreMutationLog = logCalls.find((args) => args[0] === "server:scoreMutation");

  assert.ok(scoreMutationLog);
  assert.deepEqual(scoreMutationLog[1], {
    teamId: "team-1",
    currentRound: 1,
    wingPoints: 2,
    minigamePoints: 6,
    roundPoints: 8,
    totalScore: 8
  });
});

test("createTeam is locked after leaving setup", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceRoomStatePhase();
  const teamsBeforeCreate = getRoomStateSnapshot().teams.length;

  createTeam("Team Alpha");

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.INTRO);
  assert.equal(snapshot.teams.length, teamsBeforeCreate);
});

test("assignPlayerToTeam is locked after leaving setup", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceRoomStatePhase();

  assignPlayerToTeam("player-1", "team-1");

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.INTRO);
  assert.deepEqual(snapshot.teams[0].playerIds, ["player-1"]);
});
