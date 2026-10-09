import assert from "node:assert/strict";
import test from "node:test";

import type { GameConfigRound } from "../validateGameConfigFile/index.js";
import { resolveRoundMinigameMax } from "./index.js";

const round = (roundNumber: number, minigameMax?: number): GameConfigRound => ({
  round: roundNumber,
  label: `Round ${roundNumber}`,
  sauce: "Mild",
  pointsPerPlayer: 2,
  minigame: "TRIVIA",
  ...(minigameMax === undefined ? {} : { minigameMax })
});

const config = (rounds: GameConfigRound[]) => ({
  rounds,
  minigameScoring: { defaultMax: 15, finalRoundMax: 20 }
});

test("does take the default max for a round that sets none", () => {
  assert.equal(resolveRoundMinigameMax(config([round(1), round(2), round(3)]), 1), 15);
});

test("does take the final-round max for the last round when it sets none", () => {
  assert.equal(resolveRoundMinigameMax(config([round(1), round(2), round(3)]), 2), 20);
});

test("does take a round's own max over both defaults when it sets one", () => {
  const rounds = [round(1, 8), round(2), round(3, 30)];

  assert.equal(resolveRoundMinigameMax(config(rounds), 0), 8);
  assert.equal(resolveRoundMinigameMax(config(rounds), 2), 30);
});

test("does take the default max for a round outside the night", () => {
  assert.equal(resolveRoundMinigameMax(config([round(1)]), -1), 15);
  assert.equal(resolveRoundMinigameMax(config([round(1)]), 4), 15);
});
