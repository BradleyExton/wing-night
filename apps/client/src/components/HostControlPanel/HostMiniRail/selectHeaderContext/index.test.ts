import assert from "node:assert/strict";
import test from "node:test";
import { Phase, type RoomState } from "@wingnight/shared";

import { buildRoomState } from "../../../../testSupport/roomStateFixtures";
import { hostControlPanelCopy } from "../../copy";
import { selectHeaderContext } from "./index";

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

test("returns waiting context when room state is missing", () => {
  const context = selectHeaderContext(null, teamNameByTeamId);

  assert.equal(context.phaseTitle, hostControlPanelCopy.headerWaitingTitle);
  assert.equal(context.phaseDescription, hostControlPanelCopy.headerWaitingDescription);
  assert.equal(context.roundLabel, hostControlPanelCopy.headerPreGameLabel);
  assert.equal(context.activeTeamName, null);
});

test("returns round-intro sauce and minigame context", () => {
  const context = selectHeaderContext(
    buildSnapshot(Phase.ROUND_INTRO, { currentRound: 2, totalRounds: 5 }),
    teamNameByTeamId
  );

  assert.equal(context.roundLabel, "Round 2 of 5");
  assert.equal(context.roundIntroSauce, "Frank's");
  assert.equal(context.roundIntroMinigame, "TRIVIA");
  assert.equal(context.activeTeamName, null);
});

test("prefers active-turn team in MINIGAME_PLAY and falls back to active-round team", () => {
  const fallbackContext = selectHeaderContext(
    buildSnapshot(Phase.MINIGAME_PLAY, {
      activeRoundTeamId: "team-beta",
      activeTurnTeamId: null
    }),
    teamNameByTeamId
  );

  assert.equal(fallbackContext.activeTeamName, "Team Beta");

  const priorityContext = selectHeaderContext(
    buildSnapshot(Phase.MINIGAME_PLAY, {
      activeRoundTeamId: "team-beta",
      activeTurnTeamId: "team-alpha"
    }),
    teamNameByTeamId
  );

  assert.equal(priorityContext.activeTeamName, "Team Alpha");
});

test("returns fallback team label when active team id is missing from team map", () => {
  const context = selectHeaderContext(
    buildSnapshot(Phase.EATING, { activeRoundTeamId: "missing-team-id" }),
    teamNameByTeamId
  );

  assert.equal(context.activeTeamName, hostControlPanelCopy.noAssignedTeamLabel);
});

test("does not expose active team context in non-turn phases", () => {
  const context = selectHeaderContext(
    buildSnapshot(Phase.FINAL_RESULTS, {
      activeRoundTeamId: "team-alpha",
      activeTurnTeamId: "team-beta"
    }),
    teamNameByTeamId
  );

  assert.equal(context.activeTeamName, null);
});
