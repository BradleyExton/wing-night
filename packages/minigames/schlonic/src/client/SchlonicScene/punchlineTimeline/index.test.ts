import assert from "node:assert/strict";
import test from "node:test";
import { SCHLONIC_WORLD, createSchlonicRunStart, resolveSchlonicZone } from "@wingnight/shared";

import { PUNCHLINE_MS, WIPEOUT_BEAT_MS } from "../../beats/index.js";
import { TABLET_CAMERA } from "../camera/index.js";
import {
  FALL_THUD_AT_MS,
  PUNCHLINE_END_MS,
  RACCOON_CHITTER_AT_MS,
  RACCOON_IN_AT_MS,
  RACCOON_OUT_AT_MS,
  TRENCH_HEN_BELOW_LIP,
  WIPEOUT_DROPPED_WINGS,
  WIPEOUT_KNOCK_MS,
  resolveBundleSize,
  resolveChompAtMs,
  resolveDroppedWing,
  resolveDueCues,
  resolveEater,
  resolveEaterSquash,
  resolvePunchlineCues,
  resolveRaccoon,
  resolveRunawayBoard,
  resolveStandInPlace,
  resolveTrench,
  resolveTrenchHen
} from "./index.js";

const ZONE = resolveSchlonicZone({ seed: 20260919, chunks: 22 });
const START = createSchlonicRunStart(ZONE);
const BADNIK = ZONE.props.find((prop) => prop.kind === "badnik");
const PIT = ZONE.pits[0];

test("does finish the joke before the card goes up, and the card before the beat ends", () => {
  assert.ok(PUNCHLINE_END_MS <= PUNCHLINE_MS);
  assert.ok(PUNCHLINE_MS < WIPEOUT_BEAT_MS);

  for (const outcome of ["fell", "wiped"] as const) {
    for (const mark of resolvePunchlineCues(outcome, 12)) {
      assert.ok(mark.atMs > 0 && mark.atMs < PUNCHLINE_MS, `${outcome} ${mark.cue} at ${mark.atMs}`);
    }
  }
});

test("does thud and chitter on a fall, and only thud when there was nothing to take", () => {
  assert.deepEqual(
    resolvePunchlineCues("fell", 7).map((mark) => mark.cue),
    ["thud", "chitter"]
  );
  assert.deepEqual(
    resolvePunchlineCues("fell", 0).map((mark) => mark.cue),
    ["thud"]
  );
});

test("does chomp once per dropped wing and burp after the last when the run is wiped", () => {
  const cues = resolvePunchlineCues("wiped", 0).map((mark) => mark.cue);

  assert.equal(cues.filter((cue) => cue === "chomp").length, WIPEOUT_DROPPED_WINGS);
  assert.equal(cues[cues.length - 1], "burp");
});

test("does sound each cue once when a loop steps across it, however the steps fall", () => {
  const cues = resolvePunchlineCues("wiped", 0);
  const heard = [0, 400, 1100, 1300, 1600, 2000, 3000].flatMap((toMs, step, steps) =>
    resolveDueCues(cues, steps[step - 1] ?? -1, toMs)
  );

  assert.equal(heard.length, cues.length);
});

test("does size the raccoon's haul by the handful, one to three wings", () => {
  assert.equal(resolveBundleSize(0), 0);
  assert.equal(resolveBundleSize(1), 1);
  assert.equal(resolveBundleSize(18), 2);
  assert.equal(resolveBundleSize(90), 3);
});

test("does find the trench the hen went down, on screen and under the runner", () => {
  assert.ok(PIT !== undefined);

  const frame = { ...START, x: (PIT.fromX + PIT.toX) / 2, outcome: "fell" as const };
  const trench = resolveTrench(ZONE, frame);

  assert.ok(trench.fromX < SCHLONIC_WORLD.runnerX && trench.toX > SCHLONIC_WORLD.runnerX);
  assert.equal(trench.toX - trench.fromX, PIT.toX - PIT.fromX);
  assert.equal(trench.lipY, PIT.lipY);
});

test("does keep the hen down the trench until the thud, then bring it up to peek over the lip", () => {
  const trench = { fromX: 36, toX: 58, lipY: 66 };

  assert.equal(resolveTrenchHen(FALL_THUD_AT_MS - 1, trench).visible, false);

  const peeking = resolveTrenchHen(FALL_THUD_AT_MS + 900, trench);

  assert.equal(peeking.visible, true);
  assert.ok(Math.abs(peeking.y - (trench.lipY + TRENCH_HEN_BELOW_LIP)) < 1);
  assert.ok(peeking.x >= trench.fromX && peeking.x < trench.toX);
});

test("does climb the raccoon out of the trench, chitter on the far lip, and run it off the picture", () => {
  const trench = { fromX: 36, toX: 58, lipY: 66 };
  const flat = (): number => 66;

  assert.equal(resolveRaccoon(RACCOON_IN_AT_MS - 1, trench, TABLET_CAMERA, flat).visible, false);

  const climbing = resolveRaccoon(RACCOON_IN_AT_MS + 60, trench, TABLET_CAMERA, flat);
  const chittering = resolveRaccoon(RACCOON_CHITTER_AT_MS + 40, trench, TABLET_CAMERA, flat);
  const leaving = resolveRaccoon(RACCOON_OUT_AT_MS - 1, trench, TABLET_CAMERA, flat);

  assert.equal(climbing.isClimbing, true);
  assert.ok(climbing.y > trench.lipY, "it should start inside the trench");
  assert.ok(climbing.x < trench.toX);
  assert.equal(chittering.isClimbing, false);
  assert.ok(chittering.x > trench.toX && chittering.y === trench.lipY);
  assert.ok(chittering.chitter > 0);
  assert.ok(leaving.x > TABLET_CAMERA.x + TABLET_CAMERA.width - 2);
  assert.equal(resolveRaccoon(RACCOON_OUT_AT_MS + 1, trench, TABLET_CAMERA, flat).visible, false);
});

test("does send the board rolling on up the sidewalk when the hen is wiped out", () => {
  const frame = { ...START, x: 200, outcome: "wiped" as const };
  const early = resolveRunawayBoard(100, frame, ZONE);
  const late = resolveRunawayBoard(1500, frame, ZONE);

  assert.ok(late.x > early.x && early.x > SCHLONIC_WORLD.runnerX);
  assert.ok(Math.abs(late.hop) < 1e-9, "the board should be back on its wheels");
});

test("does feed the wings to the badnik that is standing in the picture", () => {
  assert.ok(BADNIK !== undefined);

  const frame = { ...START, x: BADNIK.x - 6, y: BADNIK.y - SCHLONIC_WORLD.runnerRadius, outcome: "wiped" as const };
  const eater = resolveEater(ZONE, frame, TABLET_CAMERA);

  assert.deepEqual(eater, { kind: "zone", propIndex: BADNIK.index, x: BADNIK.x, y: BADNIK.y });
});

test("does pass over a badnik already popped, and send one in from the edge when none is left", () => {
  assert.ok(BADNIK !== undefined);

  const popped = ZONE.props.filter((prop) => prop.kind === "badnik").map((prop) => prop.index);
  const frame = { ...START, x: BADNIK.x - 6, takenProps: popped, outcome: "wiped" as const };
  const eater = resolveEater(ZONE, frame, TABLET_CAMERA);

  assert.equal(eater.kind, "standIn");
  assert.ok(eater.kind === "standIn" && eater.fromX > eater.x);
  // It hops in from off the picture and is in place before the first wing gets to it.
  assert.ok(resolveStandInPlace(eater, ZONE, 0).x > eater.x);
  assert.equal(resolveStandInPlace(eater, ZONE, resolveChompAtMs(0)).x, eater.x);
});

test("does roll every dropped wing into the eater's mouth, and not one of them after", () => {
  assert.ok(BADNIK !== undefined);

  const frame = { ...START, x: BADNIK.x - 20, outcome: "wiped" as const };
  const eater = resolveEater(ZONE, frame, TABLET_CAMERA);

  for (let index = 0; index < WIPEOUT_DROPPED_WINGS; index += 1) {
    const flying = resolveDroppedWing(index, WIPEOUT_KNOCK_MS / 2, frame, ZONE, eater);
    const nearlyIn = resolveDroppedWing(index, resolveChompAtMs(index) - 1, frame, ZONE, eater);
    const eaten = resolveDroppedWing(index, resolveChompAtMs(index), frame, ZONE, eater);

    assert.equal(flying.visible, true);
    assert.ok(Math.abs(nearlyIn.x - eater.x) < 1.5, `wing ${index} ends at ${nearlyIn.x}`);
    assert.equal(eaten.visible, false);
  }
});

test("does gulp as each wing goes in and sit still between gulps", () => {
  assert.ok(resolveEaterSquash(resolveChompAtMs(0) + 70).sy < 0.8);
  assert.deepEqual(resolveEaterSquash(WIPEOUT_KNOCK_MS), { sx: 1, sy: 1 });
});
