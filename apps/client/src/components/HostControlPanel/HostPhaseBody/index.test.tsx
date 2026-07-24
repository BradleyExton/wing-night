import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Phase,
  type MinigameHostView,
  type RoomState
} from "@wingnight/shared";

import {
  buildRoomState as buildRoomStateFixture,
  fixturePlayers,
  fixtureTeams
} from "../../../testSupport/roomStateFixtures";
import { HostPhaseBody } from "./index";
import type { HostRenderMode } from "../resolveHostRenderMode";

type HostPhaseBodyProps = Parameters<typeof HostPhaseBody>[0];

const teamsFixture = fixtureTeams;
const playersFixture = fixturePlayers;

const buildRoomState = (
  phase: Phase,
  overrides: Partial<RoomState> = {}
): RoomState => {
  return buildRoomStateFixture({ phase, ...overrides });
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
    autoAssignDisabled: false,
    assignmentDisabled: false,
    addPlayerDisabled: false,
    participationDisabled: false,
    canDispatchMinigameAction: true,
    sortedStandings: teamsFixture,
    timer: null,
    showOverridesButton: false,
    overridesShowBadge: false,
    onOpenOverrides: () => undefined,
    onNextTeamNameChange: () => undefined,
    onCreateTeamSubmit: () => undefined,
    onAddPlayer: () => undefined,
    onAssignPlayer: () => undefined,
    onAutoAssignRemainingPlayers: () => undefined,
    onSetWingParticipation: () => undefined,
    onPauseTimer: () => undefined,
    onResumeTimer: () => undefined,
    onExtendTimer: () => undefined,
    onDispatchMinigameAction: () => undefined,
    ...overrides
  };
};

test("renders waiting hero in waiting mode", () => {
  const html = renderToStaticMarkup(
    <HostPhaseBody {...buildProps("waiting", null)} />
  );

  assert.match(html, /Waiting for room state/);
});

test("renders setup surfaces in setup mode", () => {
  const html = renderToStaticMarkup(
    <HostPhaseBody {...buildProps("setup", Phase.SETUP)} />
  );

  assert.match(html, /Teams/);
  assert.match(html, /Assign Alex to a team/);
});

test("renders setup lock notice in setup_locked mode", () => {
  const html = renderToStaticMarkup(
    <HostPhaseBody
      {...buildProps("setup_locked", Phase.INTRO, {
        setupMutationsDisabled: true,
        assignmentDisabled: true
      })}
    />
  );

  assert.match(html, /Game Locked In/);
  assert.match(html, /Teams/);
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
  assert.match(html, /Call the team up, explain it, then start eating once they are set\./);
  assert.match(html, /Team Up/);
  assert.match(html, /Team Alpha/);
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
