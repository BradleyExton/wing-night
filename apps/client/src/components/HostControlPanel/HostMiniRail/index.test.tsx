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
    buildSnapshot(Phase.MINIGAME_INTRO, { currentRound: 2, totalRounds: 5 })
  );

  assert.match(html, /Round 2 of 5/);
  assert.match(html, /Frank&#x27;s/);
  assert.match(html, />Trivia</);
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

test("hides the briefing's sauce and minigame outside MINIGAME_INTRO", () => {
  const html = renderMiniRail(buildSnapshot(Phase.EATING));

  assert.doesNotMatch(html, /Frank/);
  assert.doesNotMatch(html, />Trivia</);
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

// The dot beside the team's name was `bg-primary` here and in five minigame
// copies, so the one mark on the host that stands for a team was never that
// team's colour (docs/takeover-layout-api.md P6). The rail reads the host's
// own `teamThemeByTeamId` — the same map the standings, the roster and the
// birds read — rather than resolving a theme of its own.
const readTeamDotClassName = (html: string): string => {
  return /<span class="(h-2 w-2 rounded-full[^"]*)"/.exec(html)?.[1] ?? "";
};

test("paints the rail's team dot in the active team's own colour", () => {
  const alphaHtml = renderMiniRail(
    buildSnapshot(Phase.MINIGAME_PLAY, { activeTurnTeamId: "team-alpha" })
  );
  const betaHtml = renderMiniRail(
    buildSnapshot(Phase.MINIGAME_PLAY, { activeTurnTeamId: "team-beta" })
  );
  const alphaDot = readTeamDotClassName(alphaHtml);
  const betaDot = readTeamDotClassName(betaHtml);

  assert.match(alphaDot, /bg-team[A-H]\b/);
  assert.match(betaDot, /bg-team[A-H]\b/);
  // The tint is what the dot's glow reads, so the halo is the team's colour too.
  assert.match(alphaDot, /--tint:theme\(colors\.team[A-H]\)/);
  assert.doesNotMatch(alphaDot, /bg-primary/);
  // Two teams, two colours: a dot that is always the same class is the bug.
  assert.notEqual(alphaDot, betaDot);
});

test("falls back to the house accent when the phase has no team to colour", () => {
  const html = renderMiniRail(
    buildSnapshot(Phase.EATING, { activeRoundTeamId: "missing-team-id" })
  );

  assert.match(html, /No team assigned/);
  assert.match(readTeamDotClassName(html), /bg-primary/);
});
