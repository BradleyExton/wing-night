import assert from "node:assert/strict";
import test from "node:test";
import { Phase, type RoomState } from "@wingnight/shared";

import { renderHostMarkup } from "../../../testSupport/renderWithProviders";
import { buildRoomState } from "../../../testSupport/roomStateFixtures";
import { HostMiniRail } from "./index";

const buildSnapshot = (
  phase: Phase,
  overrides: Partial<RoomState> = {}
): RoomState => {
  return buildRoomState({ phase, ...overrides });
};

const renderMiniRail = (roomState: RoomState | null): string => {
  return renderHostMarkup(<HostMiniRail />, { roomState });
};

test("renders pre-game label when room state is missing", () => {
  const html = renderMiniRail(null);

  assert.match(html, /Pre-game/);
});

test("renders round progress when round metadata is valid", () => {
  const html = renderMiniRail(
    buildSnapshot(Phase.ROUND_INTRO, { currentRound: 2, totalRounds: 5 })
  );

  assert.match(html, /Round 2 of 5/);
  assert.match(html, /Frank&#x27;s/);
  assert.match(html, /TRIVIA/);
});

test("renders pre-game when round metadata is not in progress", () => {
  const html = renderMiniRail(
    buildSnapshot(Phase.SETUP, { currentRound: 0, totalRounds: 3 })
  );

  assert.match(html, /Pre-game/);
  assert.doesNotMatch(html, /Round 0 of 3/);
});

test("renders pre-game when total rounds metadata is invalid", () => {
  const html = renderMiniRail(
    buildSnapshot(Phase.SETUP, { currentRound: 1, totalRounds: 0 })
  );

  assert.match(html, /Pre-game/);
  assert.doesNotMatch(html, /Round 1 of 0/);
});

test("hides round-intro-only sauce and minigame outside ROUND_INTRO", () => {
  const html = renderMiniRail(buildSnapshot(Phase.EATING));

  assert.doesNotMatch(html, /Frank/);
  assert.doesNotMatch(html, /TRIVIA/);
});

test("resolves active team using phase rules and fallback labels", () => {
  const minigamePlayFallbackHtml = renderMiniRail(
    buildSnapshot(Phase.MINIGAME_PLAY, {
      activeRoundTeamId: "team-beta",
      activeTurnTeamId: null
    })
  );
  assert.match(minigamePlayFallbackHtml, /Team Beta/);

  const minigamePlayPriorityHtml = renderMiniRail(
    buildSnapshot(Phase.MINIGAME_PLAY, {
      activeRoundTeamId: "team-beta",
      activeTurnTeamId: "team-alpha"
    })
  );
  assert.match(minigamePlayPriorityHtml, /Team Alpha/);

  const unknownTeamHtml = renderMiniRail(
    buildSnapshot(Phase.EATING, {
      activeRoundTeamId: "missing-team-id"
    })
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
    const html = renderMiniRail(
      buildSnapshot(phase, {
        roundTurnCursor: 0,
        turnOrderTeamIds: ["team-alpha", "team-beta"]
      })
    );

    assert.doesNotMatch(html, /Team Alpha/, `${phase} should not show active team`);
  }
});

test("does not render trivia prompt or answer payloads in rail", () => {
  const html = renderMiniRail(buildSnapshot(Phase.MINIGAME_PLAY));

  assert.doesNotMatch(html, /Which scale measures pepper heat/);
  assert.doesNotMatch(html, /Scoville/);
});
