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

test("returns sauce and minigame context on the team briefing", () => {
  const context = selectHeaderContext(
    buildSnapshot(Phase.MINIGAME_INTRO, {
      currentRound: 2,
      totalRounds: 5,
      activeRoundTeamId: "team-alpha"
    }),
    teamNameByTeamId
  );

  assert.equal(context.roundLabel, "Round 2 of 5");
  assert.equal(context.sauceLabel, "Frank's");
  assert.equal(context.minigameLabel, "Trivia");
  assert.equal(context.activeTeamName, "Team Alpha");
});

// The rail says the same four things on every phase (DESIGN.md §2.0A); it used
// to drop the sauce and the game once the briefing was over.
test("keeps sauce and minigame context once the round is under way", () => {
  const context = selectHeaderContext(
    buildSnapshot(Phase.EATING, { currentRound: 2, totalRounds: 5 }),
    teamNameByTeamId
  );

  assert.equal(context.sauceLabel, "Frank's");
  assert.equal(context.minigameLabel, "Trivia");
});

test("holds a placeholder in the game slot before any round exists", () => {
  const context = selectHeaderContext(
    { ...buildSnapshot(Phase.SETUP), currentRoundConfig: null },
    teamNameByTeamId
  );

  assert.equal(context.sauceLabel, null);
  assert.equal(context.minigameLabel, "No game yet");
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
