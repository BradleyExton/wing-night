import assert from "node:assert/strict";
import test from "node:test";

import type { GameConfigFile } from "@wingnight/shared";

import {
  addRound,
  parsePositiveInteger,
  removeRound,
  setGameConfigName,
  setRoundField,
  setScoring,
  setTimer
} from "./index";

const buildGameConfig = (): GameConfigFile => ({
  name: "House Party Pack",
  rounds: [
    {
      round: 1,
      label: "Warm Up",
      sauce: "Frank's",
      pointsPerPlayer: 2,
      minigame: "TRIVIA"
    },
    {
      round: 2,
      label: "Second Heat",
      sauce: "Classic Buffalo",
      pointsPerPlayer: 3,
      minigame: "GEO"
    },
    {
      round: 3,
      label: "Final Fire",
      sauce: "Ghost Pepper",
      pointsPerPlayer: 4,
      minigame: "DRAWING"
    }
  ],
  minigameScoring: { defaultMax: 15, finalRoundMax: 20 },
  timers: {
    eatingSeconds: 120,
    triviaSeconds: 30,
    geoSeconds: 45,
    drawingSeconds: 60
  }
});

test("sets the pack name when the identity step edits it", () => {
  assert.equal(setGameConfigName(buildGameConfig(), "Late Shift").name, "Late Shift");
});

test("edits only the addressed round when a lineup field changes", () => {
  const edited = setRoundField(buildGameConfig(), 1, { sauce: "Da Bomb" });

  assert.equal(edited.rounds[1]?.sauce, "Da Bomb");
  assert.equal(edited.rounds[0]?.sauce, "Frank's");
  assert.equal(edited.rounds[2]?.sauce, "Ghost Pepper");
});

test("leaves the source config untouched when a round field changes", () => {
  const gameConfig = buildGameConfig();

  setRoundField(gameConfig, 0, { label: "Mutated" });

  assert.equal(gameConfig.rounds[0]?.label, "Warm Up");
});

test("appends a round numbered after the existing ones when a round is added", () => {
  const added = addRound(buildGameConfig());

  assert.equal(added.rounds.length, 4);
  assert.equal(added.rounds[3]?.round, 4);
});

// A blank label is the signal the implementer wants the host to fill it in;
// the sauce/scoring carry over so the new round is not born invalid on three
// fields at once.
test("seeds an added round from the previous one when there is a last round", () => {
  const added = addRound(buildGameConfig());

  assert.equal(added.rounds[3]?.sauce, "Ghost Pepper");
  assert.equal(added.rounds[3]?.pointsPerPlayer, 4);
  assert.equal(added.rounds[3]?.minigame, "DRAWING");
  assert.equal(added.rounds[3]?.label, "");
});

test("seeds an added round from defaults when the lineup is empty", () => {
  const added = addRound({ ...buildGameConfig(), rounds: [] });

  assert.equal(added.rounds.length, 1);
  assert.equal(added.rounds[0]?.round, 1);
  assert.equal(added.rounds[0]?.pointsPerPlayer, 1);
});

test("drops the addressed round when a round is removed", () => {
  const removed = removeRound(buildGameConfig(), 1);

  assert.equal(removed.rounds.length, 2);
  assert.deepEqual(
    removed.rounds.map((round) => round.label),
    ["Warm Up", "Final Fire"]
  );
});

// The shared validator rejects a round whose `round` is not its index + 1
// ("must be N so round numbers stay contiguous"), so a removal that did not
// re-number would produce a draft that cannot be applied.
test("renumbers the surviving rounds contiguously when a middle round is removed", () => {
  const removed = removeRound(buildGameConfig(), 1);

  assert.deepEqual(
    removed.rounds.map((round) => round.round),
    [1, 2]
  );
});

test("sets the addressed timer when a clock changes", () => {
  const edited = setTimer(buildGameConfig(), "triviaSeconds", 45);

  assert.equal(edited.timers.triviaSeconds, 45);
  assert.equal(edited.timers.eatingSeconds, 120);
});

test("merges a partial scoring edit over the existing scoring", () => {
  const edited = setScoring(buildGameConfig(), { finalRoundMax: 30 });

  assert.equal(edited.minigameScoring.finalRoundMax, 30);
  assert.equal(edited.minigameScoring.defaultMax, 15);
});

test("parses a positive integer when the field holds one", () => {
  assert.equal(parsePositiveInteger("45", 30), 45);
});

// Typing "12" passes through "" and "1"; falling back keeps the draft a valid
// GameConfigFile at every keystroke instead of parking NaN in a number field.
test("falls back to the previous value when the field is cleared mid-edit", () => {
  assert.equal(parsePositiveInteger("", 30), 30);
});

test("falls back to the previous value when the field is not a number", () => {
  assert.equal(parsePositiveInteger("abc", 30), 30);
});

test("falls back to the previous value when the field is zero or negative", () => {
  assert.equal(parsePositiveInteger("0", 30), 30);
  assert.equal(parsePositiveInteger("-5", 30), 30);
});
