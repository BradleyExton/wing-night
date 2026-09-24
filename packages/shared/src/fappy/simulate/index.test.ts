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
  resolveFappySpit,
  resolveFappySpitPhase,
  resolveFappyWaitingX,
  resolveFappyWave
} from "../world/index.js";
import { advanceFappy, createFappyLegLanding, createFappyLegStart, runFappyLeg, stepFappy } from "./index.js";

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

test("does deal every course a mix of champ kinds and make some of them spitters", () => {
  const legGates = resolveFappyGates({ seed: 5, legIndex: 0, gatesPerLeg: 24 });
  const kinds = new Set(legGates.map((gate) => gate.champKind));

  assert.ok(kinds.has("pink") && kinds.has("ebony") && kinds.has("ivory"), [...kinds].join(","));
  assert.ok(legGates.some((gate) => gate.spitPeriodTicks > 0));
  assert.ok(legGates.some((gate) => gate.spitPeriodTicks === 0));

  for (const gate of legGates) {
    if (gate.spitPeriodTicks === 0) {
      assert.equal(gate.spitPhaseTicks, 0);
      continue;
    }

    // A beat outlives a glob, so a champ has at most one in the air.
    assert.ok(gate.spitPeriodTicks > FAPPY_WORLD.spitLifeTicks);
    assert.ok(gate.spitPhaseTicks >= 0 && gate.spitPhaseTicks < gate.spitPeriodTicks);
  }
});

test("does throw a glob up and towards the bird on the beat, then let it fall and die", () => {
  const gate = { ...gates[0]!, champBob: 0, spitPeriodTicks: 100, spitPhaseTicks: 0 };
  const mouthX = gate.x + FAPPY_WORLD.gateWidth / 2;
  const mouthY = gate.champTop + FAPPY_WORLD.spitMouthDepth;

  assert.equal(resolveFappySpitPhase({ ...gate, spitPeriodTicks: 0 }, 5), null);
  assert.equal(resolveFappySpit({ ...gate, spitPeriodTicks: 0 }, 5), null);
  assert.deepEqual(resolveFappySpit(gate, 0), { gate: gate.index, launchTick: 0, x: mouthX, y: mouthY, age: 0 });

  const rising = resolveFappySpit(gate, 10)!;
  const later = resolveFappySpit(gate, 60)!;

  assert.equal(rising.launchTick, 0);
  assert.ok(rising.x < mouthX, "it travels towards the bird");
  assert.ok(rising.y < mouthY, "it goes up first");
  assert.ok(later.y > rising.y, "and comes back down");
  assert.equal(resolveFappySpit(gate, FAPPY_WORLD.spitLifeTicks), null);
  assert.equal(resolveFappySpit(gate, 100)!.launchTick, 100);
  // A phase shifts the beat: this one spits on tick 30, not tick 0.
  assert.equal(resolveFappySpit({ ...gate, spitPhaseTicks: 70 }, 30)!.age, 0);
});

test("does splat the bird once when a glob reaches it and shove it down", () => {
  // Twenty ticks after the beat the glob is 11 units short of the mouth and 17 above it;
  // stand a gate so that point is exactly where the bird will be on the next tick.
  const age = 20;
  const gate = { ...gates[0]!, champBob: 0, champTop: 60, spitPeriodTicks: 100, spitPhaseTicks: 0 };
  const glob = resolveFappySpit(gate, age)!;
  const start = createFappyLegStart();
  const scrollX = 500;
  const legGates = [{ ...gate, x: gate.x + (FAPPY_WORLD.birdX + scrollX + FAPPY_WORLD.scrollSpeed - glob.x) }];
  const before = { ...start, tick: age - 1, scrollX };
  const hit = stepPinned(before, glob.y, legGates, 20);

  assert.equal(hit.outcome, null);
  assert.deepEqual(hit.splats, [{ gate: gate.index, launchTick: 0, tick: age }]);
  assert.equal(hit.bird.vy, FAPPY_WORLD.spitSplatVelocity);

  // The same glob is spent: the next tick falls on gravity alone.
  const after = stepFappy(hit, legGates, 20, false);

  assert.equal(after.splats.length, 1);
  assert.equal(after.bird.vy, FAPPY_WORLD.spitSplatVelocity + FAPPY_WORLD.gravity);

  // Far from the glob nothing happens, and a fresh attempt starts clean.
  const missed = stepPinned(before, glob.y - 30, legGates, 20);

  assert.deepEqual(missed.splats, []);
  assert.deepEqual(createFappyLegStart(legGates, 1).splats, []);
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

test("does knock an eagle out of the sky instead of crashing when the bird bumps it", () => {
  const eagleGates = gates.map((gate, index) => (index === 0 ? { ...gate, eagleBottom: 20 } : gate));
  const cap = ticksUntilScroll(eagleGates[0]!.x - FAPPY_WORLD.birdX) + 5;
  let frame = createFappyLegStart();

  while (frame.knockedEagles.length === 0 && frame.tick < cap) {
    frame = stepPinned(frame, 20 - FAPPY_WORLD.birdRadius + 1, eagleGates);
  }

  assert.equal(frame.outcome, null);
  assert.deepEqual(frame.knockedEagles, [{ gate: eagleGates[0]!.index, tick: frame.tick }]);
  assert.ok(frame.tick > 0 && frame.tick < cap);
  assert.equal(frame.bird.vy, FAPPY_WORLD.eagleBumpVelocity);

  // The eagle is gone: the same line through the column is clear air now.
  const again = stepFappy({ ...frame, bird: { y: 20 - FAPPY_WORLD.birdRadius + 1, vy: 0 } }, eagleGates, course.gatesPerLeg, false);

  assert.equal(again.outcome, null);
  assert.equal(again.knockedEagles.length, 1);
});

test("does keep an eagle gone on the next attempt and hide it rather than replay the knock", () => {
  const eagleGates = gates.map((gate, index) => (index === 1 ? { ...gate, eagleBottom: 20 } : gate));
  const start = createFappyLegStart(eagleGates, 1, [eagleGates[1]!.index]);

  assert.deepEqual(start.knockedEagles, [{ gate: eagleGates[1]!.index, tick: -1 }]);

  let frame = start;

  while (frame.gatesCleared < 2 && frame.outcome === null) {
    frame = stepPinned(frame, 20 - FAPPY_WORLD.birdRadius + 1, eagleGates);
  }

  assert.equal(frame.outcome, null);
  assert.equal(frame.gatesCleared, 2);
  assert.equal(frame.knockedEagles.length, 1);
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

test("does settle a leg nobody flew on the landing plateau, short of the waiting bird, with every gate counted", () => {
  const gates = resolveFappyGates({ seed: 7, legIndex: 0, gatesPerLeg: 3 });
  const landing = createFappyLegLanding(gates, 3, [1]);
  const plateauStart = resolveFappyLandingX(3) - landing.scrollX;
  const waiterX = resolveFappyWaitingX(3) - landing.scrollX;

  assert.equal(landing.outcome, "cleared");
  assert.equal(landing.gatesCleared, 3);
  assert.equal(landing.bird.y, resolveFappyCliffPerchY());
  assert.ok(FAPPY_WORLD.birdX > plateauStart, "over the plateau");
  assert.ok(FAPPY_WORLD.birdX < waiterX, "left of the waiter");
  assert.deepEqual(landing.knockedEagles, [{ gate: 1, tick: -1 }]);
});
