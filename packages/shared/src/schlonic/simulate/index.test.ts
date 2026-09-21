import assert from "node:assert/strict";
import test from "node:test";

import type { SchlonicInput, SchlonicProp, SchlonicZone } from "../types.js";
import { SCHLONIC_WORLD, resolveSchlonicZone } from "../world/index.js";
import {
  advanceSchlonic,
  createSchlonicRunSkip,
  createSchlonicRunStart,
  runSchlonicRun,
  stepSchlonic
} from "./index.js";

const FLAT_HEIGHT = SCHLONIC_WORLD.groundBaseY;

// A hand-built zone, so a test says what it is testing instead of hunting a seed for it.
const flatZone = (props: Omit<SchlonicProp, "index">[] = [], goalX = 600): SchlonicZone => ({
  heights: Array.from({ length: 200 }, () => FLAT_HEIGHT),
  pits: [],
  props: props.map((prop, index) => ({ ...prop, index })),
  goalX
});

const wing = (x: number, above: number): Omit<SchlonicProp, "index"> => ({
  kind: "wing",
  x,
  y: FLAT_HEIGHT - above
});

const run = (
  zone: SchlonicZone,
  inputs: SchlonicInput[],
  ticks = 2000
): ReturnType<typeof advanceSchlonic> => {
  return advanceSchlonic(createSchlonicRunStart(zone), zone, inputs, ticks);
};

// The runner leaves the line from a standstill and takes a second and a half to get up to speed,
// so a tick is not a distance: a test that wants to jump somewhere has to go and find where.
const tickAtX = (zone: SchlonicZone, x: number): number => {
  let frame = createSchlonicRunStart(zone);

  while (frame.x < x && frame.tick < 4000 && frame.outcome === null) {
    frame = stepSchlonic(frame, zone, { pressed: false, holding: false });
  }

  return frame.tick;
};

test("stands the runner on the ground at the line with nothing in hand", () => {
  const frame = createSchlonicRunStart(flatZone());

  assert.equal(frame.x, SCHLONIC_WORLD.runnerX);
  assert.equal(frame.y, FLAT_HEIGHT - SCHLONIC_WORLD.runnerRadius);
  assert.equal(frame.grounded, true);
  assert.equal(frame.wings, 0);
  assert.equal(frame.outcome, null);
});

test("runs forward on its own and never comes to a stop", () => {
  const zone = flatZone();
  const frame = run(zone, [], 120);

  assert.ok(frame.x > SCHLONIC_WORLD.runnerX + 100);
  assert.ok(frame.vx >= SCHLONIC_WORLD.minSpeed);
});

test("steps a settled frame to itself, so a caller can advance past the end without guarding", () => {
  const zone = flatZone([], 60);
  const done = run(zone, [], 2000);

  assert.equal(done.outcome, "cleared");
  assert.deepEqual(stepSchlonic(done, zone, { pressed: false, holding: false }), done);
});

test("jumps off the floor on a press and climbs higher while the button is held", () => {
  const zone = flatZone([], 4000);
  const apexOf = (inputs: SchlonicInput[]): number => {
    let frame = createSchlonicRunStart(zone);
    let apex = frame.y;

    for (let tick = 0; tick < 90; tick += 1) {
      frame = advanceSchlonic(frame, zone, inputs, frame.tick + 1);
      apex = Math.min(apex, frame.y);
    }

    return FLAT_HEIGHT - SCHLONIC_WORLD.runnerRadius - apex;
  };
  const tapped = apexOf([
    { tick: 0, down: true },
    { tick: 1, down: false }
  ]);
  const held = apexOf([
    { tick: 0, down: true },
    { tick: 40, down: false }
  ]);

  assert.ok(tapped > 10, `a tap barely left the ground: ${tapped}`);
  assert.ok(held > tapped + 6, `holding bought nothing: ${held} against ${tapped}`);
});

test("refuses a second jump in the air, so one press is one jump", () => {
  const zone = flatZone([], 4000);
  const single = run(zone, [{ tick: 0, down: true }], 40);
  const doubled = run(
    zone,
    [
      { tick: 0, down: true },
      { tick: 1, down: false },
      { tick: 12, down: true }
    ],
    40
  );

  assert.ok(doubled.y > single.y, "the mid-air press lifted the runner");
});

test("picks up a wing it runs through and leaves the ones it does not", () => {
  const zone = flatZone([wing(120, 9), wing(400, 40)]);
  const frame = run(zone, [], 400);

  assert.equal(frame.wings, 1);
  assert.deepEqual(frame.takenProps, [0]);
});

test("takes a wing only once, however long it stands in it", () => {
  const zone = flatZone([wing(120, 9)]);
  const frame = run(zone, [], 600);

  assert.equal(frame.wings, 1);
});

test("costs half the handful and a chunk of speed to hit a spike strip", () => {
  const zone = flatZone([
    wing(80, 9),
    wing(90, 9),
    wing(100, 9),
    wing(110, 9),
    { kind: "spike", x: 200, y: FLAT_HEIGHT }
  ]);
  const before = run(zone, [], 100);
  const after = run(zone, [], 220);

  assert.equal(before.wings, 4);
  assert.equal(after.wings, 2);
  assert.equal(after.hits.length, 1);
  assert.equal(after.outcome, null);
});

test("ends the run on a hit taken with nothing in hand", () => {
  const zone = flatZone([{ kind: "spike", x: 200, y: FLAT_HEIGHT }]);
  const frame = run(zone, [], 400);

  assert.equal(frame.outcome, "wiped");
  assert.equal(frame.wings, 0);
});

test("lets one strip cost only one handful, however wide the runner's stride", () => {
  const zone = flatZone([
    ...Array.from({ length: 16 }, (_unused, index) => wing(60 + index * 10, 9)),
    { kind: "spike", x: 260, y: FLAT_HEIGHT },
    { kind: "spike", x: 268, y: FLAT_HEIGHT }
  ]);
  const frame = run(zone, [], 400);

  assert.equal(frame.hits.length, 1);
});

test("squashes the badnik it comes down on, and pays for it", () => {
  const zone = flatZone([{ kind: "badnik", x: 300, y: FLAT_HEIGHT }], 4000);
  const reachesIt = tickAtX(zone, 300);
  // Coming down on one is a timed thing, not a guaranteed one — a jump taken too early sails
  // clean over it. What the test pins is that the window exists and that landing on it pays.
  const squashes = [];

  for (let jumpTick = reachesIt - 60; jumpTick < reachesIt; jumpTick += 1) {
    const frame = run(
      zone,
      [
        { tick: jumpTick, down: true },
        { tick: jumpTick + 1, down: false }
      ],
      reachesIt + 90
    );

    if (frame.wings > 0) {
      squashes.push(frame);
    }
  }

  assert.ok(squashes.length > 4, `only ${squashes.length} jump ticks landed on it`);

  for (const frame of squashes) {
    assert.equal(frame.wings, SCHLONIC_WORLD.badnikWings);
    assert.equal(frame.hits.length, 0);
    assert.equal(frame.outcome, null);
  }
});

test("lets a high jump sail clean over a badnik without touching it", () => {
  const zone = flatZone([{ kind: "badnik", x: 300, y: FLAT_HEIGHT }], 4000);
  const jumpTick = tickAtX(zone, 300 - 20);
  const frame = run(
    zone,
    [
      { tick: jumpTick, down: true },
      { tick: jumpTick + 40, down: false }
    ],
    jumpTick + 120
  );

  assert.equal(frame.wings, 0);
  assert.equal(frame.hits.length, 0);
  assert.equal(frame.outcome, null);
});

test("is hurt by the badnik it runs into on its feet", () => {
  const zone = flatZone([{ kind: "badnik", x: 300, y: FLAT_HEIGHT }]);
  const frame = run(zone, [], 600);

  assert.equal(frame.outcome, "wiped");
});

test("throws the runner at the high line off a spring", () => {
  const zone = flatZone([{ kind: "spring", x: 300, y: FLAT_HEIGHT }], 4000);
  let frame = createSchlonicRunStart(zone);
  let apex = frame.y;

  for (let tick = 0; tick < 500; tick += 1) {
    frame = advanceSchlonic(frame, zone, [], frame.tick + 1);
    apex = Math.min(apex, frame.y);
  }

  assert.ok(FLAT_HEIGHT - apex > 40, `the spring only threw it ${FLAT_HEIGHT - apex} units`);
});

test("ends the run in the hole, with everything that was in hand", () => {
  const zone: SchlonicZone = {
    ...flatZone([wing(80, 9), wing(90, 9)]),
    pits: [{ fromX: 200, toX: 200 + SCHLONIC_WORLD.pitWidth, lipY: FLAT_HEIGHT }]
  };
  const frame = run(zone, [], 600);

  assert.equal(frame.outcome, "fell");
  assert.equal(frame.wings, 0);
});

test("clears a hole that is jumped, and keeps what it was carrying", () => {
  const zone: SchlonicZone = {
    ...flatZone([wing(80, 9)], 600),
    pits: [{ fromX: 200, toX: 200 + SCHLONIC_WORLD.pitWidth, lipY: FLAT_HEIGHT }]
  };
  // Leave the ground a stride before the lip and hold the jump out.
  const jumpTick = tickAtX(zone, 200 - 18);
  const frame = run(
    zone,
    [
      { tick: jumpTick, down: true },
      { tick: jumpTick + 40, down: false }
    ],
    1200
  );

  assert.equal(frame.outcome, "cleared");
  assert.equal(frame.wings, 1);
});

test("replays a log to the same frame however it is stepped", () => {
  const zone = resolveSchlonicZone({ seed: 12, chunks: 10 });
  const inputs: SchlonicInput[] = [
    { tick: 40, down: true },
    { tick: 62, down: false },
    { tick: 150, down: true },
    { tick: 168, down: false },
    { tick: 300, down: true },
    { tick: 330, down: false }
  ];
  const straight = advanceSchlonic(createSchlonicRunStart(zone), zone, inputs, 700);
  let piecemeal = createSchlonicRunStart(zone);

  for (let tick = 7; tick <= 700; tick += 7) {
    piecemeal = advanceSchlonic(piecemeal, zone, inputs, tick);
  }

  assert.deepEqual(piecemeal, straight);
});

test("referees a run to a result the server can score from", () => {
  const course = { seed: 21, chunks: 12 };
  const result = runSchlonicRun(course, []);

  assert.notEqual(result.outcome, "running");
  assert.deepEqual(runSchlonicRun(course, []), result);
  assert.ok(result.distance >= 0);
});

test("brings nothing home from a run that ended badly", () => {
  const zone = flatZone([wing(80, 9), wing(90, 9), { kind: "spike", x: 300, y: FLAT_HEIGHT }]);
  const frame = run(zone, [], 600);

  assert.equal(frame.wings, 1);

  // The referee's own reading of the same shape of run: a wipeout banks nothing.
  const wiped = runSchlonicRun({ seed: 6, chunks: 22 }, []);

  assert.notEqual(wiped.outcome, "cleared");
  assert.equal(wiped.wings, 0);
});

test("settles a skipped run on the line, already over", () => {
  const frame = createSchlonicRunSkip(flatZone());

  assert.equal(frame.outcome, "wiped");
  assert.equal(frame.wings, 0);
});
