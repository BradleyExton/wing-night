import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phase, type GameConfigFile, type RoomState, type Team } from "@wingnight/shared";

import { HostMiniRail } from "./index";

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

test("renders pre-game label when room state is missing", () => {
  const html = renderToStaticMarkup(
    <HostMiniRail roomState={null} teamNameByTeamId={teamNameByTeamId} />
  );

  assert.match(html, /Pre-game/);
});

test("renders round progress when round metadata is valid", () => {
  const html = renderToStaticMarkup(
    <HostMiniRail
      roomState={buildSnapshot(Phase.ROUND_INTRO, { currentRound: 2, totalRounds: 5 })}
      teamNameByTeamId={teamNameByTeamId}
    />
  );

  assert.match(html, /Round 2 of 5/);
  assert.match(html, /Frank&#x27;s/);
  assert.match(html, /TRIVIA/);
});

test("renders pre-game when round metadata is not in progress", () => {
  const html = renderToStaticMarkup(
    <HostMiniRail
      roomState={buildSnapshot(Phase.SETUP, { currentRound: 0, totalRounds: 3 })}
      teamNameByTeamId={teamNameByTeamId}
    />
  );

  assert.match(html, /Pre-game/);
  assert.doesNotMatch(html, /Round 0 of 3/);
});

test("renders pre-game when total rounds metadata is invalid", () => {
  const html = renderToStaticMarkup(
    <HostMiniRail
      roomState={buildSnapshot(Phase.SETUP, { currentRound: 1, totalRounds: 0 })}
      teamNameByTeamId={teamNameByTeamId}
    />
  );

  assert.match(html, /Pre-game/);
  assert.doesNotMatch(html, /Round 1 of 0/);
});

test("hides round-intro-only sauce and minigame outside ROUND_INTRO", () => {
  const html = renderToStaticMarkup(
    <HostMiniRail
      roomState={buildSnapshot(Phase.EATING)}
      teamNameByTeamId={teamNameByTeamId}
    />
  );

  assert.doesNotMatch(html, /Frank/);
  assert.doesNotMatch(html, /TRIVIA/);
});

test("resolves active team using phase rules and fallback labels", () => {
  const minigamePlayFallbackHtml = renderToStaticMarkup(
    <HostMiniRail
      roomState={buildSnapshot(Phase.MINIGAME_PLAY, {
        activeRoundTeamId: "team-beta",
        activeTurnTeamId: null
      })}
      teamNameByTeamId={teamNameByTeamId}
    />
  );
  assert.match(minigamePlayFallbackHtml, /Team Beta/);

  const minigamePlayPriorityHtml = renderToStaticMarkup(
    <HostMiniRail
      roomState={buildSnapshot(Phase.MINIGAME_PLAY, {
        activeRoundTeamId: "team-beta",
        activeTurnTeamId: "team-alpha"
      })}
      teamNameByTeamId={teamNameByTeamId}
    />
  );
  assert.match(minigamePlayPriorityHtml, /Team Alpha/);

  const unknownTeamHtml = renderToStaticMarkup(
    <HostMiniRail
      roomState={buildSnapshot(Phase.EATING, {
        activeRoundTeamId: "missing-team-id"
      })}
      teamNameByTeamId={teamNameByTeamId}
    />
  );
  assert.match(unknownTeamHtml, /No team assigned/);
});

test("hides active-team rail data in non-turn phases", () => {
  const nonTurnPhases = [
    Phase.SETUP,
    Phase.INTRO,
    Phase.ROUND_INTRO,
    Phase.ROUND_RESULTS,
    Phase.FINAL_RESULTS
  ];

  for (const phase of nonTurnPhases) {
    const html = renderToStaticMarkup(
      <HostMiniRail
        roomState={buildSnapshot(phase, {
          roundTurnCursor: 0,
          turnOrderTeamIds: ["team-alpha", "team-beta"]
        })}
        teamNameByTeamId={teamNameByTeamId}
      />
    );

    assert.doesNotMatch(html, /Team Alpha/, `${phase} should not show active team`);
  }
});

test("does not render trivia prompt or answer payloads in rail", () => {
  const html = renderToStaticMarkup(
    <HostMiniRail
      roomState={buildSnapshot(Phase.MINIGAME_PLAY)}
      teamNameByTeamId={teamNameByTeamId}
    />
  );

  assert.doesNotMatch(html, /Which scale measures pepper heat/);
  assert.doesNotMatch(html, /Scoville/);
});
