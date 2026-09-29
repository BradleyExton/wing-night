import assert from "node:assert/strict";
import test from "node:test";
import type { SchlonicFrame } from "@wingnight/shared";
import {
  SCHLONIC_WORLD,
  createSchlonicRunStart,
  resolveSchlonicFinaleX,
  resolveSchlonicGroundY,
  resolveSchlonicZone,
  stepSchlonic
} from "@wingnight/shared";

import { GRIND_SCRAPE_UNITS, resolveAirPeak, resolveMirrorEvents, type SchlonicMirrorEvent } from "./index.js";

const ZONE = resolveSchlonicZone({ seed: 20260919, chunks: 22 });
const START = createSchlonicRunStart(ZONE);
const wingIndexes = ZONE.props.filter((prop) => prop.kind === "wing").map((prop) => prop.index);

test("does chime once for a step's wings, at the handful it ended on", () => {
  const next = { ...START, tick: 3, wings: 3, takenProps: wingIndexes.slice(0, 3) };

  assert.deepEqual(resolveMirrorEvents(START, next, ZONE, 0), [{ kind: "wing", wingsInHand: 3 }]);
});

test("does hear a kicker in the velocity and a hit in the log", () => {
  const sprung = { ...START, tick: 2, vy: SCHLONIC_WORLD.kickerVelocity, grounded: false };
  const hit = { ...START, tick: 2, hits: [2], wings: 4 };

  assert.deepEqual(resolveMirrorEvents(START, sprung, ZONE, 0), [{ kind: "spring" }]);
  assert.deepEqual(resolveMirrorEvents(START, hit, ZONE, 0), [{ kind: "hit" }]);
  // Still on the kicker's launch the next frame: no second boing.
  assert.deepEqual(resolveMirrorEvents(sprung, { ...sprung, tick: 3 }, ZONE, 0), []);
});

test("does call the finale once, as the runner crosses into the last two chunks", () => {
  const finaleX = resolveSchlonicFinaleX(ZONE);
  const before = { ...START, tick: 700, x: finaleX - 1 };
  const after = { ...START, tick: 701, x: finaleX + 0.5 };

  assert.deepEqual(resolveMirrorEvents(before, after, ZONE, 0), [{ kind: "finale" }]);
  assert.deepEqual(resolveMirrorEvents(after, { ...after, tick: 702, x: finaleX + 2 }, ZONE, 0), []);
});

test("does announce an ending once, and nothing for a frame that did not move on", () => {
  const cleared = { ...START, tick: 900, outcome: "cleared" as const };

  assert.deepEqual(resolveMirrorEvents(START, cleared, ZONE, 0), [{ kind: "cleared" }]);
  assert.deepEqual(resolveMirrorEvents(cleared, cleared, ZONE, 0), []);
  assert.deepEqual(resolveMirrorEvents(cleared, { ...cleared, tick: 901 }, ZONE, 0), []);
  assert.deepEqual(resolveMirrorEvents(START, { ...START, tick: 40, outcome: "fell" as const }, ZONE, 0), [{ kind: "fell" }]);
});

test("does pop an ollie when the feet leave the ground on the way up, and clack when they come down", () => {
  const rolling = { ...START, tick: 10, x: 60 };
  const popped = { ...rolling, tick: 11, x: 61.3, vy: SCHLONIC_WORLD.jumpVelocity, grounded: false };
  const falling = { ...popped, tick: 40, x: 100, vy: 1.8 };
  const landed = { ...falling, tick: 41, x: 101.3, vy: 0, grounded: true };

  assert.deepEqual(resolveMirrorEvents(rolling, popped, ZONE, 0), [{ kind: "ollie" }]);
  // It came down from well up: a landing.
  assert.deepEqual(resolveMirrorEvents(falling, landed, ZONE, 14), [{ kind: "land" }]);
  // Rolling off a ledge leaves the ground at no speed: no pop.
  assert.deepEqual(resolveMirrorEvents(rolling, { ...rolling, tick: 11, vy: 0.1, grounded: false }, ZONE, 0), []);
});

test("does keep the board quiet on a hit's knock-back and through the bail after it", () => {
  const rolling = { ...START, tick: 10, x: 60, wings: 8 };
  const knocked = { ...rolling, tick: 11, vy: SCHLONIC_WORLD.hitBounceVelocity, grounded: false, hits: [11], wings: 4, invulnerableUntilTick: 81 };
  const downAgain = { ...knocked, tick: 30, vy: 0, grounded: true };

  assert.deepEqual(resolveMirrorEvents(rolling, knocked, ZONE, 0), [{ kind: "hit" }]);
  assert.deepEqual(resolveMirrorEvents({ ...knocked, tick: 29 }, downAgain, ZONE, 0), []);
});

test("does clank onto a rail, scrape along it, and ring off the end", () => {
  const falling = { ...START, tick: 50, x: 200, vy: 1.2, grounded: false };
  const caught = { ...falling, tick: 51, x: 201.3, vy: 0, grounded: true, grindingRail: 7 };
  const along = { ...caught, tick: 52, x: (Math.floor(201.3 / GRIND_SCRAPE_UNITS) + 1) * GRIND_SCRAPE_UNITS + 0.1 };
  const off = { ...along, tick: 53, x: along.x + 1.3, grounded: false, grindingRail: null };

  assert.deepEqual(resolveMirrorEvents(falling, caught, ZONE, 0), [{ kind: "grindStart" }]);
  assert.deepEqual(resolveMirrorEvents(caught, along, ZONE, 0), [{ kind: "grind" }]);
  assert.deepEqual(resolveMirrorEvents(along, off, ZONE, 0), [{ kind: "grindStop" }]);
});

/** Plays `from` forward the way the mirror does, a frame a tick, carrying the air between frames. */
const listen = (from: SchlonicFrame, until: (frame: SchlonicFrame) => boolean, pressAt = -1): SchlonicMirrorEvent[] => {
  const heard: SchlonicMirrorEvent[] = [];
  let frame = from;
  let airPeak = resolveAirPeak(0, frame, ZONE);

  while (!until(frame) && frame.outcome === null && frame.tick < 4000) {
    const next = stepSchlonic(frame, ZONE, { pressed: frame.tick === pressAt, holding: false });

    heard.push(...resolveMirrorEvents(frame, next, ZONE, airPeak));
    airPeak = resolveAirPeak(airPeak, next, ZONE);
    frame = next;
  }

  return heard;
};

test("does not clack a landing when the board drifts down a slope off the paving", () => {
  // The party zone's hill from x≈340: the board skips off the paving and touches down twice.
  const x = 340;
  const from = { ...START, x, y: resolveSchlonicGroundY(ZONE, x) - SCHLONIC_WORLD.runnerRadius, vx: SCHLONIC_WORLD.topSpeed };

  assert.deepEqual(listen(from, (frame) => frame.x > 460).filter((event) => event.kind === "land" || event.kind === "ollie"), []);
});

test("does clack exactly once when an ollie comes back down", () => {
  const from = { ...START, tick: 10, x: 60, vx: SCHLONIC_WORLD.topSpeed };
  const heard = listen(from, (frame) => frame.tick > 11 && frame.grounded, 10);

  assert.deepEqual(heard.filter((event) => event.kind === "land" || event.kind === "ollie"), [{ kind: "ollie" }, { kind: "land" }]);
});
