import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  Phase,
  SESSION_MODES,
  resolveBestBettorPlayerIds,
  toRoleScopedSnapshotEnvelope,
  type SpectatorBetPick
} from "@wingnight/shared";

import {
  adjustTeamScore,
  advanceRoomStatePhase,
  assignPlayerToTeam,
  createTeam,
  getRoomStateSnapshot,
  placeSpectatorBet,
  readSpectatorBetRefusal,
  redoLastScoringMutation,
  resetGameToSetup,
  resetRoomState,
  setPendingMinigamePoints,
  setRoomStateGameConfig,
  setRoomStatePlayers,
  setRoomStateTeams,
  setWingParticipation,
  skipTurnBoundary,
  startQuickPlay
} from "./index.js";
import { getRoomState } from "./stateStore/index.js";
import {
  advanceToTeamTurn,
  advanceUntil,
  gameConfigFixture,
  setRoomStateTriviaPrompts,
  triviaPromptFixture
} from "./testHarness.js";

// The watchers' side bet over the room's real phase machine: two rounds (TRIVIA capped at 15, then
// GEO capped at 20 as the final round), two teams of two. Team 1 opens round 1, so players 3 and 4
// are the watchers on its turn — and players 1 and 2 on team 2's.

const setupNight = (): void => {
  setRoomStateGameConfig(gameConfigFixture);
  setRoomStatePlayers([
    { id: "player-1", name: "Alex" },
    { id: "player-2", name: "Caitlin" },
    { id: "player-3", name: "Rob" },
    { id: "player-4", name: "Dylan" }
  ]);
  createTeam("Team Alpha");
  createTeam("Team Beta");
  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-2", "team-1");
  assignPlayerToTeam("player-3", "team-2");
  assignPlayerToTeam("player-4", "team-2");
  setRoomStateTriviaPrompts(triviaPromptFixture);
};

const bets = () => getRoomStateSnapshot().spectatorBets;
const tally = () => getRoomStateSnapshot().betTallyByPlayerId;

// Plays the turn in hand to its results with the team scoring `points`.
const playTurnTo = (points: number): void => {
  advanceUntil(Phase.MINIGAME_PLAY, getRoomStateSnapshot().currentRound);

  if (points > 0) {
    const teamId = getRoomStateSnapshot().activeRoundTeamId ?? "";

    setPendingMinigamePoints({ [teamId]: points });
  }

  advanceRoomStatePhase();
  assert.equal(getRoomStateSnapshot().phase, Phase.TURN_RESULTS);
};

beforeEach(() => {
  resetRoomState();
  setupNight();
});

test("does open the window on the turn's line when the briefing opens", () => {
  advanceUntil(Phase.MINIGAME_INTRO, 1);

  assert.deepEqual(bets(), {
    turnKey: "1:0",
    teamId: "team-1",
    line: 7.5,
    baselinePoints: 0,
    status: "open",
    betsByPlayerId: {},
    bettorPlayerIds: [],
    betCount: 0,
    turnPoints: null,
    outcome: null
  });
});

test("does put the line on the final round's cap when the final round's briefing opens", () => {
  advanceToTeamTurn(Phase.MINIGAME_INTRO, 2, "team-2");

  assert.equal(bets()?.line, 10.5);
});

test("does keep the window open through the wings and close it when play starts", () => {
  advanceUntil(Phase.MINIGAME_INTRO, 1);
  placeSpectatorBet("player-3", "over");
  advanceUntil(Phase.EATING, 1);
  placeSpectatorBet("player-4", "under");

  assert.equal(bets()?.status, "open");
  assert.equal(bets()?.betCount, 2);

  advanceUntil(Phase.MINIGAME_PLAY, 1);

  assert.equal(bets()?.status, "closed");
  assert.equal(readSpectatorBetRefusal("player-3"), "closed");
  placeSpectatorBet("player-3", "under");
  assert.deepEqual(bets()?.betsByPlayerId, { "player-3": "over", "player-4": "under" });
});

test("does refuse a bet when it comes from the team that is playing", () => {
  advanceUntil(Phase.MINIGAME_INTRO, 1);

  assert.equal(readSpectatorBetRefusal("player-1"), "active_team");
  placeSpectatorBet("player-1", "over");
  assert.equal(bets()?.betCount, 0);
});

test("does refuse a bet when the face is not on the roster", () => {
  advanceUntil(Phase.MINIGAME_INTRO, 1);

  assert.equal(readSpectatorBetRefusal("player-99"), "not_seated");
  placeSpectatorBet("player-99", "over");
  assert.equal(bets()?.betCount, 0);
});

test("does let a watcher change their pick when the window is still open", () => {
  advanceUntil(Phase.MINIGAME_INTRO, 1);
  placeSpectatorBet("player-3", "over");
  placeSpectatorBet("player-3", "under");

  assert.deepEqual(bets()?.betsByPlayerId, { "player-3": "under" });
  assert.equal(bets()?.betCount, 1);
});

test("does settle OVER when the turn's score clears the line", () => {
  advanceUntil(Phase.MINIGAME_INTRO, 1);
  placeSpectatorBet("player-3", "over");
  placeSpectatorBet("player-4", "under");
  playTurnTo(9);

  assert.equal(bets()?.status, "settled");
  assert.equal(bets()?.turnPoints, 9);
  assert.equal(bets()?.outcome, "over");
});

test("does settle UNDER when the turn's score falls short of the line", () => {
  advanceUntil(Phase.MINIGAME_INTRO, 1);
  placeSpectatorBet("player-3", "over");
  playTurnTo(3);

  assert.equal(bets()?.turnPoints, 3);
  assert.equal(bets()?.outcome, "under");
});

test("does settle a push when a fractional score lands on the line and leave the tally alone", () => {
  advanceUntil(Phase.MINIGAME_INTRO, 1);
  placeSpectatorBet("player-3", "over");
  playTurnTo(7.5);

  assert.equal(bets()?.outcome, "push");

  advanceRoomStatePhase();

  assert.deepEqual(tally(), {});
});

test("does re-settle when an undo on the turn's results takes back the last score", () => {
  advanceUntil(Phase.MINIGAME_INTRO, 1);
  placeSpectatorBet("player-3", "over");
  advanceUntil(Phase.MINIGAME_PLAY, 1);
  setPendingMinigamePoints({ "team-1": 9 });
  setPendingMinigamePoints({ "team-1": 5 });
  advanceRoomStatePhase();

  assert.equal(bets()?.outcome, "under");

  redoLastScoringMutation();

  assert.equal(getRoomStateSnapshot().phase, Phase.TURN_RESULTS);
  assert.equal(bets()?.turnPoints, 9);
  assert.equal(bets()?.outcome, "over");
});

test("does settle team two's turn on its own points when team one already banked points this round", () => {
  advanceUntil(Phase.MINIGAME_INTRO, 1);
  playTurnTo(12);
  advanceRoomStatePhase();
  placeSpectatorBet("player-1", "over");
  playTurnTo(3);

  assert.deepEqual(getRoomStateSnapshot().pendingMinigamePointsByTeamId, { "team-1": 12, "team-2": 3 });
  assert.equal(bets()?.teamId, "team-2");
  assert.equal(bets()?.turnPoints, 3);
  assert.equal(bets()?.outcome, "under");
});

test("does settle on the points a team adds this turn when it carried pending points into it", () => {
  advanceUntil(Phase.MINIGAME_INTRO, 1);
  playTurnTo(0);
  // A team walking into its turn already holding points this round: whatever put them there, the
  // bet is on what the turn itself adds.
  getRoomState().pendingMinigamePointsByTeamId["team-2"] = 4;
  advanceRoomStatePhase();

  assert.equal(bets()?.baselinePoints, 4);

  placeSpectatorBet("player-1", "over");
  playTurnTo(10);

  assert.equal(bets()?.turnPoints, 6);
  assert.equal(bets()?.outcome, "under");
});

test("does apply the tally once when the results are left, whatever undo does after", () => {
  advanceUntil(Phase.MINIGAME_INTRO, 1);
  placeSpectatorBet("player-3", "over");
  placeSpectatorBet("player-4", "under");
  advanceUntil(Phase.MINIGAME_PLAY, 1);
  setPendingMinigamePoints({ "team-1": 9 });
  setPendingMinigamePoints({ "team-1": 2 });
  advanceRoomStatePhase();
  // Undo flips the result on the results screen, and only the frozen result counts.
  redoLastScoringMutation();
  redoLastScoringMutation();
  advanceRoomStatePhase();

  const afterFreeze = tally();

  assert.deepEqual(afterFreeze, {
    "player-3": { won: 1, played: 1 },
    "player-4": { won: 0, played: 1 }
  });
  assert.equal(getRoomStateSnapshot().phase, Phase.MINIGAME_INTRO);
  assert.equal(bets()?.turnKey, "1:1");

  // Nothing after the freeze reaches it again: an undo, a manual score, a second advance.
  redoLastScoringMutation();
  adjustTeamScore("team-1", 2);
  redoLastScoringMutation();
  advanceRoomStatePhase();

  assert.deepEqual(tally(), afterFreeze);
});

for (const skipFrom of [Phase.MINIGAME_INTRO, Phase.EATING, Phase.MINIGAME_PLAY] as const) {
  test(`does void the turn's bets and leave the tally alone when the host skips from ${skipFrom}`, () => {
    advanceUntil(Phase.MINIGAME_INTRO, 1);
    placeSpectatorBet("player-3", "over");
    advanceUntil(skipFrom, 1);

    if (skipFrom === Phase.MINIGAME_PLAY) {
      setPendingMinigamePoints({ "team-1": 12 });
    }

    skipTurnBoundary();

    // Team 2's briefing opens a fresh window; team 1's bet went nowhere.
    assert.equal(getRoomStateSnapshot().phase, Phase.MINIGAME_INTRO);
    assert.equal(bets()?.turnKey, "1:1");
    assert.deepEqual(bets()?.betsByPlayerId, {});
    assert.deepEqual(tally(), {});

    placeSpectatorBet("player-1", "under");
    advanceUntil(skipFrom, 1);
    skipTurnBoundary();

    // The round's last turn skipped: its bets stay up as void on the round's results.
    assert.equal(getRoomStateSnapshot().phase, Phase.ROUND_RESULTS);
    assert.equal(bets()?.status, "void");
    assert.deepEqual(tally(), {});
  });
}

test("does clear the bets and the tally when the host resets the night", () => {
  advanceUntil(Phase.MINIGAME_INTRO, 1);
  placeSpectatorBet("player-3", "over");
  playTurnTo(9);
  advanceRoomStatePhase();
  placeSpectatorBet("player-1", "over");

  assert.notDeepEqual(tally(), {});

  resetGameToSetup();

  assert.equal(bets(), null);
  assert.deepEqual(tally(), {});
});

test("does hold no bets and an empty tally when the room is created", () => {
  assert.equal(bets(), null);
  assert.deepEqual(tally(), {});
});

// A tiny seeded generator, so a failing sequence can be replayed by its seed.
const createRandom = (seed: number): (() => number) => {
  let state = seed;

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;

    return state / 4_294_967_296;
  };
};

type Step =
  | { kind: "advance" }
  | { kind: "points"; points: number }
  | { kind: "wings" }
  | { kind: "undo" }
  | { kind: "skip" }
  | { kind: "bet"; playerId: string; pick: SpectatorBetPick };

const PLAYER_IDS = ["player-1", "player-2", "player-3", "player-4"];

const createSteps = (seed: number): Step[] => {
  const random = createRandom(seed);
  const steps: Step[] = [];

  for (let index = 0; index < 80; index += 1) {
    const roll = random();

    if (roll < 0.35) {
      steps.push({ kind: "advance" });
    } else if (roll < 0.5) {
      steps.push({ kind: "points", points: Math.floor(random() * 16) });
    } else if (roll < 0.58) {
      steps.push({ kind: "wings" });
    } else if (roll < 0.66) {
      steps.push({ kind: "undo" });
    } else if (roll < 0.7) {
      steps.push({ kind: "skip" });
    } else {
      steps.push({
        kind: "bet",
        playerId: PLAYER_IDS[Math.floor(random() * PLAYER_IDS.length)],
        pick: random() < 0.5 ? "over" : "under"
      });
    }
  }

  return steps;
};

const runSteps = (steps: Step[], withBets: boolean): string[] => {
  resetRoomState();
  setupNight();

  const scoreTrail: string[] = [];

  for (const step of steps) {
    const room = getRoomStateSnapshot();

    if (step.kind === "advance") {
      advanceRoomStatePhase();
    } else if (step.kind === "points" && room.activeRoundTeamId !== null) {
      setPendingMinigamePoints({ [room.activeRoundTeamId]: Math.min(step.points, 15) });
    } else if (step.kind === "wings") {
      const team = room.teams.find((candidate) => candidate.id === room.activeRoundTeamId);

      setWingParticipation(team?.playerIds[0] ?? "", true);
    } else if (step.kind === "undo") {
      redoLastScoringMutation();
    } else if (step.kind === "skip") {
      skipTurnBoundary();
    } else if (step.kind === "bet" && withBets) {
      placeSpectatorBet(step.playerId, step.pick);
    }

    const after = getRoomStateSnapshot();

    scoreTrail.push(
      JSON.stringify([
        after.phase,
        after.teams.map((team) => team.totalScore),
        after.pendingMinigamePointsByTeamId,
        after.pendingWingPointsByTeamId
      ])
    );
  }

  return scoreTrail;
};

test("does never move a team's score when bets are placed through any sequence of a night", () => {
  let seedsThatSettledBets = 0;

  for (let seed = 1; seed <= 40; seed += 1) {
    const steps = createSteps(seed);
    const withBets = runSteps(steps, true);

    seedsThatSettledBets += Object.keys(tally()).length > 0 ? 1 : 0;

    const withoutBets = runSteps(steps, false);

    assert.deepEqual(withBets, withoutBets, `seed ${seed} moved a score through a bet`);
  }

  // The property means nothing unless bets were actually won and lost along the way.
  assert.ok(seedsThatSettledBets > 5, `only ${seedsThatSettledBets} sequences settled a bet`);
});

test("does keep every pick off the TV and the phones when the turn has not settled", () => {
  advanceUntil(Phase.MINIGAME_INTRO, 1);
  placeSpectatorBet("player-3", "over");
  placeSpectatorBet("player-4", "under");

  for (const phase of [Phase.MINIGAME_INTRO, Phase.MINIGAME_PLAY]) {
    advanceUntil(phase, 1);

    const room = getRoomStateSnapshot();
    const display = toRoleScopedSnapshotEnvelope("DISPLAY", room).roomState;
    const player = toRoleScopedSnapshotEnvelope("PLAYER", room).roomState;
    const host = toRoleScopedSnapshotEnvelope("HOST", room).roomState;

    for (const projected of [display.spectatorBets, player.spectatorBets]) {
      assert.deepEqual(projected?.betsByPlayerId, {});
      assert.deepEqual(projected?.bettorPlayerIds, []);
      assert.equal(projected?.betCount, 2);
    }

    // The host may see who is in, never which way.
    assert.deepEqual(host.spectatorBets?.bettorPlayerIds, ["player-3", "player-4"]);
    assert.deepEqual(host.spectatorBets?.betsByPlayerId, {});
    assert.doesNotMatch(JSON.stringify(display), /"over"|"under"/);
    assert.doesNotMatch(JSON.stringify(player), /"over"|"under"/);
  }

  advanceRoomStatePhase();

  const settled = toRoleScopedSnapshotEnvelope("DISPLAY", getRoomStateSnapshot()).roomState;

  assert.deepEqual(settled.spectatorBets?.betsByPlayerId, { "player-3": "over", "player-4": "under" });
});

test("does name the best bettor from the tally when the night reaches its final results", () => {
  // Round 1: team 1 scores 9 (over), team 2 scores 2 (under).
  advanceUntil(Phase.MINIGAME_INTRO, 1);
  placeSpectatorBet("player-3", "over");
  placeSpectatorBet("player-4", "under");
  playTurnTo(9);
  advanceRoomStatePhase();
  placeSpectatorBet("player-1", "under");
  placeSpectatorBet("player-2", "over");
  playTurnTo(2);
  advanceRoomStatePhase();
  // Round 2 opens on team 2: it scores 12 on a 10.5 line (over); team 1 scores 0 (under).
  advanceRoomStatePhase();
  placeSpectatorBet("player-1", "over");
  playTurnTo(12);
  advanceRoomStatePhase();
  placeSpectatorBet("player-3", "over");
  playTurnTo(0);
  advanceUntil(Phase.FINAL_RESULTS, 2);

  const room = getRoomStateSnapshot();

  assert.deepEqual(room.betTallyByPlayerId, {
    "player-1": { won: 2, played: 2 },
    "player-2": { won: 0, played: 1 },
    "player-3": { won: 1, played: 2 },
    "player-4": { won: 0, played: 1 }
  });
  assert.deepEqual(resolveBestBettorPlayerIds(room.betTallyByPlayerId, room.players), ["player-1"]);
  assert.equal(room.spectatorBets, null);
  // The side game never touched the board: the totals are the turns' points alone.
  assert.deepEqual(
    room.teams.map((team) => team.totalScore),
    [9, 14]
  );
});

test("does run the window over the briefing alone when the session is quick play", () => {
  resetRoomState();
  setRoomStateGameConfig(gameConfigFixture);
  setRoomStatePlayers([
    { id: "player-1", name: "Alex" },
    { id: "player-2", name: "Rob" }
  ]);
  setRoomStateTeams([
    { id: "team-1", name: "Molten Metal", playerIds: ["player-1"], totalScore: 0 },
    { id: "team-2", name: "Spice Girls", playerIds: ["player-2"], totalScore: 0 }
  ]);
  setRoomStateTriviaPrompts(triviaPromptFixture);
  startQuickPlay(
    [{ minigame: "TRIVIA" }],
    [
      { teamId: "team-1", playerIds: ["player-1"] },
      { teamId: "team-2", playerIds: ["player-2"] }
    ]
  );

  assert.equal(getRoomStateSnapshot().sessionMode, SESSION_MODES.QUICK_PLAY);
  assert.equal(bets()?.status, "open");
  // One game queued is the final round: its cap is the final round's.
  assert.equal(bets()?.line, 10.5);

  placeSpectatorBet("player-2", "under");
  advanceRoomStatePhase();

  assert.equal(getRoomStateSnapshot().phase, Phase.MINIGAME_PLAY);
  assert.equal(bets()?.status, "closed");
  assert.equal(readSpectatorBetRefusal("player-2"), "closed");

  advanceRoomStatePhase();

  assert.equal(bets()?.outcome, "under");
});
