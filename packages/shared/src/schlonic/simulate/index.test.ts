import assert from "node:assert/strict";
import test from "node:test";

import type { SchlonicFrame, SchlonicInput, SchlonicProp, SchlonicZone } from "../types.js";
import {
  SCHLONIC_HAZARDS,
  SCHLONIC_WORLD,
  resolveSchlonicHazardBox,
  resolveSchlonicHazardX,
  resolveSchlonicZone
} from "../world/index.js";
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

const tap = (tick: number): SchlonicInput[] => [
  { tick, down: true },
  { tick: tick + 1, down: false }
];

const framesOf = (zone: SchlonicZone, inputs: readonly SchlonicInput[], ticks: number): SchlonicFrame[] => {
  let frame = createSchlonicRunStart(zone);
  const frames = [frame];

  while (frame.tick < ticks && frame.outcome === null) {
    frame = advanceSchlonic(frame, zone, inputs, frame.tick + 1);
    frames.push(frame);
  }

  return frames;
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

test("comes down harder than it went up, so the arc hangs less than a symmetric one would", () => {
  const zone = flatZone([], 4000);
  let frame = createSchlonicRunStart(zone);
  let apexTick = 0;
  let apex = frame.y;
  let landedTick = 0;

  for (let tick = 0; tick < 120 && landedTick === 0; tick += 1) {
    frame = advanceSchlonic(frame, zone, [{ tick: 0, down: true }, { tick: 1, down: false }], frame.tick + 1);

    if (frame.y < apex) {
      apex = frame.y;
      apexTick = frame.tick;
    } else if (frame.grounded && frame.tick > 2) {
      landedTick = frame.tick;
    }
  }

  assert.ok(landedTick > apexTick && apexTick > 5);
  assert.ok(landedTick - apexTick < apexTick, `fell for ${landedTick - apexTick} ticks after rising for ${apexTick}`);
});

test("keeps a tap and a full hold a clear distance apart, with the hold short of the finale's arc", () => {
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
  const tapped = apexOf([{ tick: 0, down: true }, { tick: 1, down: false }]);
  const held = apexOf([{ tick: 0, down: true }, { tick: 60, down: false }]);

  // The handrail (16.5 up) is a tap's landing; the high line (20 up) wants a hold.
  assert.ok(tapped > SCHLONIC_WORLD.railAbove, `a tap tops out at ${tapped}, under the rail`);
  assert.ok(held - tapped >= 10, `the hold is only ${held - tapped} over the tap`);
  assert.ok(held < 35, `the hold reaches ${held}, the finale's arc is the kicker's to reach`);
});

test("slams straight down on a press in the air with clearance under it, rather than lifting", () => {
  const zone = flatZone([], 4000);
  const landingOf = (inputs: SchlonicInput[]): number =>
    framesOf(zone, inputs, 80).find((frame) => frame.tick > 5 && frame.grounded)?.tick ?? -1;
  const slamLog = [...tap(0), { tick: 12, down: true }];
  const slammedAt = run(zone, slamLog, 13);

  assert.equal(slammedAt.slamming, true);
  assert.equal(slammedAt.vy, SCHLONIC_WORLD.slamVelocity);
  // Down sooner than the same tap alone, and back on its board when it gets there.
  assert.ok(landingOf(slamLog) > 0 && landingOf(slamLog) < landingOf(tap(0)), "the slam did not shorten the air");
  assert.equal(run(zone, slamLog, landingOf(slamLog)).slamming, false);
  assert.ok(run(zone, slamLog, 20).y > run(zone, tap(0), 20).y, "the mid-air press lifted the runner");
});

test("still jumps on a press just after rolling off a lip, and not on one well after: the coyote window", () => {
  // The ground is a slope between samples, never a cliff; a trench's lip is the real drop.
  const zone: SchlonicZone = { ...flatZone([], 4000), pits: [{ fromX: 300, toX: 322, lipY: FLAT_HEIGHT }] };
  const offAt = framesOf(zone, [], tickAtX(zone, 330)).find((frame) => !frame.grounded && frame.x > 295);

  assert.ok(offAt !== undefined, "the runner never left the lip");

  const late = SCHLONIC_WORLD.coyoteTicks - 1;
  const jumped = framesOf(zone, tap(offAt.tick + late), offAt.tick + 60);
  const launched = jumped.find((frame) => frame.tick === offAt.tick + late + 1);

  assert.ok(launched !== undefined);
  assert.equal(launched.vy, SCHLONIC_WORLD.jumpVelocity);
  // And that jump clears the trench it was already over.
  assert.equal(jumped[jumped.length - 1]?.outcome, null);

  const tooLate = offAt.tick + SCHLONIC_WORLD.coyoteTicks + 2;
  const missed = framesOf(zone, tap(tooLate), tooLate + 30);

  assert.ok(missed.every((frame) => frame.vy !== SCHLONIC_WORLD.jumpVelocity), `a press ${SCHLONIC_WORLD.coyoteTicks + 2} ticks off the lip still jumped`);
  assert.equal(missed[missed.length - 1]?.outcome, "fell");
});

test("jumps the tick after landing on a press taken just before it: the jump buffer", () => {
  const zone = flatZone([], 4000);
  const first = framesOf(zone, tap(0), 80);
  const landing = first.find((frame) => frame.tick > 5 && frame.grounded);

  assert.ok(landing !== undefined);

  const early = landing.tick - 4;
  const buffered = framesOf(zone, [...tap(0), ...tap(early)], landing.tick + 3);
  const relaunched = buffered.find((frame) => frame.tick === landing.tick + 1);

  assert.ok(relaunched !== undefined);
  assert.equal(relaunched.vy, SCHLONIC_WORLD.jumpVelocity, "the early press did not fire on landing");
  // A press held too long before the landing is forgotten.
  const stale = framesOf(zone, [...tap(0), ...tap(landing.tick - SCHLONIC_WORLD.jumpBufferTicks - 6)], landing.tick + 3);

  assert.ok(stale.find((frame) => frame.tick === landing.tick + 1)?.grounded, "a stale press fired on landing");
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

// One of the crowd that stays put, so a test says what it is testing.
const punk = (x: number): Omit<SchlonicProp, "index"> => ({ kind: "hazard", hazard: "punk", x, y: FLAT_HEIGHT });

test("costs half the handful and a chunk of speed to run into one of the crowd", () => {
  const zone = flatZone([wing(80, 9), wing(90, 9), wing(100, 9), wing(110, 9), punk(200)]);
  const before = run(zone, [], 100);
  const after = run(zone, [], 220);

  assert.equal(before.wings, 4);
  assert.equal(after.wings, 2);
  assert.equal(after.hits.length, 1);
  assert.equal(after.outcome, null);
});

test("ends the run on a hit taken with nothing in hand", () => {
  const zone = flatZone([punk(200)]);
  const frame = run(zone, [], 400);

  assert.equal(frame.outcome, "wiped");
  assert.equal(frame.wings, 0);
});

test("lets one crowd cost only one handful, however wide the runner's stride", () => {
  const zone = flatZone([
    ...Array.from({ length: 16 }, (_unused, index) => wing(60 + index * 10, 9)),
    punk(260),
    punk(268)
  ]);
  const frame = run(zone, [], 400);

  assert.equal(frame.hits.length, 1);
});

test("is hurt by one of the crowd it comes down on: nothing on the sidewalk is flat on top but the furniture", () => {
  const zone = flatZone([punk(300)], 4000);
  const reachesIt = tickAtX(zone, 300);
  let landedOnIt = 0;

  for (let jumpTick = reachesIt - 60; jumpTick < reachesIt; jumpTick += 1) {
    const frame = run(
      zone,
      [
        { tick: jumpTick, down: true },
        { tick: jumpTick + 1, down: false }
      ],
      reachesIt + 90
    );

    if (frame.hits.length > 0) {
      landedOnIt += 1;
      assert.equal(frame.wings, 0);
    }
  }

  assert.ok(landedOnIt > 4, `only ${landedOnIt} jump ticks came down on it`);
});

test("lets a high jump sail clean over one of the crowd without touching it", () => {
  const zone = flatZone([punk(300)], 4000);
  const jumpTick = tickAtX(zone, 300 - 20);
  const frame = run(
    zone,
    [
      { tick: jumpTick, down: true },
      { tick: jumpTick + 40, down: false }
    ],
    jumpTick + 120
  );

  assert.equal(frame.hits.length, 0);
  assert.equal(frame.outcome, null);
});

test("sways a mover across its spot on the tick, the same on every machine, and hurts where it is", () => {
  const goose: Omit<SchlonicProp, "index"> = { kind: "hazard", hazard: "goose", x: 300, y: FLAT_HEIGHT };
  const zone = flatZone([goose], 4000);
  const { sway, swayTicks } = SCHLONIC_HAZARDS.goose;
  const prop = zone.props[0];

  assert.ok(prop !== undefined);
  // Out to one side, back through the middle, out to the other, and home.
  assert.equal(resolveSchlonicHazardX(prop, 0), 300 - sway);
  assert.equal(resolveSchlonicHazardX(prop, swayTicks / 4), 300);
  assert.equal(resolveSchlonicHazardX(prop, swayTicks / 2), 300 + sway);
  assert.equal(resolveSchlonicHazardX(prop, swayTicks), 300 - sway);
  assert.equal(resolveSchlonicHazardX(prop, swayTicks * 7 + 3), resolveSchlonicHazardX(prop, 3));
  // One that stays put is where it was laid.
  assert.equal(resolveSchlonicHazardX({ ...prop, hazard: "punk" }, 77), 300);

  // The hit lands on the goose's own position, not its spot: a walker meets it wherever the
  // sway has it at that tick, and the two machines agree on the tick.
  const walked = run(zone, [], 600);

  assert.equal(walked.outcome, "wiped");

  const hitTick = walked.hits[0] ?? 0;
  const atHit = run(zone, [], hitTick);
  const gooseX = resolveSchlonicHazardX(prop, hitTick);

  assert.ok(Math.abs(atHit.x - gooseX) < SCHLONIC_WORLD.runnerRadius + SCHLONIC_HAZARDS.goose.width / 2 + 2);
});

test("throws the runner at the high line off a kicker it rolls into", () => {
  const zone = flatZone([{ kind: "kicker", x: 300, y: FLAT_HEIGHT }], 4000);
  let frame = createSchlonicRunStart(zone);
  let apex = frame.y;

  for (let tick = 0; tick < 500; tick += 1) {
    frame = advanceSchlonic(frame, zone, [], frame.tick + 1);
    apex = Math.min(apex, frame.y);
  }

  assert.ok(FLAT_HEIGHT - apex > 40, `the kicker only threw it ${FLAT_HEIGHT - apex} units`);
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


// Every frame of a run, one tick at a time, so a test can ask what the runner was doing at each
// tick rather than only where it ended up.

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
  const zone = flatZone([rail(300, 330), punk(315)], 4000);
  const grinds = findGrinds(zone, 0);

  assert.ok(grinds.length > 4, `only ${grinds.length} tap ticks landed on the rail`);

  for (const grind of grinds) {
    for (const frame of grind.grinding) {
      assert.equal(frame.grounded, true);
      assert.equal(frame.y, RAIL_RIDE_Y);
      assert.equal(frame.vy, 0);
    }

    // Riding the rail is riding over the crowd, not through it.
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

test("keeps its speed on the rail over top speed, with no drag and no slope", () => {
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

test("does clear the crowd at the rail's end when the grind began at the floor speed", () => {
  const zone = flatZone([rail(300, 348), punk(348)], 4000);
  let frame: SchlonicFrame = {
    ...createSchlonicRunStart(zone),
    x: 301,
    y: RAIL_RIDE_Y,
    vx: SCHLONIC_WORLD.minSpeed,
    grindingRail: 0
  };
  const frames: SchlonicFrame[] = [];

  while (frame.x < 400 && frame.outcome === null && frames.length < 1000) {
    frame = stepSchlonic(frame, zone, { pressed: false, holding: false });
    frames.push(frame);
  }

  const grinding = frames.filter((each) => each.grindingRail === 0);

  assert.ok(grinding.length > 20, "the grind should ride most of the rail");
  assert.ok(
    grinding.every((each, index) => index === 0 || each.vx > (grinding[index - 1]?.vx ?? 0) || each.vx === SCHLONIC_WORLD.topSpeed),
    "the legs should push a slow board on along the rail"
  );
  assert.equal(frame.hits.length, 0, `landed in the crowd at x ${frames.find((each) => each.hits.length > 0)?.x}`);
  assert.equal(frame.outcome, null);
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

test("is hurt by the crowd under the rail when the grind is missed", () => {
  const zone = flatZone([wing(80, 9), wing(90, 9), wing(100, 9), wing(110, 9), rail(300, 330), punk(315)]);
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

// The first generated zone whose first piece of hard kit is the handrail — the rail, then one of
// the crowd a landing past its end, with no hole before either — so a runner reaches the real
// chunk untouched. The crowd member has to stay put, or the sweep depends on where the sway has it.
const findRailCourse = (): { seed: number; chunks: number } => {
  const opensOnRail = (zone: SchlonicZone): boolean => {
    const [railProp, crowd] = zone.props.filter((prop) => prop.kind !== "wing");

    return (
      crowd?.kind === "hazard" &&
      SCHLONIC_HAZARDS[crowd.hazard ?? "punk"].sway === 0 &&
      railProp?.kind === "rail" &&
      railProp.rideOn === "rail" &&
      zone.pits.every((pit) => pit.fromX > (railProp.toX ?? 0))
    );
  };
  let course = { seed: 0, chunks: 12 };

  while (!opensOnRail(resolveSchlonicZone(course))) {
    assert.ok(course.seed < 400, "no seed under 400 opens on the handrail");
    course = { ...course, seed: course.seed + 1 };
  }

  return course;
};

test("sweeps at most a third of the rail's line on a hop over the crowd past its end, and all of it on a grind", () => {
  const zone = resolveSchlonicZone(findRailCourse());
  const railProp = zone.props.find((prop) => prop.kind === "rail");
  const crowd = zone.props.find((prop) => prop.kind === "hazard");

  assert.ok(railProp !== undefined && crowd !== undefined);

  const line = zone.props.filter(
    (prop) => prop.kind === "wing" && prop.x >= railProp.x && prop.x <= (railProp.toX ?? 0) && prop.y < railProp.y
  );
  const lineWorth = line.reduce((total, prop) => total + (prop.worth ?? 1), 0);
  const takenWorth = (frame: SchlonicFrame): number => {
    return line.reduce((total, prop) => total + (frame.takenProps.includes(prop.index) ? (prop.worth ?? 1) : 0), 0);
  };
  const pastIt = tickAtX(zone, (railProp.toX ?? 0) + 40);
  // The reflex: hop the crowd at the first stride they are close ahead, a tap or a short hold,
  // the way a player hops any hazard. It clears them, never touches the rail, and sweeps only
  // the tail of the line on the way over.
  const reflexTick = tickAtX(zone, crowd.x - resolveSchlonicHazardBox(crowd).halfWidth - 12);

  for (const hold of [1, 7]) {
    const frames = framesOf(zone, [{ tick: reflexTick, down: true }, { tick: reflexTick + hold, down: false }], pastIt);
    const last = frames[frames.length - 1];

    assert.ok(last !== undefined);
    assert.equal(last.hits.length, 0, `a ${hold}-tick hop landed in the crowd`);
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
  const zone = flatZone([wing(80, 9), wing(90, 9), punk(300)]);
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
