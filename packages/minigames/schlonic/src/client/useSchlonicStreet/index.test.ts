import assert from "node:assert/strict";
import test from "node:test";
import { SCHLONIC_WORLD, resolveSchlonicCourse, resolveSchlonicZone } from "@wingnight/shared";

import { resolveSchlonicStreet } from "./index.js";

const VIEW = { zoneSeed: 4, zoneChunks: 8, runsPerTurn: 3, bestTurn: null };

test("cuts the leg a run is on out of the whole street", () => {
  const street = resolveSchlonicStreet(VIEW, 1);

  assert.deepEqual(street.legCourse, { seed: 4, chunks: 8, legs: 3, leg: 1 });
  assert.deepEqual(street.zone, resolveSchlonicZone(street.legCourse));
  assert.deepEqual(street.course, resolveSchlonicCourse({ seed: 4, chunks: 8, legs: 3 }));
  assert.equal(street.legWidth, 8 * SCHLONIC_WORLD.chunkWidth);
  assert.equal(street.track.fromX, street.legWidth);
  assert.equal(street.track.course, street.course);
});

test("hands a leg the other team's rider for that leg, and nobody where that leg was skipped", () => {
  const leg = { player: null, inputs: [], outcome: "cleared" as const, wings: 9, endTick: 400 };
  const bestTurn = { teamId: "team-b", teamName: "Team B", wings: 9, legs: [leg, null, leg] };

  assert.deepEqual(resolveSchlonicStreet({ ...VIEW, bestTurn }, 0).ghostLeg, leg);
  assert.equal(resolveSchlonicStreet({ ...VIEW, bestTurn }, 1).ghostLeg, null);
  assert.equal(resolveSchlonicStreet(VIEW, 0).ghostLeg, null);
});
