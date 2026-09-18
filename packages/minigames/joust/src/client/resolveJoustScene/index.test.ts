import assert from "node:assert/strict";
import test from "node:test";

import type { JoustMinigameShot, JoustPlayerFigure } from "@wingnight/shared";
import {
  JOUST_SHOOTER_HEAD_INDEX,
  resolveJoustRackSlots,
  resolveJoustRestFrame
} from "@wingnight/shared";

import { JOUST_TRAIL_FRAMES, resolveJoustScene } from "./index.js";

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
  isRackCleared: false,
  points: 0,
  aim: { x: -0.5, y: 0 },
  pinPlayerIds: ["p1"],
  run: {
    keyframeHz: 24,
    keyframes: Array.from({ length: 12 }, (_unused, index) => {
      const frame = [...restFrame];

      frame[JOUST_SHOOTER_HEAD_INDEX * 2] = 40 + index * 5;
      return frame;
    }),
    topples: []
  }
};

test("does leave no trail behind a shooter that has not been fired", () => {
  assert.deepEqual(resolveJoustScene(ARENA, LINEUP, [], SLACK, null, 0).trail, []);
});

test("does trail the head through the frames already flown, oldest first, when a shot is replaying", () => {
  const scene = resolveJoustScene(ARENA, LINEUP, [], SLACK, flight, 10);

  assert.equal(scene.trail.length, JOUST_TRAIL_FRAMES);
  assert.deepEqual(
    scene.trail.map((at) => at.x),
    [50, 55, 60, 65, 70, 75, 80, 85]
  );
});

test("does trail only what has flown when the shot has just left the band", () => {
  assert.deepEqual(
    resolveJoustScene(ARENA, LINEUP, [], SLACK, flight, 2).trail.map((at) => at.x),
    [40, 45]
  );
});

test("does stop the trail short of the frame on screen, so the head is never ghosted twice", () => {
  const scene = resolveJoustScene(ARENA, LINEUP, [], SLACK, flight, 40);
  const headX = scene.frame[JOUST_SHOOTER_HEAD_INDEX * 2];

  assert.equal(headX, 95, "a replay index past the end holds the last frame");
  assert.ok(scene.trail.every((at) => at.x < 95));
});

test("does draw a shot between two keyframes when the replay index falls between them", () => {
  const scene = resolveJoustScene(ARENA, LINEUP, [], SLACK, flight, 3.25);

  assert.ok(Math.abs((scene.frame[JOUST_SHOOTER_HEAD_INDEX * 2] ?? 0) - 56.25) < 1e-9);
  assert.deepEqual(
    scene.trail.map((at) => at.x),
    [40, 45, 50]
  );
});
