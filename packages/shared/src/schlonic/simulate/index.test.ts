import assert from "node:assert/strict";
import test from "node:test";

import type { SchlonicFrame, SchlonicInput, SchlonicProp, SchlonicZone } from "../types.js";
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

const RAIL_ABOVE = 12;

// A grind rail is its start, its end and its top.
const rail = (x: number, toX: number, above = RAIL_ABOVE): Omit<SchlonicProp, "index"> => ({
  kind: "rail",
  x,
  toX,
  y: FLAT_HEIGHT - above
});

// The feet go on the rail's top, so the runner's centre rides a radius above it.
const RAIL_RIDE_Y = FLAT_HEIGHT - RAIL_ABOVE - SCHLONIC_WORLD.runnerRadius;

const tap = (tick: number): SchlonicInput[] => [
  { tick, down: true },
  { tick: tick + 1, down: false }
];

// Every frame of a run, one tick at a time, so a test can ask what the runner was doing at each
// tick rather than only where it ended up.
const framesOf = (zone: SchlonicZone, inputs: readonly SchlonicInput[], ticks: number): SchlonicFrame[] => {
  let frame = createSchlonicRunStart(zone);
  const frames = [frame];

  while (frame.tick < ticks && frame.outcome === null) {
    frame = advanceSchlonic(frame, zone, inputs, frame.tick + 1);
    frames.push(frame);
  }

  return frames;
};

type Grind = { jumpTick: number; frames: SchlonicFrame[]; grinding: SchlonicFrame[] };

// Landing on a rail is a timed thing: a tap is a hop, and where it comes down depends on when it
// left. Tries every tap from well before the rail to its end and keeps the ones that ground.
const findGrinds = (zone: SchlonicZone, railIndex: number, ticks = 4000): Grind[] => {
  const railProp = zone.props[railIndex];

  assert.ok(railProp?.kind === "rail" && railProp.toX !== undefined);

  const from = tickAtX(zone, railProp.x - 70);
  const to = tickAtX(zone, railProp.toX);
  const grinds: Grind[] = [];

  for (let jumpTick = from; jumpTick < to; jumpTick += 1) {
    const frames = framesOf(zone, tap(jumpTick), Math.min(ticks, to + 120));
    const grinding = frames.filter((frame) => frame.grindingRail === railIndex);

    if (grinding.length > 0) {
      grinds.push({ jumpTick, frames, grinding });
    }
  }

  return grinds;
};

// The tap that lands earliest on the rail, and so rides it longest.
const longestGrind = (grinds: readonly Grind[]): Grind => {
  const [longest] = [...grinds].sort((left, right) => right.grinding.length - left.grinding.length);

  assert.ok(longest !== undefined, "no tap landed on the rail");

  return longest;
};

test("lands and grinds when falling onto the rail", () => {
  const zone = flatZone([rail(300, 330), { kind: "spike", x: 315, y: FLAT_HEIGHT }], 4000);
  const grinds = findGrinds(zone, 0);

  assert.ok(grinds.length > 4, `only ${grinds.length} tap ticks landed on the rail`);

  for (const grind of grinds) {
    for (const frame of grind.grinding) {
      assert.equal(frame.grounded, true);
      assert.equal(frame.y, RAIL_RIDE_Y);
      assert.equal(frame.vy, 0);
    }

    // Riding the rail is riding over the thorns, not through them.
    assert.equal(grind.frames[grind.frames.length - 1]?.hits.length, 0);
  }
});

test("passes under the rail on foot and up through it on a jump", () => {
  const zone = flatZone([rail(300, 420)], 4000);
  const walked = framesOf(zone, [], tickAtX(zone, 440));

  assert.ok(walked.every((frame) => frame.grindingRail === null));
  assert.ok(
    walked.filter((frame) => frame.x > 300 && frame.x < 420).every((frame) => frame.y === FLAT_HEIGHT - SCHLONIC_WORLD.runnerRadius),
    "the walker was lifted onto a rail it walked under"
  );

  // A hop from under the rail rises straight through it, and comes down on top.
  const jumped = framesOf(zone, tap(tickAtX(zone, 320)), tickAtX(zone, 440));
  const through = jumped.find((frame) => frame.vy < 0 && frame.y + SCHLONIC_WORLD.runnerRadius < FLAT_HEIGHT - RAIL_ABOVE);

  assert.ok(through !== undefined, "the jump never rose past the rail's top");
  assert.equal(through.grindingRail, null);
  assert.ok(jumped.some((frame) => frame.tick > through.tick && frame.grindingRail === 0), "it did not land on the rail it rose through");
});

test("leaves the rail at its end and drops to the floor", () => {
  const zone = flatZone([rail(300, 330)], 4000);
  const { frames, grinding } = longestGrind(findGrinds(zone, 0));
  const last = grinding[grinding.length - 1];

  assert.ok(last !== undefined && last.x <= 330);

  const off = frames.find((frame) => frame.tick === last.tick + 1);

  assert.ok(off !== undefined && off.x > 330);
  assert.equal(off.grindingRail, null);
  assert.equal(off.grounded, false);
  assert.ok(
    frames.some((frame) => frame.tick > off.tick && frame.grounded && frame.y === FLAT_HEIGHT - SCHLONIC_WORLD.runnerRadius),
    "it never came back down to the floor"
  );
});

test("jumps off the rail mid-grind like it jumps off the floor", () => {
  const zone = flatZone([rail(300, 330)], 4000);
  const { jumpTick, grinding } = longestGrind(findGrinds(zone, 0));
  const landed = grinding[0];

  assert.ok(landed !== undefined && grinding.length > 6);

  const pressAt = landed.tick + 3;
  const frames = framesOf(zone, [...tap(jumpTick), ...tap(pressAt)], pressAt + 60);
  const leapt = frames.find((frame) => frame.tick === pressAt + 1);

  assert.ok(leapt !== undefined);
  assert.equal(leapt.vy, SCHLONIC_WORLD.jumpVelocity);
  assert.equal(leapt.grindingRail, null);
  assert.equal(leapt.grounded, false);
  assert.ok(
    frames.some((frame) => frame.y < RAIL_RIDE_Y - 10),
    "the jump off the rail never climbed"
  );
});

test("keeps its speed on the rail, with no drag and no slope", () => {
  // Downhill under the rail: on the ground this would be worth speed, and over the top speed the
  // drag would be bleeding it. On the rail it is neither.
  const heights = Array.from({ length: 200 }, (_unused, sample) => FLAT_HEIGHT + Math.max(0, Math.min(10, sample - 26)));
  const zone: SchlonicZone = { ...flatZone([rail(280, 360, 14)], 4000), heights };
  const arriving = (vx: number) => ({
    ...createSchlonicRunStart(zone),
    x: 282,
    y: FLAT_HEIGHT - 14 - SCHLONIC_WORLD.runnerRadius - 2,
    vx,
    vy: 0.6,
    grounded: false
  });
  const ride = (vx: number): SchlonicFrame[] => {
    let frame = arriving(vx);
    const frames: SchlonicFrame[] = [];

    for (let tick = 0; tick < 40; tick += 1) {
      frame = stepSchlonic(frame, zone, { pressed: false, holding: false });
      frames.push(frame);
    }

    return frames.filter((frame) => frame.grindingRail === 0);
  };
  const fast = ride(1.9);
  const [first] = fast;

  assert.ok(first !== undefined && fast.length > 10);
  assert.ok(first.vx > SCHLONIC_WORLD.topSpeed);
  assert.ok(fast.every((frame) => frame.vx === first.vx), "the rail changed the speed it was ridden at");
  // However hard it arrives, the rail has a limit.
  assert.ok(ride(9).every((frame) => frame.vx === SCHLONIC_WORLD.grindMaxSpeed));
});

test("collects the rail's wings while grinding and none of them from the floor under it", () => {
  const wingY = FLAT_HEIGHT - RAIL_ABOVE - SCHLONIC_WORLD.runnerRadius - SCHLONIC_WORLD.wingRadius;
  const railWings = [312, 319, 326].map(
    (x): Omit<SchlonicProp, "index"> => ({ kind: "wing", x, y: wingY, worth: SCHLONIC_WORLD.highLineWorth })
  );
  const zone = flatZone([rail(300, 330), ...railWings], 4000);
  const walked = run(zone, [], tickAtX(zone, 400));

  assert.equal(walked.wings, 0);

  const { frames } = longestGrind(findGrinds(zone, 0));

  for (const index of [1, 2, 3]) {
    const takenOn = frames.find((frame) => frame.takenProps.includes(index));

    assert.ok(takenOn !== undefined, `the grind missed the rail's wing ${index}`);
    assert.equal(takenOn.grindingRail, 0, `wing ${index} was not taken on the rail`);
  }

  assert.equal(frames[frames.length - 1]?.wings, 3 * SCHLONIC_WORLD.highLineWorth);
});

test("is hurt by the thorns under the rail when the grind is missed", () => {
  const zone = flatZone([
    wing(80, 9),
    wing(90, 9),
    wing(100, 9),
    wing(110, 9),
    rail(300, 330),
    { kind: "spike", x: 315, y: FLAT_HEIGHT }
  ]);
  const frame = run(zone, [], tickAtX(zone, 360));

  assert.equal(frame.hits.length, 1);
  assert.equal(frame.wings, 2);
  assert.equal(frame.outcome, null);
});

test("does nothing to a runner that touches the rail's side", () => {
  // Low enough that the walker's body is in it: a rail is kit, not a hazard.
  const zone = flatZone([rail(300, 330, 4)], 4000);
  const frame = run(zone, [], tickAtX(zone, 360));

  assert.equal(frame.hits.length, 0);
  assert.equal(frame.outcome, null);
});

// The first generated zone whose first piece of hard kit is a rail — its own thorn bed, then the
// rail, with no hole before it — so a runner reaches the real chunk untouched.
const findRailCourse = (): { seed: number; chunks: number } => {
  const opensOnRail = (zone: SchlonicZone): boolean => {
    const [thorns, railProp] = zone.props.filter((prop) => prop.kind !== "wing");

    return (
      thorns?.kind === "spike" &&
      railProp?.kind === "rail" &&
      zone.pits.every((pit) => pit.fromX > (railProp.toX ?? 0))
    );
  };
  let course = { seed: 0, chunks: 12 };

  while (!opensOnRail(resolveSchlonicZone(course))) {
    assert.ok(course.seed < 100, "no seed under 100 opens on a rail");
    course = { ...course, seed: course.seed + 1 };
  }

  return course;
};

test("sweeps at most a third of the rail's line on a hop over its thorns, and all of it on a grind", () => {
  const zone = resolveSchlonicZone(findRailCourse());
  const railProp = zone.props.find((prop) => prop.kind === "rail");
  const thorns = zone.props.find((prop) => prop.kind === "spike");

  assert.ok(railProp !== undefined && thorns !== undefined);

  const line = zone.props.filter(
    (prop) => prop.kind === "wing" && prop.x >= railProp.x && prop.x <= (railProp.toX ?? 0) && prop.y < railProp.y
  );
  const lineWorth = line.reduce((total, prop) => total + (prop.worth ?? 1), 0);
  const takenWorth = (frame: SchlonicFrame): number => {
    return line.reduce((total, prop) => total + (frame.takenProps.includes(prop.index) ? (prop.worth ?? 1) : 0), 0);
  };
  const pastIt = tickAtX(zone, (railProp.toX ?? 0) + 40);
  // The reflex: hop the thorns at the first stride they are close ahead, a tap or a short hold,
  // the way a player hops any hazard. It clears them, never touches the rail, and sweeps only
  // the tail of the line on the way over.
  const reflexTick = tickAtX(zone, thorns.x - 18);

  for (const hold of [1, 7]) {
    const frames = framesOf(zone, [{ tick: reflexTick, down: true }, { tick: reflexTick + hold, down: false }], pastIt);
    const last = frames[frames.length - 1];

    assert.ok(last !== undefined);
    assert.equal(last.hits.length, 0, `a ${hold}-tick hop landed in the thorns`);
    assert.ok(frames.every((frame) => frame.grindingRail === null), `a ${hold}-tick hop came down on the rail`);
    assert.ok(takenWorth(last) * 3 <= lineWorth, `a ${hold}-tick hop swept ${takenWorth(last)} of the rail's ${lineWorth}`);
  }

  const { grinding } = longestGrind(findGrinds(zone, railProp.index));
  const lastGrind = grinding[grinding.length - 1];

  assert.ok(lastGrind !== undefined);
  assert.equal(takenWorth(lastGrind), lineWorth);
});

test("replays a grind to the same frames through the referee", () => {
  const course = findRailCourse();
  const zone = resolveSchlonicZone(course);
  const railIndex = zone.props.find((prop) => prop.kind === "rail")?.index ?? -1;
  const { jumpTick, grinding } = longestGrind(findGrinds(zone, railIndex));
  const inputs = tap(jumpTick);
  const refereed = runSchlonicRun(course, inputs);

  // The server's reading of the log lands on the tablet's frame, bit for bit…
  assert.deepEqual(
    refereed.frame,
    framesOf(zone, inputs, refereed.endTick)[refereed.endTick]
  );

  // …and so does every grinding frame, however the log is stepped to it.
  for (const frame of grinding) {
    assert.deepEqual(advanceSchlonic(createSchlonicRunStart(zone), zone, inputs, frame.tick), frame);
  }
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
