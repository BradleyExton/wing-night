import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phase, type GameConfigFile, type RoomState, type Team } from "@wingnight/shared";

import { HostControlPanel } from "./index";

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

test("renders waiting hero when room state is missing", () => {
  const html = renderToStaticMarkup(<HostControlPanel roomState={null} />);

  assert.match(html, /Waiting for room state/);
  assert.match(html, /Pre-game/);
});

test("renders fatal content state when snapshot reports content load failure", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.SETUP, {
        fatalError: {
          code: "CONTENT_LOAD_FAILED",
          message: "Invalid game config content."
        }
      })}
    />
  );

  assert.match(html, /Content Load Error/);
  assert.match(html, /CONTENT_LOAD_FAILED/);
  assert.match(html, /Invalid game config content\./);
  assert.doesNotMatch(html, /Next Phase/);
});

test("renders setup deck and assignment controls during SETUP", () => {
  // Snapshot with one player not assigned so auto-assign button renders.
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.SETUP, {
        players: [
          { id: "player-1", name: "Alex" },
          { id: "player-2", name: "Morgan" },
          { id: "player-3", name: "Jamie" }
        ]
      })}
    />
  );

  assert.match(html, /Build the/);
  assert.match(html, /Teams/);
  assert.match(html, /Auto-Assign Remaining Players/);
  assert.match(html, /Add Player/);
  assert.match(html, /Assign Alex to a team/);
  assert.doesNotMatch(html, /Pause Timer/);
  assert.doesNotMatch(html, /Score Override/);
});

test("renders eating timer hero and participation deck during EATING", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.EATING, {
        timer: {
          phase: Phase.EATING,
          startedAt: 0,
          endsAt: 120_000,
          durationMs: 120_000,
          isPaused: false,
          remainingMs: 120_000
        },
        wingParticipationByPlayerId: { "player-1": true }
      })}
    />
  );

  assert.match(html, /Time Remaining/);
  assert.match(html, /Round 1 of 1/);
  assert.match(html, /Team Alpha/);
  assert.match(html, /Alex/);
  assert.doesNotMatch(html, /Morgan/);
  assert.match(html, /Mark each player who finished their wing this round/);
  assert.match(html, /Timer Controls/);
  assert.match(html, /Pause Timer/);
  assert.match(html, /Overrides/);
  assert.match(html, /Mark Alex as ate wing/);
});

test("disables setup primary action when canAdvancePhase is false", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.SETUP, {
        canAdvancePhase: false
      })}
      onNextPhase={(): void => {}}
    />
  );

  assert.match(
    html,
    /<button[^>]*disabled=""[^>]*>Lock Teams &amp; Continue<\/button>/
  );
});

test("enables setup primary action when canAdvancePhase is true", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.SETUP, {
        canAdvancePhase: true
      })}
      onNextPhase={(): void => {}}
    />
  );

  assert.match(html, /Lock Teams &amp; Continue/);
  assert.doesNotMatch(
    html,
    /<button[^>]*disabled=""[^>]*>Lock Teams &amp; Continue<\/button>/
  );
});

test("renders trivia controls during TRIVIA MINIGAME_PLAY", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.MINIGAME_PLAY, {
        minigameHostView: {
          minigame: "TRIVIA",
          activeTurnTeamId: "team-alpha",
          attemptsRemaining: 1,
          promptCursor: 0,
          pendingPointsByTeamId: {
            "team-alpha": 0
          },
          currentPrompt: {
            id: "prompt-1",
            question: "Which scale measures pepper heat?",
            answer: "Scoville"
          }
        }
      })}
    />
  );

  assert.match(html, /Which scale measures pepper heat\?/);
  assert.match(html, /Scoville/);
  assert.match(html, /Correct/);
  assert.match(html, /Incorrect/);
});

test("disables trivia attempt controls when attemptsRemaining is exhausted", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.MINIGAME_PLAY, {
        minigameHostView: {
          minigame: "TRIVIA",
          activeTurnTeamId: "team-alpha",
          attemptsRemaining: 0,
          promptCursor: 0,
          pendingPointsByTeamId: {
            "team-alpha": 0
          },
          currentPrompt: {
            id: "prompt-1",
            question: "Which scale measures pepper heat?",
            answer: "Scoville"
          }
        }
      })}
      onDispatchMinigameAction={(): void => {}}
    />
  );

  assert.match(html, /<button[^>]*disabled=""[^>]*>Correct<\/button>/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Incorrect<\/button>/);
});

test("renders locked setup deck during INTRO with start-game CTA", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel roomState={buildSnapshot(Phase.INTRO)} />
  );

  assert.match(html, /Game Locked In/);
  assert.match(html, /Start Game/);
  assert.match(html, /Teams/);
  assert.match(html, /Assign Alex to a team/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Create Team<\/button>/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Add Player<\/button>/);
});

test("renders standings snapshot in compact ROUND_INTRO view", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel roomState={buildSnapshot(Phase.ROUND_INTRO)} />
  );

  assert.match(html, /Round 1 of 1/);
  assert.match(html, /Frank&#x27;s/);
  assert.match(html, /TRIVIA/);
  assert.match(html, /Overrides/);
  assert.match(html, /Standings Snapshot/);
});

test("renders standings snapshot in score-descending order during ROUND_RESULTS", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.ROUND_RESULTS, {
        teams: [
          {
            id: "team-alpha",
            name: "Team Alpha",
            playerIds: ["player-1"],
            totalScore: 6
          },
          {
            id: "team-beta",
            name: "Team Beta",
            playerIds: ["player-2"],
            totalScore: 14
          }
        ]
      })}
    />
  );

  assert.match(html, /Standings Snapshot/);
  assert.ok(html.indexOf("Team Beta") < html.indexOf("Team Alpha"));
});

test("renders game-complete CTA in FINAL_RESULTS view", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel roomState={buildSnapshot(Phase.FINAL_RESULTS)} />
  );

  assert.match(html, /Game Complete/);
  assert.match(html, /Standings Snapshot/);
});

test("shows redo action when scoring mutation history is available", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.ROUND_RESULTS, {
        canRedoScoringMutation: true
      })}
    />
  );

  assert.match(html, /Overrides/);
});

test("shows override button when turn order differs from default team order", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.ROUND_RESULTS, {
        turnOrderTeamIds: ["team-beta", "team-alpha"]
      })}
    />
  );

  assert.match(html, /Overrides/);
});

test("renders MINIGAME_INTRO with team callout and intro deck", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel roomState={buildSnapshot(Phase.MINIGAME_INTRO)} />
  );

  assert.match(html, /Team Alpha/);
  assert.match(html, /TRIVIA/);
  assert.doesNotMatch(html, /Teams/);
});
