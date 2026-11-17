import assert from "node:assert/strict";
import test from "node:test";

import type { MinigameCrew } from "@wingnight/minigames-core";
import { PLAYER_MINIGAME_ACTION_REFUSAL_REASONS, type CrewTurn } from "@wingnight/shared";

import { deriveCrewTurn, resolveCrewActionRefusal } from "./index.js";

// No game implements `selectCrew` until Streets of Barrie moves over (spec §0.8 step 3), so these
// pin the two decisions the room makes about a crew against a crew handed in by hand.
const lockedTurn = (deviceMode: CrewTurn["deviceMode"] = "phones"): CrewTurn => ({
  minigame: "BRAWL",
  deviceMode,
  status: null,
  playerIds: [],
  pads: {}
});

const crew: MinigameCrew = {
  status: "running",
  playerIds: ["player-1", "player-2", "player-3"],
  pads: {
    "player-1": { state: "up", slot: 0, hearts: 3 },
    "player-2": { state: "down", slot: 1, hearts: 0 },
    "player-3": { state: "out", slot: null, hearts: 0 }
  }
};

test("does copy the game's crew and its pads into the turn when the turn is locked to phones", () => {
  assert.deepEqual(deriveCrewTurn(lockedTurn(), crew), {
    minigame: "BRAWL",
    deviceMode: "phones",
    status: "running",
    playerIds: ["player-1", "player-2", "player-3"],
    pads: crew.pads
  });
});

test("does give no phone a pad when the turn is locked to the tablet", () => {
  const turn = deriveCrewTurn(lockedTurn("tablet"), crew);

  assert.equal(turn.status, "running");
  assert.deepEqual(turn.playerIds, []);
  assert.deepEqual(turn.pads, {});
});

test("does clear the crew and keep the lock when no stage is in hand", () => {
  const playing = deriveCrewTurn(lockedTurn(), crew);

  assert.deepEqual(deriveCrewTurn(playing, null), lockedTurn());
});

test("does let any player on the crew send a phone action when the turn is locked to phones", () => {
  const turn = deriveCrewTurn(lockedTurn(), crew);

  // Every one of them at once: there is no leg in hand and no single writer. A downed player and
  // one who has not stepped out may still send — stepping out is itself an action.
  for (const playerId of crew.playerIds) {
    assert.equal(resolveCrewActionRefusal(turn, "BRAWL", playerId, true), null);
  }
});

test("does refuse a player who is not on the crew when a phone sends an action", () => {
  const turn = deriveCrewTurn(lockedTurn(), crew);

  assert.equal(
    resolveCrewActionRefusal(turn, "BRAWL", "player-9", true),
    PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_IN_CREW
  );
});

test("does refuse a hatch from a crew player's phone when the action is the host's", () => {
  const turn = deriveCrewTurn(lockedTurn(), crew);

  assert.equal(
    resolveCrewActionRefusal(turn, "BRAWL", "player-1", false),
    PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.HOST_ONLY_ACTION
  );
});

test("does refuse every phone when the turn is locked to the tablet, is another game's or is not a crew turn", () => {
  const tablet = deriveCrewTurn(lockedTurn("tablet"), crew);

  for (const turn of [tablet, null]) {
    assert.equal(
      resolveCrewActionRefusal(turn, "BRAWL", "player-1", true),
      PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.TABLET_MODE
    );
  }

  assert.equal(
    resolveCrewActionRefusal(deriveCrewTurn(lockedTurn(), crew), "MOUNT", "player-1", true),
    PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.TABLET_MODE
  );
});
