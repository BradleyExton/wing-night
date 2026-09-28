import assert from "node:assert/strict";
import test from "node:test";
import { SCHLONIC_WORLD, createSchlonicRunStart, resolveSchlonicFinaleX, resolveSchlonicZone } from "@wingnight/shared";

import { resolveMirrorEvents } from "./index.js";

const ZONE = resolveSchlonicZone({ seed: 20260919, chunks: 22 });
const START = createSchlonicRunStart(ZONE);
const wingIndexes = ZONE.props.filter((prop) => prop.kind === "wing").map((prop) => prop.index);
const badnikIndex = ZONE.props.find((prop) => prop.kind === "badnik")?.index ?? -1;

test("does chime once for a step's wings, at the handful it ended on", () => {
  const next = { ...START, tick: 3, wings: 3, takenProps: wingIndexes.slice(0, 3) };

  assert.deepEqual(resolveMirrorEvents(START, next, ZONE), [{ kind: "wing", wingsInHand: 3 }]);
});

test("does tell a pop from a wing by what was taken", () => {
  const popped = { ...START, tick: 3, wings: 3, takenProps: [badnikIndex] };

  assert.deepEqual(resolveMirrorEvents(START, popped, ZONE), [{ kind: "pop" }]);
});

test("does hear a springboard in the velocity and a hit in the log", () => {
  const sprung = { ...START, tick: 2, vy: SCHLONIC_WORLD.springVelocity, grounded: false };
  const hit = { ...START, tick: 2, hits: [2], wings: 4 };

  assert.deepEqual(resolveMirrorEvents(START, sprung, ZONE), [{ kind: "spring" }]);
  assert.deepEqual(resolveMirrorEvents(START, hit, ZONE), [{ kind: "hit" }]);
  // Still on the springboard's launch the next frame: no second boing.
  assert.deepEqual(resolveMirrorEvents(sprung, { ...sprung, tick: 3 }, ZONE), []);
});

test("does call the finale once, as the runner crosses into the last two chunks", () => {
  const finaleX = resolveSchlonicFinaleX(ZONE);
  const before = { ...START, tick: 700, x: finaleX - 1 };
  const after = { ...START, tick: 701, x: finaleX + 0.5 };

  assert.deepEqual(resolveMirrorEvents(before, after, ZONE), [{ kind: "finale" }]);
  assert.deepEqual(resolveMirrorEvents(after, { ...after, tick: 702, x: finaleX + 2 }, ZONE), []);
});

test("does announce an ending once, and nothing for a frame that did not move on", () => {
  const cleared = { ...START, tick: 900, outcome: "cleared" as const };

  assert.deepEqual(resolveMirrorEvents(START, cleared, ZONE), [{ kind: "cleared" }]);
  assert.deepEqual(resolveMirrorEvents(cleared, cleared, ZONE), []);
  assert.deepEqual(resolveMirrorEvents(cleared, { ...cleared, tick: 901 }, ZONE), []);
  assert.deepEqual(resolveMirrorEvents(START, { ...START, tick: 40, outcome: "fell" as const }, ZONE), [{ kind: "fell" }]);
});
