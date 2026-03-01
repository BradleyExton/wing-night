import assert from "node:assert/strict";
import test from "node:test";
import { Phase, type GameConfigFile, type RoomState, type Team } from "@wingnight/shared";

import { hostControlPanelCopy } from "../../copy";
import { selectHeaderContext } from "./index";

const gameConfigFixture: GameConfigFile = {
  name: "Fixture Config",
  rounds: [
    {
      round: 1,
      label: "Warm Up",
      sauce: "Frank's",
      pointsPerPlayer: 2,
      minigame: "TRIVIA"
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

const teamsFixture: Team[] = [
  {
    id: "team-alpha",
    name: "Team Alpha",
    playerIds: ["player-1"],
    totalScore: 10
  },
  {
    id: "team-beta",
    name: "Team Beta",
    playerIds: ["player-2"],
    totalScore: 8
  }
];

const teamNameByTeamId = new Map<string, string>([
  ["team-alpha", "Team Alpha"],
  ["team-beta", "Team Beta"]
]);

const buildSnapshot = (
  phase: Phase,
  overrides: Partial<RoomState> = {}
): RoomState => {
  const snapshot: RoomState = {
    phase,
    currentRound: 1,
    totalRounds: gameConfigFixture.rounds.length,
    players: [
      { id: "player-1", name: "Alex" },
      { id: "player-2", name: "Morgan" }
    ],
    teams: teamsFixture,
    gameConfig: gameConfigFixture,
    currentRoundConfig: gameConfigFixture.rounds[0],
    turnOrderTeamIds: teamsFixture.map((team) => team.id),
    roundTurnCursor: 0,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: teamsFixture[0]?.id ?? null,
    activeTurnTeamId: null,
    minigameHostView: null,
    minigameDisplayView: null,
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false,
    canAdvancePhase: true
  };

  return { ...snapshot, ...overrides };
};

test("returns waiting context when room state is missing", () => {
  const context = selectHeaderContext(null, teamNameByTeamId);

  assert.equal(context.phaseTitle, hostControlPanelCopy.headerWaitingTitle);
  assert.equal(context.phaseDescription, hostControlPanelCopy.headerWaitingDescription);
  assert.equal(context.roundLabel, hostControlPanelCopy.headerPreGameLabel);
  assert.equal(context.activeTeamName, null);
});

test("returns round-intro sauce and minigame context", () => {
  const context = selectHeaderContext(
    buildSnapshot(Phase.ROUND_INTRO, { currentRound: 2, totalRounds: 5 }),
    teamNameByTeamId
  );

  assert.equal(context.roundLabel, "Round 2 of 5");
  assert.equal(context.roundIntroSauce, "Frank's");
  assert.equal(context.roundIntroMinigame, "TRIVIA");
  assert.equal(context.activeTeamName, null);
});

test("prefers active-turn team in MINIGAME_PLAY and falls back to active-round team", () => {
  const fallbackContext = selectHeaderContext(
    buildSnapshot(Phase.MINIGAME_PLAY, {
      activeRoundTeamId: "team-beta",
      activeTurnTeamId: null
    }),
    teamNameByTeamId
  );

  assert.equal(fallbackContext.activeTeamName, "Team Beta");

  const priorityContext = selectHeaderContext(
    buildSnapshot(Phase.MINIGAME_PLAY, {
      activeRoundTeamId: "team-beta",
      activeTurnTeamId: "team-alpha"
    }),
    teamNameByTeamId
  );

  assert.equal(priorityContext.activeTeamName, "Team Alpha");
});

test("returns fallback team label when active team id is missing from team map", () => {
  const context = selectHeaderContext(
    buildSnapshot(Phase.EATING, { activeRoundTeamId: "missing-team-id" }),
    teamNameByTeamId
  );

  assert.equal(context.activeTeamName, hostControlPanelCopy.noAssignedTeamLabel);
});

test("does not expose active team context in non-turn phases", () => {
  const context = selectHeaderContext(
    buildSnapshot(Phase.FINAL_RESULTS, {
      activeRoundTeamId: "team-alpha",
      activeTurnTeamId: "team-beta"
    }),
    teamNameByTeamId
  );

  assert.equal(context.activeTeamName, null);
});
