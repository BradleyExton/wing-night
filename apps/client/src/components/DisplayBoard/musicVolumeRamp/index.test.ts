import assert from "node:assert/strict";
import test, { mock } from "node:test";

import { createVolumeRamp, resolveRampVolume } from "./index";

test("interpolates linearly between the two volumes over the duration", () => {
  assert.equal(resolveRampVolume(0, 1, 0, 1000), 0);
  assert.equal(resolveRampVolume(0, 1, 500, 1000), 0.5);
  assert.equal(resolveRampVolume(1, 0, 250, 1000), 0.75);
  assert.equal(resolveRampVolume(0, 1, 1000, 1000), 1);
});

// A throttled timer can skip straight past the end; the ramp must land on
// its target rather than overshoot or stall short of it.
test("lands on the target when the clock has run past the duration", () => {
  assert.equal(resolveRampVolume(0, 0.8, 5000, 1000), 0.8);
  assert.equal(resolveRampVolume(0.8, 0, 5000, 1000), 0);
});

test("jumps to the target when the duration is zero", () => {
  assert.equal(resolveRampVolume(0, 1, 0, 0), 1);
});

test("drives the media volume to the target and reports done once", () => {
  mock.timers.enable({ apis: ["setInterval", "Date"] });
  const media = { volume: 0 };
  let doneCalls = 0;

  createVolumeRamp(media, () => 1, 400, () => {
    doneCalls += 1;
  });

  mock.timers.tick(200);
  assert.ok(media.volume > 0.3 && media.volume < 0.7, `mid-ramp volume ${media.volume}`);

  mock.timers.tick(400);
  assert.equal(media.volume, 1);
  assert.equal(doneCalls, 1);

  mock.timers.tick(400);
  assert.equal(doneCalls, 1);
  mock.timers.reset();
});

// The host can move the master slider mid-fade; the ramp follows it rather
// than landing on the value it captured at its start.
test("follows a target that moves while the ramp is running", () => {
  mock.timers.enable({ apis: ["setInterval", "Date"] });
  const media = { volume: 0 };
  let target = 1;

  createVolumeRamp(media, () => target, 400, () => {});

  mock.timers.tick(200);
  target = 0.5;
  mock.timers.tick(400);

  assert.equal(media.volume, 0.5);
  mock.timers.reset();
});

test("stops touching the volume once cancelled", () => {
  mock.timers.enable({ apis: ["setInterval", "Date"] });
  const media = { volume: 1 };
  let doneCalls = 0;

  const ramp = createVolumeRamp(media, () => 0, 400, () => {
    doneCalls += 1;
  });

  mock.timers.tick(120);
  const volumeAtCancel = media.volume;
  ramp.cancel();
  mock.timers.tick(1000);

  assert.equal(media.volume, volumeAtCancel);
  assert.equal(doneCalls, 0);
  mock.timers.reset();
});
