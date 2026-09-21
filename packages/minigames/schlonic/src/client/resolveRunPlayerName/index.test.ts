import assert from "node:assert/strict";
import test from "node:test";

import type { SchlonicMinigameRun, SchlonicPlayerFigure } from "@wingnight/shared";

import { resolveRunPlayerName } from "./index.js";

const ALEX: SchlonicPlayerFigure = {
  playerId: "p-1",
  name: "Alex",
  avatarSrc: null,
  teamId: "team-alpha",
  genre: "country"
};

const run = (player: SchlonicPlayerFigure | null): SchlonicMinigameRun => ({
  runIndex: 0,
  player,
  status: "ready",
  inputs: [],
  skipped: false,
  result: null
});

test("does name the player standing on the run", () => {
  assert.equal(resolveRunPlayerName(run(ALEX)), "Alex");
});

test("does answer null when the run has no player", () => {
  assert.equal(resolveRunPlayerName(run(null)), null);
  assert.equal(resolveRunPlayerName(null), null);
  assert.equal(resolveRunPlayerName(undefined), null);
});
