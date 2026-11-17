import assert from "node:assert/strict";
import test from "node:test";

import { CONTESTANT_MINIGAME_TYPES } from "../contestantTurn/index.js";
import { CREW_MINIGAME_TYPES, isCrewMinigameType, isCrewPhoneTurn, isPhoneMinigameType, type CrewTurn } from "./index.js";

const turn = (deviceMode: CrewTurn["deviceMode"]): CrewTurn => ({
  minigame: "BRAWL",
  deviceMode,
  status: "ready",
  playerIds: ["player-1"],
  pads: { "player-1": { state: "out", slot: null, hearts: 0 } }
});

test("does count every relay and every crew game as a game a phone plays a part in", () => {
  for (const minigame of [...CONTESTANT_MINIGAME_TYPES, ...CREW_MINIGAME_TYPES]) {
    assert.equal(isPhoneMinigameType(minigame), true, minigame);
  }

  for (const minigame of ["TRIVIA", "GEO", "DRAWING", "nonsense", null]) {
    assert.equal(isPhoneMinigameType(minigame), false, String(minigame));
    assert.equal(isCrewMinigameType(minigame), false, String(minigame));
  }
});

test("does never list a game as both a relay and a crew game", () => {
  for (const minigame of CREW_MINIGAME_TYPES) {
    assert.equal(CONTESTANT_MINIGAME_TYPES.some((relay) => relay === minigame), false, minigame);
  }
});

test("does call a crew turn the phones' only when it is locked to phones", () => {
  assert.equal(isCrewPhoneTurn(turn("phones")), true);
  assert.equal(isCrewPhoneTurn(turn("tablet")), false);
  assert.equal(isCrewPhoneTurn(null), false);
});
