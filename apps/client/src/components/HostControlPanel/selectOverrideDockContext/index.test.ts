import assert from "node:assert/strict";
import test from "node:test";
import { Phase, type GameConfigFile, type RoomState } from "@wingnight/shared";

import {
  hasCustomTurnOrder,
  selectOverrideDockContext
} from "./index";

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

const buildSnapshot = (
  phase: Phase,
  overrides: Partial<RoomState> = {}
): RoomState => {
  const snapshot: RoomState = {
    phase,
    currentRound: 1,
    totalRounds: 1,
    players: [
      { id: "player-1", name: "Alex" },
      { id: "player-2", name: "Jordan" }
    ],
    teams: [
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
    ],
    gameConfig: gameConfigFixture,
    triviaPrompts: [],
    currentRoundConfig: gameConfigFixture.rounds[0],
    turnOrderTeamIds: ["team-alpha", "team-beta"],
    roundTurnCursor: 0,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: "team-alpha",
    activeTurnTeamId: null,
    currentTriviaPrompt: null,
    triviaPromptCursor: 0,
    minigameHostView: null,
    minigameDisplayView: null,
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false
  };

  return { ...snapshot, ...overrides };
};

test("dock is visible only in gameplay phases", () => {
  assert.equal(selectOverrideDockContext(null).isVisible, false);
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.SETUP)).isVisible, false);
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.INTRO)).isVisible, false);

  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.ROUND_INTRO)).isVisible, true);
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.EATING)).isVisible, true);
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.MINIGAME_INTRO)).isVisible, true);
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.MINIGAME_PLAY)).isVisible, true);
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.ROUND_RESULTS)).isVisible, true);
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.FINAL_RESULTS)).isVisible, true);
});

test("skip-turn action is limited to turn phases", () => {
  assert.equal(
    selectOverrideDockContext(buildSnapshot(Phase.ROUND_INTRO)).showSkipTurnBoundaryAction,
    false
  );
  assert.equal(
    selectOverrideDockContext(buildSnapshot(Phase.EATING)).showSkipTurnBoundaryAction,
    true
  );
  assert.equal(
    selectOverrideDockContext(buildSnapshot(Phase.MINIGAME_INTRO)).showSkipTurnBoundaryAction,
    true
  );
  assert.equal(
    selectOverrideDockContext(buildSnapshot(Phase.MINIGAME_PLAY)).showSkipTurnBoundaryAction,
    true
  );
  assert.equal(
    selectOverrideDockContext(buildSnapshot(Phase.ROUND_RESULTS)).showSkipTurnBoundaryAction,
    false
  );
});

test("turn-order editability is round-intro only", () => {
  assert.equal(
    selectOverrideDockContext(buildSnapshot(Phase.ROUND_INTRO)).isTurnOrderEditable,
    true
  );
  assert.equal(selectOverrideDockContext(buildSnapshot(Phase.EATING)).isTurnOrderEditable, false);
});

test("badge turns on for redo availability", () => {
  const context = selectOverrideDockContext(
    buildSnapshot(Phase.ROUND_RESULTS, { canRedoScoringMutation: true })
  );

  assert.equal(context.showRedoLastMutationAction, true);
  assert.equal(context.showBadge, true);
});

test("badge turns on for custom turn order", () => {
  const roomState = buildSnapshot(Phase.ROUND_RESULTS, {
    turnOrderTeamIds: ["team-beta", "team-alpha"]
  });

  assert.equal(hasCustomTurnOrder(roomState), true);
  assert.equal(selectOverrideDockContext(roomState).showBadge, true);
});

test("badge stays off when redo is unavailable and turn order is default", () => {
  const roomState = buildSnapshot(Phase.ROUND_RESULTS);

  assert.equal(hasCustomTurnOrder(roomState), false);
  assert.equal(selectOverrideDockContext(roomState).showBadge, false);
});
