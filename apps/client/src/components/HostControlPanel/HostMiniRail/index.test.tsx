import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phase, type RoomState } from "@wingnight/shared";

import { buildRoomState } from "../../../testSupport/roomStateFixtures";
import { HostMiniRail } from "./index";

const teamNameByTeamId = new Map<string, string>([
  ["team-alpha", "Team Alpha"],
  ["team-beta", "Team Beta"]
]);

const buildSnapshot = (
  phase: Phase,
  overrides: Partial<RoomState> = {}
): RoomState => {
  return buildRoomState({ phase, ...overrides });
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
