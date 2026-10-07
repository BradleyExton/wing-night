import assert from "node:assert/strict";
import test from "node:test";
import type { ContestantTurn } from "@wingnight/shared";

import { resolveBriefingHandset, resolveLegHandset } from "./index";

const TURN: ContestantTurn = {
  minigame: "FAPPY",
  deviceMode: "phones",
  legIndex: 1,
  contestantPlayerId: "caitlin",
  nextContestantPlayerId: null,
  controller: "phone",
  tabletLegIndexes: [],
  droppedPlayerId: null
};

test("does say the phone plays the leg when the server says the phone holds it", () => {
  assert.equal(resolveLegHandset(TURN), "phone");
});

test("does say the tablet plays the leg when a phones turn's player has no phone", () => {
  assert.equal(resolveLegHandset({ ...TURN, controller: "tablet" }), "tablet");
  assert.equal(resolveLegHandset(null), "tablet");
});

test("does keep the leg on the phone when that phone dropped and nobody took it back", () => {
  assert.equal(resolveLegHandset({ ...TURN, controller: "tablet", droppedPlayerId: "caitlin" }), "phone");
});

test("does brief the team onto phones when the turn is on phones and one of them has a phone", () => {
  assert.equal(resolveBriefingHandset(TURN, ["alex", "caitlin"], ["caitlin"]), "phone");
});

test("does brief the team onto the tablet when nobody on it has a phone seated", () => {
  assert.equal(resolveBriefingHandset(TURN, ["alex", "caitlin"], ["rob"]), "tablet");
  assert.equal(resolveBriefingHandset({ ...TURN, deviceMode: "tablet" }, ["alex"], ["alex"]), "tablet");
  assert.equal(resolveBriefingHandset(null, ["alex"], ["alex"]), "tablet");
});
