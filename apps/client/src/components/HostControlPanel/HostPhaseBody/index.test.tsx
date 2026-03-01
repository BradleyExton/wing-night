import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Phase,
  type GameConfigFile,
  type MinigameHostView,
  type Player,
  type RoomState,
  type Team
} from "@wingnight/shared";

import { HostPhaseBody } from "./index";
import type { HostRenderMode } from "../resolveHostRenderMode";

type HostPhaseBodyProps = Parameters<typeof HostPhaseBody>[0];

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

const playersFixture: Player[] = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Morgan" }
];

const buildRoomState = (
  phase: Phase,
  overrides: Partial<RoomState> = {}
): RoomState => {
  const snapshot: RoomState = {
    phase,
    currentRound: 1,
    totalRounds: gameConfigFixture.rounds.length,
    players: playersFixture,
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

const assignedTeamByPlayerId = new Map<string, string>([
  ["player-1", "team-alpha"],
  ["player-2", "team-beta"]
]);

const teamNameByTeamId = new Map<string, string>([
  ["team-alpha", "Team Alpha"],
  ["team-beta", "Team Beta"]
]);

const buildProps = (
  hostMode: HostRenderMode,
  phase: Phase | null,
  overrides: Partial<HostPhaseBodyProps> = {}
): HostPhaseBodyProps => {
  const roomState = phase === null ? null : buildRoomState(phase);

  return {
    hostMode,
    roomState,
    players: playersFixture,
    teams: teamsFixture,
    assignedTeamByPlayerId,
    teamNameByTeamId,
    wingParticipationByPlayerId: { "player-1": true },
    activeRoundTeamId: "team-alpha",
    activeRoundTeamName: "Team Alpha",
    minigameType: roomState?.currentRoundConfig?.minigame ?? null,
    minigameHostView: null,
    nextTeamName: "",
    setupMutationsDisabled: false,
    assignmentDisabled: false,
    participationDisabled: false,
    canDispatchMinigameAction: true,
    sortedStandings: teamsFixture,
    timer: null,
    onNextTeamNameChange: () => undefined,
    onCreateTeamSubmit: () => undefined,
    onAssignPlayer: () => undefined,
    onSetWingParticipation: () => undefined,
    onPauseTimer: () => undefined,
    onResumeTimer: () => undefined,
    onExtendTimer: () => undefined,
    onDispatchMinigameAction: () => undefined,
    ...overrides
  };
};

test("renders no phase body in waiting mode", () => {
  const html = renderToStaticMarkup(
    <HostPhaseBody {...buildProps("waiting", null)} />
  );

  assert.equal(html, "");
});

test("renders setup surfaces in setup mode", () => {
  const html = renderToStaticMarkup(
    <HostPhaseBody {...buildProps("setup", Phase.SETUP)} />
  );

  assert.match(html, /Team Setup/);
  assert.match(html, /Assign Alex to a team/);
});

test("renders eating surfaces in eating mode", () => {
  const eatingTimer: NonNullable<RoomState["timer"]> = {
    phase: Phase.EATING,
    startedAt: Date.now(),
    endsAt: Date.now() + 60_000,
    durationMs: 60_000,
    isPaused: true,
    remainingMs: 60_000
  };

  const html = renderToStaticMarkup(
    <HostPhaseBody
      {...buildProps("eating", Phase.EATING, {
        roomState: buildRoomState(Phase.EATING, { timer: eatingTimer }),
        timer: eatingTimer
      })}
    />
  );

  assert.match(html, /Timer Controls/);
  assert.match(html, /Alex/);
  assert.doesNotMatch(html, /Morgan/);
});

test("renders minigame surface in minigame intro mode", () => {
  const html = renderToStaticMarkup(
    <HostPhaseBody {...buildProps("minigame_intro", Phase.MINIGAME_INTRO)} />
  );

  assert.match(html, /Mini-Game/);
  assert.match(html, /Review the active team, then advance to begin trivia play\./);
  assert.match(html, /Active Team: Team Alpha/);
});

test("renders minigame surface in minigame play mode", () => {
  const triviaHostView: MinigameHostView = {
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
  };

  const html = renderToStaticMarkup(
    <HostPhaseBody
      {...buildProps("minigame_play", Phase.MINIGAME_PLAY, {
        minigameHostView: triviaHostView
      })}
    />
  );

  assert.match(html, /Which scale measures pepper heat\?/);
  assert.match(html, /Scoville/);
  assert.match(html, /Correct/);
  assert.match(html, /Incorrect/);
});

test("renders compact round intro surfaces", () => {
  const html = renderToStaticMarkup(
    <HostPhaseBody {...buildProps("compact", Phase.ROUND_INTRO)} />
  );

  assert.match(html, /Standings Snapshot/);
  assert.doesNotMatch(html, /Turn Order/);
});
