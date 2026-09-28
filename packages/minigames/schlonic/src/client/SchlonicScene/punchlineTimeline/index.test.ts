import assert from "node:assert/strict";
import test from "node:test";
import { SCHLONIC_WORLD, createSchlonicRunStart, resolveSchlonicZone } from "@wingnight/shared";

import { PUNCHLINE_MS, WIPEOUT_BEAT_MS } from "../../beats/index.js";
import { TABLET_CAMERA } from "../camera/index.js";
import { GULL_HAUL_DROP } from "../Gull/index.js";
import {
  BAY_HEN_Y,
  BAY_SURFACE_Y,
  FALL_SPLASH_AT_MS,
  GULL_GRAB_AT_MS,
  GULL_IN_AT_MS,
  PUNCHLINE_END_MS,
  WIPEOUT_DROPPED_WINGS,
  WIPEOUT_KNOCK_MS,
  resolveBayHen,
  resolveBundleSize,
  resolveChompAtMs,
  resolveDroppedWing,
  resolveDueCues,
  resolveEater,
  resolveEaterSquash,
  resolveGullFlight,
  resolvePunchlineCues,
  resolveStandInPlace
} from "./index.js";

const ZONE = resolveSchlonicZone({ seed: 20260919, chunks: 22 });
const START = createSchlonicRunStart(ZONE);
const BADNIK = ZONE.props.find((prop) => prop.kind === "badnik");

test("does finish the joke before the card goes up, and the card before the beat ends", () => {
  assert.ok(PUNCHLINE_END_MS <= PUNCHLINE_MS);
  assert.ok(PUNCHLINE_MS < WIPEOUT_BEAT_MS);

  for (const outcome of ["fell", "wiped"] as const) {
    for (const mark of resolvePunchlineCues(outcome, 12)) {
      assert.ok(mark.atMs > 0 && mark.atMs < PUNCHLINE_MS, `${outcome} ${mark.cue} at ${mark.atMs}`);
    }
  }
});

test("does splash and squawk on a fall, and only splash when there was nothing to take", () => {
  assert.deepEqual(
    resolvePunchlineCues("fell", 7).map((mark) => mark.cue),
    ["splash", "squawk"]
  );
  assert.deepEqual(
    resolvePunchlineCues("fell", 0).map((mark) => mark.cue),
    ["splash"]
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

test("does size the gull's haul by the handful, one to three wings", () => {
  assert.equal(resolveBundleSize(0), 0);
  assert.equal(resolveBundleSize(1), 1);
  assert.equal(resolveBundleSize(18), 2);
  assert.equal(resolveBundleSize(90), 3);
});

test("does keep the hen under the bay until the splash, then bring it up to the water line", () => {
  assert.equal(resolveBayHen(FALL_SPLASH_AT_MS - 1, 70).visible, false);

  const surfaced = resolveBayHen(FALL_SPLASH_AT_MS + 900, 70);

  assert.equal(surfaced.visible, true);
  assert.ok(Math.abs(surfaced.y - BAY_HEN_Y) < 1);
});

test("does bring the gull down onto the handful, then carry it off the top of the picture", () => {
  const bundle = { x: 80, y: BAY_SURFACE_Y - 1 };

  assert.equal(resolveGullFlight(GULL_IN_AT_MS - 1, bundle, TABLET_CAMERA).visible, false);

  const diving = resolveGullFlight(GULL_IN_AT_MS + 10, bundle, TABLET_CAMERA);
  const grabbing = resolveGullFlight(GULL_GRAB_AT_MS, bundle, TABLET_CAMERA);
  const leaving = resolveGullFlight(1860, bundle, TABLET_CAMERA);

  assert.equal(diving.carrying, false);
  assert.ok(diving.y < TABLET_CAMERA.y);
  assert.equal(grabbing.carrying, true);
  assert.ok(Math.abs(grabbing.x - bundle.x) < 0.5 && Math.abs(grabbing.y - (bundle.y - GULL_HAUL_DROP)) < 0.5);
  assert.ok(leaving.x > bundle.x && leaving.y < TABLET_CAMERA.y + 2);
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
