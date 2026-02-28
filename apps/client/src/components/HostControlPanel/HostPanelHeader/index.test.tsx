import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phase, type GameConfigFile, type RoomState, type Team } from "@wingnight/shared";

import { HostPanelHeader } from "./index";

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
    canRevertPhaseTransition: false,
    canAdvancePhase: true
  };

  return { ...snapshot, ...overrides };
};

test("renders waiting fallback when room state is missing", () => {
  const html = renderToStaticMarkup(
    <HostPanelHeader roomState={null} teamNameByTeamId={teamNameByTeamId} />
  );

  assert.match(html, /Host/);
  assert.match(html, /Waiting for room state/);
  assert.match(html, /Host controls will update when the latest snapshot arrives\./);
  assert.match(html, /Pre-game/);
});

test("renders dynamic phase title for core game phases", () => {
  const phaseCases: Array<{ phase: Phase; label: string }> = [
    { phase: Phase.SETUP, label: "Setup" },
    { phase: Phase.INTRO, label: "Intro" },
    { phase: Phase.ROUND_INTRO, label: "Round Intro" },
    { phase: Phase.EATING, label: "Eating" },
    { phase: Phase.MINIGAME_INTRO, label: "Minigame Intro" },
    { phase: Phase.MINIGAME_PLAY, label: "Minigame Play" },
    { phase: Phase.ROUND_RESULTS, label: "Round Results" },
    { phase: Phase.FINAL_RESULTS, label: "Final Results" }
  ];

  for (const phaseCase of phaseCases) {
    const html = renderToStaticMarkup(
      <HostPanelHeader
        roomState={buildSnapshot(phaseCase.phase)}
        teamNameByTeamId={teamNameByTeamId}
      />
    );

    assert.match(html, new RegExp(phaseCase.label));
  }
});

test("renders pre-game round context when round metadata is not in progress", () => {
  const html = renderToStaticMarkup(
    <HostPanelHeader
      roomState={buildSnapshot(Phase.SETUP, { currentRound: 0, totalRounds: 3 })}
      teamNameByTeamId={teamNameByTeamId}
    />
  );

  assert.match(html, /Pre-game/);
  assert.doesNotMatch(html, /Round 0 of 3/);
});

test("renders pre-game round context when total rounds metadata is invalid", () => {
  const html = renderToStaticMarkup(
    <HostPanelHeader
      roomState={buildSnapshot(Phase.SETUP, { currentRound: 1, totalRounds: 0 })}
      teamNameByTeamId={teamNameByTeamId}
    />
  );

  assert.match(html, /Pre-game/);
  assert.doesNotMatch(html, /Round 1 of 0/);
});

test("renders round progress when round metadata is valid", () => {
  const html = renderToStaticMarkup(
    <HostPanelHeader
      roomState={buildSnapshot(Phase.ROUND_INTRO, { currentRound: 2, totalRounds: 5 })}
      teamNameByTeamId={teamNameByTeamId}
    />
  );

  assert.match(html, /Round 2 of 5/);
  assert.match(html, /Sauce/);
  assert.match(html, /Frank&#x27;s/);
  assert.match(html, /Mini-game/);
  assert.match(html, /TRIVIA/);
});

test("hides round-intro-only context pills outside ROUND_INTRO", () => {
  const html = renderToStaticMarkup(
    <HostPanelHeader
      roomState={buildSnapshot(Phase.EATING)}
      teamNameByTeamId={teamNameByTeamId}
    />
  );

  assert.doesNotMatch(html, /Sauce/);
  assert.doesNotMatch(html, /Mini-game/);
});

test("does not render turn progress even when cursor and turn order are valid", () => {
  const phasesWithoutTurnProgress = [
    Phase.EATING,
    Phase.MINIGAME_INTRO,
    Phase.MINIGAME_PLAY
  ];

  for (const phase of phasesWithoutTurnProgress) {
    const html = renderToStaticMarkup(
      <HostPanelHeader
        roomState={buildSnapshot(phase, {
          roundTurnCursor: 1,
          turnOrderTeamIds: ["team-alpha", "team-beta"]
        })}
        teamNameByTeamId={teamNameByTeamId}
      />
    );

    assert.doesNotMatch(html, /Team 2 of 2/, `${phase} should not show turn progress`);
    assert.doesNotMatch(html, /Turn/, `${phase} should not show Turn label`);
  }
});

test("resolves active team using phase rules and fallback labels", () => {
  const minigamePlayFallbackHtml = renderToStaticMarkup(
    <HostPanelHeader
      roomState={buildSnapshot(Phase.MINIGAME_PLAY, {
        activeRoundTeamId: "team-beta",
        activeTurnTeamId: null
      })}
      teamNameByTeamId={teamNameByTeamId}
    />
  );
  assert.match(minigamePlayFallbackHtml, /Team Beta/);

  const minigamePlayPriorityHtml = renderToStaticMarkup(
    <HostPanelHeader
      roomState={buildSnapshot(Phase.MINIGAME_PLAY, {
        activeRoundTeamId: "team-beta",
        activeTurnTeamId: "team-alpha"
      })}
      teamNameByTeamId={teamNameByTeamId}
    />
  );
  assert.match(minigamePlayPriorityHtml, /Team Alpha/);

  const unknownTeamHtml = renderToStaticMarkup(
    <HostPanelHeader
      roomState={buildSnapshot(Phase.EATING, {
        activeRoundTeamId: "missing-team-id"
      })}
      teamNameByTeamId={teamNameByTeamId}
    />
  );
  assert.match(unknownTeamHtml, /No team assigned/);
});

test("hides unavailable turn context while keeping round context visible", () => {
  const html = renderToStaticMarkup(
    <HostPanelHeader
      roomState={buildSnapshot(Phase.FINAL_RESULTS, {
        roundTurnCursor: -1,
        turnOrderTeamIds: []
      })}
      teamNameByTeamId={teamNameByTeamId}
    />
  );

  assert.match(html, /Round 1 of 1/);
  assert.doesNotMatch(html, /Turn/);
  assert.doesNotMatch(html, /Active Team/);
});

test("hides turn context in non-turn phases even when turn data is valid", () => {
  const nonTurnPhases = [
    Phase.SETUP,
    Phase.INTRO,
    Phase.ROUND_INTRO,
    Phase.ROUND_RESULTS,
    Phase.FINAL_RESULTS
  ];

  for (const phase of nonTurnPhases) {
    const html = renderToStaticMarkup(
      <HostPanelHeader
        roomState={buildSnapshot(phase, {
          roundTurnCursor: 0,
          turnOrderTeamIds: ["team-alpha", "team-beta"]
        })}
        teamNameByTeamId={teamNameByTeamId}
      />
    );

    assert.doesNotMatch(
      html,
      /Team 1 of 2/,
      `${phase} should not show turn progress`
    );
    assert.doesNotMatch(html, /Turn/, `${phase} should not show Turn label`);
    assert.doesNotMatch(
      html,
      /Active Team/,
      `${phase} should not show Active Team`
    );
  }
});

test("does not render trivia prompt or answer payloads in header", () => {
  const html = renderToStaticMarkup(
    <HostPanelHeader
      roomState={buildSnapshot(Phase.MINIGAME_PLAY)}
      teamNameByTeamId={teamNameByTeamId}
    />
  );

  assert.doesNotMatch(html, /Which scale measures pepper heat/);
  assert.doesNotMatch(html, /Scoville/);
});
