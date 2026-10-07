import assert from "node:assert/strict";
import test from "node:test";

import type { MountClimbResult, MountPile, MountPose } from "../types.js";
import { MOUNT_WORLD } from "../world/index.js";
import {
  addMountHen,
  createMountPile,
  resolveMountClimbTicks,
  resolveMountCrown,
  resolveMountPileBounds,
  resolveMountPileMesh
} from "./index.js";

const SEED = 20261002;
const RULES = { climbSeconds: 30, secondsPerHen: 3 };

const translate = (pose: MountPose, dx: number, dy: number): MountPose => {
  const moved = { ...pose };

  for (const key of Object.keys(pose) as (keyof MountPose)[]) {
    moved[key] = { x: pose[key].x + dx, y: pose[key].y + dy };
  }

  return moved;
};

/** A finished climb whose hen stands still-posed with its toes at (x, floor − lift). */
const resultAt = (x: number, lift: number, mounted: boolean, playerId: string): MountClimbResult => {
  const pose = translate(MOUNT_WORLD.rig.rest, x - MOUNT_WORLD.rig.rest.footRight.x, -lift - MOUNT_WORLD.rig.rest.footRight.y);

  return {
    outcome: mounted ? "mounted" : "timeout",
    endTick: 120,
    share: mounted ? 1 : 0.5,
    bestHeight: 83 + lift,
    falls: 0,
    hen: { pileIndex: 0, playerId, pose, grabs: { footLeft: pose.footLeft }, mounted }
  };
};

test("does deal the default seed a standing goose with the line at its head", () => {
  const pile = createMountPile(SEED);

  assert.equal(pile.goose, "stand");
  assert.deepEqual(pile.hens, []);
  assert.deepEqual(pile.highLine, { height: 160, x: 26, playerId: null });
  assert.equal(pile.seed, SEED);
});

test("does deal the same goose from the same seed and every stance across seeds", () => {
  const stances = new Set<string>();

  for (let seed = 0; seed < 60; seed += 1) {
    assert.deepEqual(createMountPile(seed), createMountPile(seed));
    stances.add(createMountPile(seed).goose);
  }

  assert.deepEqual([...stances].sort(), ["honk", "preen", "stand"]);
});

test("does give a climb (climbSeconds + secondsPerHen × hens) × tickHz ticks", () => {
  assert.equal(resolveMountClimbTicks(RULES, 0), 1800);
  assert.equal(resolveMountClimbTicks(RULES, 1), 1980);
  assert.equal(resolveMountClimbTicks(RULES, 5), (30 + 3 * 5) * 60);
  assert.equal(resolveMountClimbTicks({ climbSeconds: 20, secondsPerHen: 1 }, 20), 40 * 60);
});

test("does build the bare pile from three plinth capsules and the goose's own shapes", () => {
  const pile = createMountPile(SEED);
  const mesh = resolveMountPileMesh(pile);

  assert.equal(mesh.length, 3 + MOUNT_WORLD.goose.stand.shapes.length);
  assert.deepEqual(
    mesh.map((shape) => shape.surface.kind),
    ["plinth", "plinth", "plinth", "goose", "goose", "goose", "goose"]
  );
  assert.deepEqual(resolveMountPileBounds(pile), { minX: -76, maxX: 76, minY: -160 });
});

test("does find the crown of the still pose on the costume head's top", () => {
  const crown = resolveMountCrown(MOUNT_WORLD.rig.rest);

  assert.ok(Math.abs(crown.x - 58) < 1e-9);
  assert.ok(Math.abs(crown.y + 12) < 1e-9);
});

test("does append a frozen hen whose body, head, legs and near wing join the mesh", () => {
  const pile = createMountPile(SEED);
  const result = resultAt(-50, 66, false, "caitlin");
  const next = addMountHen(pile, result);

  assert.equal(next.hens.length, 1);
  assert.deepEqual(next.hens[0], { ...result.hen, pileIndex: 0 });
  assert.deepEqual(next.highLine, pile.highLine);
  assert.deepEqual(pile.hens, [], "the pile it was given is untouched");

  const henShapes = resolveMountPileMesh(next).filter((shape) => shape.surface.kind === "hen");

  assert.equal(henShapes.length, 5);
  assert.ok(henShapes.every((shape) => shape.surface.kind === "hen" && shape.surface.pileIndex === 0));
  assert.ok(henShapes.every((shape) => shape.r >= MOUNT_WORLD.minStaticRadius));

  const [body, head, legLeft, legRight] = henShapes;

  assert.ok(body?.kind === "circle" && head?.kind === "circle");
  assert.equal(body.r, 23);
  assert.equal(head.r, 22);
  assert.ok(legLeft?.kind === "capsule" && legRight?.kind === "capsule");
  assert.deepEqual(legLeft.b, result.hen.pose.footLeft);
  assert.deepEqual(legRight.b, result.hen.pose.footRight);
  assert.equal(legLeft.r, MOUNT_WORLD.minStaticRadius, "a stuck leg is a foothold a hair wider than drawn");
});

test("does move the line to a mounting hen's crown and hand it the climber's id", () => {
  const pile = createMountPile(SEED);
  const result = resultAt(-10, 120, true, "steve");
  const next = addMountHen(pile, result);
  const crown = resolveMountCrown(result.hen.pose);

  assert.deepEqual(next.highLine, { height: -crown.y, x: crown.x, playerId: "steve" });
  assert.equal(next.hens[0]?.mounted, true);
});

test("does number hens by the order they joined whatever index their result carried", () => {
  let pile: MountPile = createMountPile(SEED);

  for (let index = 0; index < 4; index += 1) {
    pile = addMountHen(pile, { ...resultAt(-60 + index * 10, 66, false, `p${index}`), hen: { ...resultAt(0, 66, false, `p${index}`).hen, pileIndex: 99 } });
  }

  assert.deepEqual(
    pile.hens.map((hen) => hen.pileIndex),
    [0, 1, 2, 3]
  );
});

test("does widen the bounds to a hen stuck left of the plinth", () => {
  const pile = addMountHen(createMountPile(SEED), resultAt(-150, 0, false, "lost"));

  assert.ok(resolveMountPileBounds(pile).minX < -150);
});

test("does survive a JSON round trip unchanged, as a pile sent over the wire must", () => {
  const pile = addMountHen(createMountPile(SEED), resultAt(-50, 66, false, "caitlin"));

  assert.deepEqual(JSON.parse(JSON.stringify(pile)), pile);
  assert.deepEqual(resolveMountPileMesh(JSON.parse(JSON.stringify(pile)) as MountPile), resolveMountPileMesh(pile));
});
