import assert from "node:assert/strict";
import test from "node:test";

import {
  FAPPY_WORLD,
  resolveFappyChampTop,
  resolveFappyCliffPerchY,
  resolveFappyGates,
  resolveFappyLandingX,
  resolveFappyLegTickCap,
  resolveFappyPerchY,
  resolveFappyWave
} from "../world/index.js";
import { advanceFappy, createFappyLegStart, runFappyLeg, stepFappy } from "./index.js";

const course = { seed: 1234, legIndex: 0, gatesPerLeg: 8 };
const gates = resolveFappyGates(course);
const perch = resolveFappyCliffPerchY();

const everyTick = (untilTick: number, everyTicks: number): number[] => {
  const ticks: number[] = [];

  for (let tick = 0; tick < untilTick; tick += everyTicks) {
    ticks.push(tick);
  }

  return ticks;
};

// Holds the bird on a line by hand so a test is about the rule under test, not about flying.
const stepPinned = (
  frame: ReturnType<typeof createFappyLegStart>,
  y: number,
  legGates = gates,
  gatesPerLeg = course.gatesPerLeg
): ReturnType<typeof stepFappy> => {
  return stepFappy({ ...frame, bird: { y, vy: 0 } }, legGates, gatesPerLeg, false);
};

const ticksUntilScroll = (scrollX: number): number => {
  return Math.ceil(scrollX / FAPPY_WORLD.scrollSpeed) + 1;
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

test("does stand the bird on the start cliff and hold it there until the drop", () => {
  const start = createFappyLegStart();

  assert.equal(start.bird.y, perch);

  // Ten ticks of nothing: still over the cliff, still standing on it.
  const standing = advanceFappy(start, gates, course.gatesPerLeg, [], 10);

  assert.equal(standing.bird.y, perch);
  assert.equal(standing.bird.vy, 0);
  assert.equal(standing.outcome, null);

  // A hop that comes back down before the edge lands on the cliff, not in the sand.
  const hopped = advanceFappy(start, gates, course.gatesPerLeg, [0], 30);

  assert.equal(hopped.bird.y, perch);
  assert.equal(hopped.outcome, null);
});

test("does fall off the start cliff and crash when nobody flaps", () => {
  const run = runFappyLeg(course, []);

  assert.equal(run.outcome, "crashed");
  assert.equal(run.gatesCleared, 0);
  assert.equal(run.frame.bird.y, FAPPY_WORLD.floorY - FAPPY_WORLD.birdRadius);
  assert.ok(run.endTick > ticksUntilScroll(FAPPY_WORLD.startCliffEnd - FAPPY_WORLD.birdX) && run.endTick < 120);
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
  const ticksToPass = ticksUntilScroll(
    firstGate.x + FAPPY_WORLD.gateWidth - (FAPPY_WORLD.birdX - FAPPY_WORLD.birdRadius)
  );
  const gapCentre = resolveFappyPerchY(firstGate);
  let frame = createFappyLegStart();

  for (let tick = 0; tick < ticksToPass; tick += 1) {
    frame = stepPinned(frame, gapCentre);
  }

  assert.equal(frame.gatesCleared, 1);
  assert.equal(frame.outcome, null);
});

test("does crash into the champ's head when the bird is too low at the column", () => {
  const firstGate = gates[0]!;
  let frame = createFappyLegStart();

  for (let tick = 0; tick < ticksUntilScroll(firstGate.x - FAPPY_WORLD.birdX); tick += 1) {
    frame = stepPinned(frame, firstGate.champTop - firstGate.champBob + 1);
  }

  assert.equal(frame.outcome, "crashed");
  assert.equal(frame.gatesCleared, 0);
});

test("does crash into the eagle when the bird is too high under one", () => {
  const eagleGates = gates.map((gate, index) => (index === 0 ? { ...gate, eagleBottom: 20 } : gate));
  let frame = createFappyLegStart();

  for (let tick = 0; tick < ticksUntilScroll(eagleGates[0]!.x - FAPPY_WORLD.birdX); tick += 1) {
    frame = stepPinned(frame, 20 - FAPPY_WORLD.birdRadius + 1, eagleGates);
  }

  assert.equal(frame.outcome, "crashed");
});

// A pinned flight down the whole corridor: on the gap centres through the gates,
// then at `approachY` up to the landing cliff's face, then at `plateauY` over it.
const flyPinned = (
  approachY: number,
  plateauY: number,
  gatesPerLeg = 3,
  seed = 7
): ReturnType<typeof stepFappy> => {
  const level = { seed, legIndex: 0, gatesPerLeg };
  const levelGates = resolveFappyGates(level);
  const cap = resolveFappyLegTickCap(gatesPerLeg);
  const landingX = resolveFappyLandingX(gatesPerLeg);
  let frame = createFappyLegStart();

  while (frame.outcome === null && frame.tick < cap) {
    const nextGate = levelGates[frame.gatesCleared];
    const isOverPlateau = FAPPY_WORLD.birdX >= landingX - frame.scrollX;
    const y =
      nextGate !== undefined ? resolveFappyPerchY(nextGate) : isOverPlateau ? plateauY : approachY;

    frame = stepPinned(frame, y, levelGates, gatesPerLeg);
  }

  return frame;
};

test("does clear the leg by coming down on the landing plateau", () => {
  const landed = flyPinned(perch - 3, perch + 0.5);

  assert.equal(landed.outcome, "cleared");
  assert.equal(landed.gatesCleared, 3);
  assert.equal(landed.bird.y, perch);
  assert.ok(landed.scrollX >= resolveFappyLandingX(3) - FAPPY_WORLD.birdX);
});

test("does crash into the landing cliff's face when the bird arrives too low", () => {
  const crashed = flyPinned(FAPPY_WORLD.cliffTop + 6, perch + 0.5);

  assert.equal(crashed.outcome, "crashed");
  assert.equal(crashed.gatesCleared, 3);
  assert.ok(crashed.scrollX < resolveFappyLandingX(3) - FAPPY_WORLD.birdX + FAPPY_WORLD.birdRadius);
});

test("does crash into the far wall when the bird never comes down", () => {
  const crashed = flyPinned(30, 30);

  assert.equal(crashed.outcome, "crashed");
  assert.ok(crashed.scrollX > resolveFappyLandingX(3) + FAPPY_WORLD.landingZoneWidth - FAPPY_WORLD.birdX - FAPPY_WORLD.birdRadius);
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

  // Pinned to the ceiling the bird cannot thread a gate, so this ends in a crash, and it ends.
  assert.equal(run.outcome, "crashed");
  assert.ok(run.endTick < resolveFappyLegTickCap(course.gatesPerLeg));
});
