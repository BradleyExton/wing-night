import assert from "node:assert/strict";
import test from "node:test";

import { FAPPY_WORLD, resolveFappyGates, resolveFappyLegTickCap } from "../world/index.js";
import { advanceFappy, createFappyLegStart, runFappyLeg, stepFappy } from "./index.js";

const course = { seed: 1234, legIndex: 0, gatesPerLeg: 8 };
const gates = resolveFappyGates(course);

// Flap ticks that thread the first gate: a steady rhythm holds the bird near the rest line, and
// the course's first gap is wide enough to take that with the sample seed.
const holdAltitude = (untilTick: number, everyTicks: number): number[] => {
  const ticks: number[] = [];

  for (let tick = 0; tick < untilTick; tick += everyTicks) {
    ticks.push(tick);
  }

  return ticks;
};

test("does derive the same gates for the same course on every call", () => {
  assert.deepEqual(resolveFappyGates(course), gates);
  assert.notDeepEqual(resolveFappyGates({ ...course, seed: 99 }), gates);
  assert.notDeepEqual(resolveFappyGates({ ...course, legIndex: 1 }), gates);
});

test("does keep every gap inside the world and each drift within the bound", () => {
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    const legGates = resolveFappyGates({ seed, legIndex: 2, gatesPerLeg: 12 });

    legGates.forEach((gate, gateOffset) => {
      const centre = (gate.gapTop + gate.gapBottom) / 2;

      assert.equal(gate.gapBottom - gate.gapTop, FAPPY_WORLD.gapHeight);
      assert.ok(centre >= FAPPY_WORLD.gapCentreMin && centre <= FAPPY_WORLD.gapCentreMax);
      assert.equal(gate.index, 2 * 12 + gateOffset);
      assert.equal(gate.x, FAPPY_WORLD.firstGateX + gateOffset * FAPPY_WORLD.gateSpacing);

      const previous = legGates[gateOffset - 1];

      if (previous !== undefined) {
        const previousCentre = (previous.gapTop + previous.gapBottom) / 2;

        assert.ok(Math.abs(centre - previousCentre) <= FAPPY_WORLD.gapMaxDrift);
      }
    });
  }
});

test("does fall to the floor and crash when nobody flaps", () => {
  const run = runFappyLeg(course, []);

  assert.equal(run.outcome, "crashed");
  assert.equal(run.gatesCleared, 0);
  assert.equal(run.frame.bird.y, FAPPY_WORLD.floorY - FAPPY_WORLD.birdRadius);
  assert.ok(run.endTick > 0 && run.endTick < 120);
});

test("does lift the bird when it flaps and clamp it at the ceiling", () => {
  const start = createFappyLegStart();
  const flapped = stepFappy(start, gates, course.gatesPerLeg, true);

  assert.ok(flapped.bird.y < start.bird.y);
  assert.equal(flapped.bird.vy, FAPPY_WORLD.flapVelocity);

  const pinned = advanceFappy(start, gates, course.gatesPerLeg, holdAltitude(60, 1), 60);

  assert.equal(pinned.bird.y, FAPPY_WORLD.birdRadius);
  assert.equal(pinned.outcome, null);
});

test("does count a gate once its trailing edge is behind the bird", () => {
  const firstGate = gates[0];

  assert.ok(firstGate !== undefined);

  const gatePassedScroll = firstGate.x + FAPPY_WORLD.gateWidth - (FAPPY_WORLD.birdX - FAPPY_WORLD.birdRadius);
  const ticksToPass = Math.ceil(gatePassedScroll / FAPPY_WORLD.scrollSpeed) + 1;
  const centre = (firstGate.gapTop + firstGate.gapBottom) / 2;
  // Hold the bird on the gap's centre line by hand so the test is about counting, not flying.
  const pinnedFrame = {
    ...createFappyLegStart(),
    bird: { y: centre, vy: 0 }
  };
  let frame = pinnedFrame;

  for (let tick = 0; tick < ticksToPass; tick += 1) {
    frame = stepFappy({ ...frame, bird: { y: centre, vy: 0 } }, gates, course.gatesPerLeg, false);
  }

  assert.equal(frame.gatesCleared, 1);
  assert.equal(frame.outcome, null);
});

test("does crash into a champ when the bird is outside the gap at the column", () => {
  const firstGate = gates[0];

  assert.ok(firstGate !== undefined);

  const columnScroll = firstGate.x - FAPPY_WORLD.birdX;
  const ticksToColumn = Math.ceil(columnScroll / FAPPY_WORLD.scrollSpeed) + 1;
  let frame = createFappyLegStart();

  for (let tick = 0; tick < ticksToColumn; tick += 1) {
    frame = stepFappy(
      { ...frame, bird: { y: firstGate.gapTop - FAPPY_WORLD.birdRadius - 2, vy: 0 } },
      gates,
      course.gatesPerLeg,
      false
    );
  }

  assert.equal(frame.outcome, "crashed");
  assert.equal(frame.gatesCleared, 0);
});

test("does clear the leg once every gate is behind the bird", () => {
  const level = { seed: 7, legIndex: 0, gatesPerLeg: 3 };
  const levelGates = resolveFappyGates(level).map((gate) => ({
    ...gate,
    gapTop: FAPPY_WORLD.restY - FAPPY_WORLD.gapHeight / 2,
    gapBottom: FAPPY_WORLD.restY + FAPPY_WORLD.gapHeight / 2
  }));
  let frame = createFappyLegStart();

  while (frame.outcome === null && frame.tick < resolveFappyLegTickCap(level.gatesPerLeg)) {
    frame = stepFappy(
      { ...frame, bird: { y: FAPPY_WORLD.restY, vy: 0 } },
      levelGates,
      level.gatesPerLeg,
      false
    );
  }

  assert.equal(frame.outcome, "cleared");
  assert.equal(frame.gatesCleared, 3);
});

test("does ignore flaps after the outcome and step a terminal frame to itself", () => {
  const run = runFappyLeg(course, []);
  const afterwards = stepFappy(run.frame, gates, course.gatesPerLeg, true);

  assert.deepEqual(afterwards, run.frame);
  assert.deepEqual(runFappyLeg(course, [run.endTick + 5, run.endTick + 9]).frame, run.frame);
});

test("does reach the same frame whether advanced in one go or in pieces", () => {
  const flapTicks = holdAltitude(400, 17);
  const whole = advanceFappy(createFappyLegStart(), gates, course.gatesPerLeg, flapTicks, 400);
  const firstHalf = advanceFappy(createFappyLegStart(), gates, course.gatesPerLeg, flapTicks, 150);
  const pieces = advanceFappy(firstHalf, gates, course.gatesPerLeg, flapTicks, 400);

  assert.deepEqual(pieces, whole);
});

test("does size the tick cap past the whole course so a run always resolves", () => {
  const run = runFappyLeg(course, holdAltitude(resolveFappyLegTickCap(course.gatesPerLeg), 1));

  // Pinned to the ceiling the bird cannot thread a gate, so this ends in a crash, and it ends.
  assert.equal(run.outcome, "crashed");
  assert.ok(run.endTick < resolveFappyLegTickCap(course.gatesPerLeg));
});
