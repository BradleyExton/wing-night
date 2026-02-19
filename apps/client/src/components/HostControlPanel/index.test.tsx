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
    triviaPrompts: [],
    currentRoundConfig: gameConfigFixture.rounds[0],
    turnOrderTeamIds: teamsFixture.map((team) => team.id),
    roundTurnCursor: 0,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: teamsFixture[0]?.id ?? null,
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
    canRedoScoringMutation: false,
    canAdvancePhase: true
  };

  return { ...snapshot, ...overrides };
};

test("renders loading copy when room state is missing", () => {
  const html = renderToStaticMarkup(<HostControlPanel roomState={null} />);

  assert.match(html, /Waiting for room state/);
  assert.match(html, /Host controls will update when the latest snapshot arrives\./);
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

test("renders setup sections and assignment controls during SETUP", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel roomState={buildSnapshot(Phase.SETUP)} />
  );

  assert.match(html, /Host/);
  assert.match(html, /Setup/);
  assert.match(html, /Create teams and assign players before starting the game\./);
  assert.doesNotMatch(html, /Host Control Panel/);
  assert.doesNotMatch(html, /Create teams, assign players, and advance phases\./);
  assert.match(html, /Team Setup/);
  assert.match(html, /Teams/);
  assert.match(html, /Assign Alex to a team/);
  assert.doesNotMatch(
    html,
    /Advance when teams are assigned and the room is ready to start\./
  );
  assert.doesNotMatch(html, /Pause Timer/);
  assert.doesNotMatch(html, /Mark each player who finished their wing this round/);
  assert.doesNotMatch(html, /Ate wing/);
  assert.doesNotMatch(html, /Score Override/);
  assert.doesNotMatch(html, /Reset Game/);
  assert.doesNotMatch(html, /Overrides/);
});

test("renders eating participation controls and hides setup sections during EATING", () => {
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

  assert.match(html, /Eating/);
  assert.match(html, /Track wing participation and manage the active turn timer\./);
  assert.match(html, /Round 1 of 1/);
  assert.doesNotMatch(html, /Team 1 of 2/);
  assert.match(html, /Active Team/);
  assert.match(html, /Team Alpha/);
  assert.match(html, /Alex/);
  assert.doesNotMatch(html, /Morgan/);
  assert.match(html, /Mark each player who finished their wing this round/);
  assert.match(
    html,
    /Advance when eating participation is captured for the active team\./
  );
  assert.doesNotMatch(html, /Team setup is locked after the game starts\./);
  assert.match(html, /Timer Controls/);
  assert.match(html, /Pause Timer/);
  assert.match(html, /Overrides/);
  assert.doesNotMatch(html, /Skip Turn/);
  assert.doesNotMatch(html, /Reset Game/);
  assert.doesNotMatch(html, /Score Override/);
  assert.doesNotMatch(html, /Undo Last Score/);
  assert.match(html, /Ate wing/);
  assert.doesNotMatch(html, /Team Setup/);
  assert.doesNotMatch(html, /Assign Alex to a team/);
});

test("disables Next Phase during SETUP when server marks canAdvancePhase false", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.SETUP, {
        canAdvancePhase: false
      })}
      onNextPhase={(): void => {}}
    />
  );

  assert.match(html, /<button[^>]*disabled=""[^>]*>Next Phase<\/button>/);
});

test("enables Next Phase during SETUP when server marks canAdvancePhase true", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.SETUP, {
        canAdvancePhase: true
      })}
      onNextPhase={(): void => {}}
    />
  );

  assert.match(html, /<button[^>]*>Next Phase<\/button>/);
  assert.doesNotMatch(html, /<button[^>]*disabled=""[^>]*>Next Phase<\/button>/);
});

test("renders trivia controls during TRIVIA MINIGAME_PLAY", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.MINIGAME_PLAY, {
        minigameHostView: {
          minigame: "TRIVIA",
          minigameApiVersion: 1,
          capabilityFlags: ["recordAttempt"],
          compatibilityStatus: "COMPATIBLE",
          compatibilityMessage: null,
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

  assert.match(html, /Mark the active team&#x27;s answer as correct or incorrect/);
  assert.match(html, /Active Team: Team Alpha/);
  assert.match(html, /Which scale measures pepper heat\?/);
  assert.match(html, /Scoville/);
  assert.match(html, /Correct/);
  assert.match(html, /Incorrect/);
  assert.doesNotMatch(html, /Players/);
  assert.doesNotMatch(html, /Alex/);
  assert.doesNotMatch(html, /Morgan/);
});

test("disables trivia attempt controls when attemptsRemaining is exhausted", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.MINIGAME_PLAY, {
        minigameHostView: {
          minigame: "TRIVIA",
          minigameApiVersion: 1,
          capabilityFlags: ["recordAttempt"],
          compatibilityStatus: "COMPATIBLE",
          compatibilityMessage: null,
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
      onRecordTriviaAttempt={(): void => {}}
    />
  );

  assert.match(html, /<button[^>]*disabled=""[^>]*>Correct<\/button>/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Incorrect<\/button>/);
});

test("renders standings snapshot only during INTRO compact view", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel roomState={buildSnapshot(Phase.INTRO)} />
  );

  assert.match(html, /Intro/);
  assert.match(html, /Confirm teams are ready before starting the first round\./);
  assert.match(html, /Standings Snapshot/);
  assert.doesNotMatch(html, /Overrides/);
  assert.doesNotMatch(html, /Score Override/);
  assert.doesNotMatch(html, /Reset Game/);
  assert.doesNotMatch(html, /Undo Last Score/);
  assert.doesNotMatch(html, /Phase Status/);
  assert.doesNotMatch(html, /Round Context/);
  assert.doesNotMatch(html, /Next Action/);
  assert.doesNotMatch(html, /Skip Turn/);
  assert.doesNotMatch(html, /Turn Order/);
  assert.doesNotMatch(html, /Team Setup/);
});

test("renders standings snapshot in compact ROUND_INTRO view", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel roomState={buildSnapshot(Phase.ROUND_INTRO)} />
  );

  assert.match(html, /Round 1 of 1/);
  assert.match(html, /Sauce/);
  assert.match(html, /Frank&#x27;s/);
  assert.match(html, /Mini-game/);
  assert.match(html, /TRIVIA/);
  assert.match(html, /Overrides/);
  assert.doesNotMatch(html, /Turn Order/);
  assert.doesNotMatch(html, /Move Up/);
  assert.doesNotMatch(html, /Move Down/);
  assert.doesNotMatch(html, /Score Override/);
  assert.match(html, /Standings Snapshot/);
  assert.doesNotMatch(html, /Phase Status/);
  assert.doesNotMatch(html, /Round Context/);
  assert.doesNotMatch(html, /Next Action/);
  assert.match(html, /Advance when players are ready to begin eating\./);
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

test("renders completion guidance in compact FINAL_RESULTS view", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel roomState={buildSnapshot(Phase.FINAL_RESULTS)} />
  );

  assert.match(html, /Game complete\./);
  assert.match(html, /Final Results/);
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
  assert.match(html, /Needs Review/);
});

test("shows override badge when turn order differs from default team order", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.ROUND_RESULTS, {
        turnOrderTeamIds: ["team-beta", "team-alpha"]
      })}
    />
  );

  assert.match(html, /Overrides/);
  assert.match(html, /Needs Review/);
});

test("keeps MINIGAME_INTRO on streamlined host view", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel roomState={buildSnapshot(Phase.MINIGAME_INTRO)} />
  );

  assert.doesNotMatch(html, /Team Setup/);
  assert.doesNotMatch(html, /Players/);
  assert.match(html, /Active Team/);
  assert.match(html, /Team Alpha/);
  assert.doesNotMatch(html, /Team 1 of 2/);
  assert.doesNotMatch(html, /Phase Status/);
});
