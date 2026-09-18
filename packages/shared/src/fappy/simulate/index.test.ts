import assert from "node:assert/strict";
import test from "node:test";

import {
  FAPPY_WORLD,
  resolveFappyChampTop,
  resolveFappyGates,
  resolveFappyLegTickCap,
  resolveFappyPerchY,
  resolveFappyWave
} from "../world/index.js";
import { advanceFappy, createFappyLegStart, runFappyLeg, stepFappy } from "./index.js";

const course = { seed: 1234, legIndex: 0, gatesPerLeg: 8 };
const gates = resolveFappyGates(course);

const everyTick = (untilTick: number, everyTicks: number): number[] => {
  const ticks: number[] = [];

  for (let tick = 0; tick < untilTick; tick += everyTicks) {
    ticks.push(tick);
  }

  return ticks;
};

// Holds the bird on a line by hand so a test is about the rule under test, not about flying.
const stepPinned = (frame: ReturnType<typeof createFappyLegStart>, y: number, legGates = gates): ReturnType<typeof stepFappy> => {
  return stepFappy({ ...frame, bird: { y, vy: 0 } }, legGates, course.gatesPerLeg, false);
};

test("does derive the same gates for the same course on every call", () => {
  assert.deepEqual(resolveFappyGates(course), gates);
  assert.notDeepEqual(resolveFappyGates({ ...course, seed: 99 }), gates);
  assert.notDeepEqual(resolveFappyGates({ ...course, legIndex: 1 }), gates);
});

test("does leave every gate a flyable gap at the champ's full stretch", () => {
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    const legGates = resolveFappyGates({ seed, legIndex: 2, gatesPerLeg: 12 });

    legGates.forEach((gate, gateOffset) => {
      const highestHead = gate.champTop - gate.champBob;

      assert.ok(gate.champTop >= FAPPY_WORLD.champTopMin && gate.champTop <= FAPPY_WORLD.champTopMax);
      assert.ok(FAPPY_WORLD.champBobs.includes(gate.champBob));
      assert.ok(gate.champPhaseTicks >= 0 && gate.champPhaseTicks < gate.champPeriodTicks);
      assert.ok(highestHead - (gate.eagleBottom ?? 0) >= FAPPY_WORLD.gapHeight);
      assert.equal(gate.index, 2 * 12 + gateOffset);
      assert.equal(gate.x, FAPPY_WORLD.firstGateX + gateOffset * FAPPY_WORLD.gateSpacing);
    });
  }
});

test("does hang an eagle over some gates and leave others clear to the sky", () => {
  const legGates = resolveFappyGates({ seed: 5, legIndex: 0, gatesPerLeg: 24 });

  assert.ok(legGates.some((gate) => gate.eagleBottom !== null));
  assert.ok(legGates.some((gate) => gate.eagleBottom === null));
});

test("does bob the champ's head between its rest and its full stretch", () => {
  const gate = { ...gates[0]!, champTop: 60, champBob: 10, champPeriodTicks: 100, champPhaseTicks: 0 };

  assert.equal(resolveFappyWave(0, 100, 0), 0);
  assert.equal(resolveFappyWave(50, 100, 0), 1);
  assert.equal(resolveFappyWave(100, 100, 0), 0);
  assert.equal(resolveFappyChampTop(gate, 0), 60);
  assert.equal(resolveFappyChampTop(gate, 50), 50);
  assert.equal(resolveFappyChampTop({ ...gate, champBob: 0 }, 50), 60);
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

  const pinned = advanceFappy(start, gates, course.gatesPerLeg, everyTick(60, 1), 60);

  assert.equal(pinned.bird.y, FAPPY_WORLD.birdRadius);
  assert.equal(pinned.outcome, null);
});

test("does count a gate once its trailing edge is behind the bird", () => {
  const firstGate = gates[0]!;
  const gatePassedScroll = firstGate.x + FAPPY_WORLD.gateWidth - (FAPPY_WORLD.birdX - FAPPY_WORLD.birdRadius);
  const ticksToPass = Math.ceil(gatePassedScroll / FAPPY_WORLD.scrollSpeed) + 1;
  const perch = resolveFappyPerchY(firstGate);
  let frame = createFappyLegStart();

  for (let tick = 0; tick < ticksToPass; tick += 1) {
    frame = stepPinned(frame, perch);
  }

  assert.equal(frame.gatesCleared, 1);
  assert.equal(frame.outcome, null);
});

test("does crash into the champ's head when the bird is too low at the column", () => {
  const firstGate = gates[0]!;
  const ticksToColumn = Math.ceil((firstGate.x - FAPPY_WORLD.birdX) / FAPPY_WORLD.scrollSpeed) + 1;
  let frame = createFappyLegStart();

  for (let tick = 0; tick < ticksToColumn; tick += 1) {
    frame = stepPinned(frame, firstGate.champTop - firstGate.champBob + 1);
  }

  assert.equal(frame.outcome, "crashed");
  assert.equal(frame.gatesCleared, 0);
});

test("does crash into the eagle when the bird is too high under one", () => {
  const eagleGates = gates.map((gate, index) => (index === 0 ? { ...gate, eagleBottom: 20 } : gate));
  const ticksToColumn = Math.ceil((eagleGates[0]!.x - FAPPY_WORLD.birdX) / FAPPY_WORLD.scrollSpeed) + 1;
  let frame = createFappyLegStart();

  for (let tick = 0; tick < ticksToColumn; tick += 1) {
    frame = stepPinned(frame, 20 - FAPPY_WORLD.birdRadius + 1, eagleGates);
  }

  assert.equal(frame.outcome, "crashed");
});

test("does clear the leg once every gate is behind the bird", () => {
  const level = { seed: 7, legIndex: 0, gatesPerLeg: 3 };
  const levelGates = resolveFappyGates(level).map((gate) => ({
    ...gate,
    champTop: 70,
    champBob: 0,
    eagleBottom: null
  }));
  let frame = createFappyLegStart();

  while (frame.outcome === null && frame.tick < resolveFappyLegTickCap(level.gatesPerLeg)) {
    frame = stepFappy({ ...frame, bird: { y: 40, vy: 0 } }, levelGates, level.gatesPerLeg, false);
  }

  assert.equal(frame.outcome, "cleared");
  assert.equal(frame.gatesCleared, 3);
});

test("does start a checkpointed attempt on the perch just past the last cleared gate", () => {
  const start = createFappyLegStart(gates, 3);
  const perchGate = gates[2]!;

  assert.equal(start.gatesCleared, 3);
  assert.equal(start.bird.y, resolveFappyPerchY(perchGate));
  assert.ok(perchGate.x + FAPPY_WORLD.gateWidth - start.scrollX < FAPPY_WORLD.birdX - FAPPY_WORLD.birdRadius);

  const next = stepFappy(start, gates, course.gatesPerLeg, false);

  assert.equal(next.gatesCleared, 3);
  assert.equal(next.outcome, null);
  assert.deepEqual(createFappyLegStart(gates, 0), createFappyLegStart());
  assert.equal(createFappyLegStart(gates, 99).gatesCleared, gates.length);
});

test("does ignore flaps after the outcome and step a terminal frame to itself", () => {
  const run = runFappyLeg(course, []);
  const afterwards = stepFappy(run.frame, gates, course.gatesPerLeg, true);

  assert.deepEqual(afterwards, run.frame);
  assert.deepEqual(runFappyLeg(course, [run.endTick + 5, run.endTick + 9]).frame, run.frame);
});

test("does reach the same frame whether advanced in one go or in pieces", () => {
  const flapTicks = everyTick(400, 17);
  const whole = advanceFappy(createFappyLegStart(), gates, course.gatesPerLeg, flapTicks, 400);
  const firstHalf = advanceFappy(createFappyLegStart(), gates, course.gatesPerLeg, flapTicks, 150);
  const pieces = advanceFappy(firstHalf, gates, course.gatesPerLeg, flapTicks, 400);

  assert.deepEqual(pieces, whole);
});

test("does size the tick cap past the whole course so a run always resolves", () => {
  const run = runFappyLeg(course, everyTick(resolveFappyLegTickCap(course.gatesPerLeg), 1));

  assert.equal(run.outcome, "crashed");
  assert.ok(run.endTick < resolveFappyLegTickCap(course.gatesPerLeg));
});
