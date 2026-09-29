import assert from "node:assert/strict";
import test from "node:test";
import type { SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, createSchlonicRunStart } from "@wingnight/shared";

import { resolveRiderPlacement } from "./index.js";

const RAIL_Y = SCHLONIC_WORLD.groundBaseY - 12;
const FLAT: SchlonicZone = {
  heights: Array.from({ length: 60 }, () => SCHLONIC_WORLD.groundBaseY),
  pits: [],
  props: [{ index: 0, kind: "rail", x: 200, toX: 248, y: RAIL_Y }],
  goalX: 560
};
const START = { ...createSchlonicRunStart(FLAT), tick: 30, x: 120 };
const { runnerX, runnerRadius, invulnerableTicks, jumpVelocity } = SCHLONIC_WORLD;

const translateX = (transform: string): number => Number(transform.match(/^translate\(([-\d.]+)/)?.[1] ?? NaN);

test("does lay the board under the hen's feet, wheels down, when it is rolling", () => {
  const placement = resolveRiderPlacement({ zone: FLAT, frame: START, screenX: runnerX, curl: 0 });

  assert.equal(placement.bail, null);
  assert.equal(placement.grinding, false);
  assert.equal(placement.boardRoll, 0);
  assert.ok(placement.board.startsWith(placement.hen.split(" rotate")[0] ?? "?"), "the board should ride with the hen");
  assert.equal(placement.sparks.visible, false);
});

test("does flip the board under the hen half way up an ollie", () => {
  const halfWay = { ...START, grounded: false, vy: jumpVelocity / 2, y: START.y - 10 };
  const takeOff = { ...START, grounded: false, vy: jumpVelocity, y: START.y - 1 };

  assert.equal(resolveRiderPlacement({ zone: FLAT, frame: halfWay, screenX: runnerX, curl: 1 }).boardRoll, 180);
  assert.equal(resolveRiderPlacement({ zone: FLAT, frame: takeOff, screenX: runnerX, curl: 0.45 }).boardRoll, 0);
});

test("does throw sparks off the back truck, on the rail's top, while grinding", () => {
  const grinding = { ...START, x: 220, y: RAIL_Y - runnerRadius, grindingRail: 0 };
  const placement = resolveRiderPlacement({ zone: FLAT, frame: grinding, screenX: runnerX, curl: 0 });

  assert.equal(placement.grinding, true);
  assert.equal(placement.sparks.visible, true);
  assert.equal(placement.sparks.y, RAIL_Y);
  assert.ok(placement.sparks.x < runnerX, "the back truck is behind the middle of the board");
  assert.ok(placement.hen.includes("rotate(-7"), "a 5-0 rides nose up");
});

test("does send the board off ahead in a bail and put the hen back on it as the window closes", () => {
  const hitAt = START.tick;
  const early = { ...START, tick: hitAt + Math.round(invulnerableTicks * 0.4), hits: [hitAt] };
  const late = { ...START, tick: hitAt + invulnerableTicks - 1, hits: [hitAt] };
  const bailing = resolveRiderPlacement({ zone: FLAT, frame: early, screenX: runnerX, curl: 0 });
  const back = resolveRiderPlacement({ zone: FLAT, frame: late, screenX: runnerX, curl: 0 });

  assert.ok(bailing.bail !== null && bailing.bail > 0.3);
  assert.ok(translateX(bailing.board) > runnerX + 10, `the board should be well ahead: ${bailing.board}`);
  assert.ok(bailing.stance !== back.stance, "the hen should stand on the street, then on the board");
  assert.ok(back.board.startsWith(back.hen.split(" rotate")[0] ?? "?"), "the board should be back under the hen");
});

test("does place the ghost by the same rule at its own x", () => {
  const runner = resolveRiderPlacement({ zone: FLAT, frame: START, screenX: runnerX, curl: 0 });
  const ghost = resolveRiderPlacement({ zone: FLAT, frame: START, screenX: runnerX + 30, curl: 0 });

  assert.equal(translateX(ghost.hen) - translateX(runner.hen), 30);
  assert.equal(ghost.stance, runner.stance);
});
