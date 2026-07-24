import assert from "node:assert/strict";
import test from "node:test";
import {
  Phase,
  type MinigameHostView,
  type RoomState
} from "@wingnight/shared";

import {
  buildNoopHostHandlers,
  renderHostMarkup
} from "../../../testSupport/renderWithProviders";
import { buildRoomState as buildRoomStateFixture } from "../../../testSupport/roomStateFixtures";
import { HostPhaseBody } from "./index";

const buildRoomState = (
  phase: Phase,
  overrides: Partial<RoomState> = {}
): RoomState => {
  return buildRoomStateFixture({ phase, ...overrides });
};

const renderPhaseBody = (roomState: RoomState | null): string => {
  return renderHostMarkup(<HostPhaseBody />, {
    roomState,
    handlers: buildNoopHostHandlers()
  });
};

test("renders waiting hero in waiting mode", () => {
  const html = renderPhaseBody(null);

  assert.match(html, /Waiting for room state/);
});

test("renders setup surfaces in setup mode", () => {
  const html = renderPhaseBody(buildRoomState(Phase.SETUP));

  assert.match(html, /Teams/);
  assert.match(html, /Assign Alex to a team/);
});

test("renders setup lock notice in setup_locked mode", () => {
  const html = renderPhaseBody(buildRoomState(Phase.INTRO));

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

  const html = renderPhaseBody(buildRoomState(Phase.EATING, { timer: eatingTimer }));

  assert.match(html, /Timer Controls/);
  assert.match(html, /Alex/);
  assert.doesNotMatch(html, /Morgan/);
});

test("renders minigame surface in minigame intro mode", () => {
  const html = renderPhaseBody(buildRoomState(Phase.MINIGAME_INTRO));

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

  const html = renderPhaseBody(
    buildRoomState(Phase.MINIGAME_PLAY, {
      minigameHostView: triviaHostView
    })
  );

  assert.match(html, /Which scale measures pepper heat\?/);
  assert.match(html, /Scoville/);
  assert.match(html, /Correct/);
  assert.match(html, /Incorrect/);
});

test("renders compact round intro surfaces", () => {
  const html = renderPhaseBody(buildRoomState(Phase.ROUND_INTRO));

  assert.match(html, /Standings Snapshot/);
  assert.doesNotMatch(html, /Turn Order/);
});
