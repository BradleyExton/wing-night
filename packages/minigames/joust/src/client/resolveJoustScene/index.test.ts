import assert from "node:assert/strict";
import test from "node:test";

import type { JoustMinigameShot, JoustPlayerFigure, JoustShotGhost } from "@wingnight/shared";
import {
  JOUST_PIN_FOOT_RADIUS,
  JOUST_SHOOTER_HEAD_INDEX,
  JOUST_WORLD,
  resolveJoustRackSlots,
  resolveJoustRestFrame
} from "@wingnight/shared";

import { JOUST_TRAIL_FRAMES, resolveJoustScene, type JoustSceneInput } from "./index.js";

const PERCHES = [{ x: 54, y: 78, width: 102 }];
const ARENA = { id: "arena-1", name: "Open Range", perches: PERCHES, obstacles: [] };
const LINEUP: JoustPlayerFigure[] = [
  { playerId: "p1", name: "Rosie", avatarSrc: null, teamId: "team-2", genre: null }
];
const SLACK = { x: 0, y: 0 };

const restFrame = resolveJoustRestFrame(
  { pinFeet: resolveJoustRackSlots(PERCHES, LINEUP.length), perches: PERCHES, obstacles: [] },
  SLACK
);

// A track whose shooter head marches five units right per frame, from the fork.
const flight: JoustMinigameShot = {
  shotNumber: 1,
  toppledPlayerIds: [],
  collapsedPerchIndices: [],
  isRackCleared: false,
  points: 0,
  aim: { x: -0.5, y: 0 },
  pinPlayerIds: ["p1"],
  rubblePerchIndices: [],
  run: {
    keyframeHz: 24,
    keyframes: Array.from({ length: 12 }, (_unused, index) => {
      const frame = [...restFrame];

      frame[JOUST_SHOOTER_HEAD_INDEX * 2] = 40 + index * 5;
      return frame;
    }),
    topples: [],
    collapses: []
  }
};

const GHOST: JoustShotGhost = {
  shotNumber: 1,
  aim: { x: -0.5, y: 0 },
  path: [
    { x: 40, y: 46 },
    { x: 60, y: 40 }
  ]
};

const scene = (overrides: Partial<JoustSceneInput> = {}) =>
  resolveJoustScene({
    arena: ARENA,
    lineup: LINEUP,
    downPlayerIds: [],
    collapsedPerchIndices: [],
    aim: SLACK,
    lastShot: null,
    replayIndex: 0,
    previousShotGhost: null,
    ...overrides
  });

test("does leave no trail behind a shooter that has not been fired", () => {
  assert.deepEqual(scene().trail, []);
});

test("does trail the head through the frames already flown, oldest first, when a shot is replaying", () => {
  const replaying = scene({ lastShot: flight, replayIndex: 10 });

  assert.equal(replaying.trail.length, JOUST_TRAIL_FRAMES);
  assert.deepEqual(
    replaying.trail.map((at) => at.x),
    [50, 55, 60, 65, 70, 75, 80, 85]
  );
});

test("does trail only what has flown when the shot has just left the band", () => {
  assert.deepEqual(
    scene({ lastShot: flight, replayIndex: 2 }).trail.map((at) => at.x),
    [40, 45]
  );
});

test("does stop the trail short of the frame on screen, so the head is never ghosted twice", () => {
  const replaying = scene({ lastShot: flight, replayIndex: 40 });
  const headX = replaying.frame[JOUST_SHOOTER_HEAD_INDEX * 2];

  assert.equal(headX, 95, "a replay index past the end holds the last frame");
  assert.ok(replaying.trail.every((at) => at.x < 95));
});

test("does draw a shot between two keyframes when the replay index falls between them", () => {
  const between = scene({ lastShot: flight, replayIndex: 3.25 });

  assert.ok(Math.abs((between.frame[JOUST_SHOOTER_HEAD_INDEX * 2] ?? 0) - 56.25) < 1e-9);
  assert.deepEqual(
    between.trail.map((at) => at.x),
    [40, 45, 50]
  );
});

test("does show the previous shot's ghost only while a fresh band is being aimed", () => {
  assert.deepEqual(scene({ previousShotGhost: GHOST }).ghost, GHOST);
  assert.equal(scene({ previousShotGhost: GHOST, lastShot: flight, replayIndex: 3 }).ghost, null);
});

const TOWER_PERCHES = [
  { x: 54, y: 78, width: 102 },
  { x: 116, y: 50, width: 34 }
];
const TOWER_ARENA = { id: "arena-2", name: "The Lookout", perches: TOWER_PERCHES, obstacles: [] };
const TOWER_LINEUP: JoustPlayerFigure[] = [
  { playerId: "p1", name: "Rosie", avatarSrc: null, teamId: "team-2", genre: null },
  { playerId: "p2", name: "Darren", avatarSrc: null, teamId: "team-2", genre: null },
  { playerId: "p3", name: "Sarah", avatarSrc: null, teamId: "team-2", genre: null }
];

test("does stand a tower's legs in the rest pose and lay it out as rubble once it is down", () => {
  const standing = scene({ arena: TOWER_ARENA, lineup: TOWER_LINEUP });
  const rubble = scene({ arena: TOWER_ARENA, lineup: TOWER_LINEUP, collapsedPerchIndices: [1] });

  assert.equal(standing.legs.length, 2);
  assert.deepEqual(standing.rubblePerchIndices, []);
  for (const leg of standing.legs) {
    assert.equal(leg.perchIndex, 1);
    assert.equal(leg.foot.x, leg.top.x, "bolt upright at rest");
    assert.ok(leg.top.y < leg.foot.y);
  }

  assert.deepEqual(rubble.legs, []);
  assert.deepEqual(rubble.rubblePerchIndices, [1]);
});

test("does lay a felled player on the sand once their tower has come down", () => {
  const shelfPlayer = scene({ arena: TOWER_ARENA, lineup: TOWER_LINEUP }).pins.find(
    (pin) => pin.perchIndex === 1
  );

  assert.ok(shelfPlayer !== undefined);

  const before = scene({
    arena: TOWER_ARENA,
    lineup: TOWER_LINEUP,
    downPlayerIds: [shelfPlayer.playerId]
  });
  const after = scene({
    arena: TOWER_ARENA,
    lineup: TOWER_LINEUP,
    downPlayerIds: [shelfPlayer.playerId],
    collapsedPerchIndices: [1]
  });

  assert.equal(before.fallen[0]?.y, shelfPlayer.y, "lying on the shelf while it stands");
  assert.equal(after.fallen[0]?.y, JOUST_WORLD.floorY - JOUST_PIN_FOOT_RADIUS);
  assert.equal(after.fallen[0]?.x, shelfPlayer.x);
});

test("does keep a replaying track's own towers, and dust the one it is folding", () => {
  const pins = resolveJoustRackSlots(TOWER_PERCHES, TOWER_LINEUP.length);
  const rest = resolveJoustRestFrame(
    { pinFeet: pins, perches: TOWER_PERCHES, obstacles: [] },
    SLACK
  );
  const timber: JoustMinigameShot = {
    ...flight,
    collapsedPerchIndices: [1],
    pinPlayerIds: TOWER_LINEUP.map((figure) => figure.playerId),
    run: {
      keyframeHz: 24,
      keyframes: Array.from({ length: 30 }, () => [...rest]),
      topples: [],
      collapses: [{ perchIndex: 1, frameIndex: 10 }]
    }
  };
  const input = {
    arena: TOWER_ARENA,
    lineup: TOWER_LINEUP,
    // The state already knows the tower is down; the track still has its legs.
    collapsedPerchIndices: [1],
    lastShot: timber
  };

  assert.equal(scene({ ...input, replayIndex: 5 }).legs.length, 2);
  assert.deepEqual(scene({ ...input, replayIndex: 5 }).rubblePerchIndices, []);
  assert.deepEqual(scene({ ...input, replayIndex: 5 }).collapsingPerchIndices, []);
  assert.deepEqual(scene({ ...input, replayIndex: 12 }).collapsingPerchIndices, [1]);
  assert.deepEqual(scene({ ...input, replayIndex: 29 }).collapsingPerchIndices, []);
});
