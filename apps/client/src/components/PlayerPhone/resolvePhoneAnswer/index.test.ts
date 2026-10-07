import assert from "node:assert/strict";
import test from "node:test";

import { Phase, type MinigamePlayerView, type Team } from "@wingnight/shared";

import { resolvePhoneAnswer } from "./index";

const teams: Team[] = [
  { id: "team-1", name: "Alpha", playerIds: ["player-1", "player-2"], totalScore: 0 },
  { id: "team-2", name: "Beta", playerIds: ["player-3"], totalScore: 0 }
];

const card: MinigamePlayerView = {
  minigame: "TRIVIA",
  promptId: "mc-1",
  question: "Hottest?",
  choices: ["A", "B"],
  status: "open",
  choiceIndex: null,
  isCorrect: null
};

const room = (phase: Phase) => ({ phase, teams, activeRoundTeamId: "team-1", activeTurnTeamId: "team-1" });

test("does show the card when it is this player's team's turn being played", () => {
  assert.equal(resolvePhoneAnswer(room(Phase.MINIGAME_PLAY), "player-2", card), card);
});

test("does show no card when the phase or the team has moved on", () => {
  assert.equal(resolvePhoneAnswer(room(Phase.TURN_RESULTS), "player-2", card), null);
  assert.equal(resolvePhoneAnswer(room(Phase.MINIGAME_PLAY), "player-3", card), null);
  assert.equal(resolvePhoneAnswer(room(Phase.MINIGAME_PLAY), "player-1", null), null);
});
