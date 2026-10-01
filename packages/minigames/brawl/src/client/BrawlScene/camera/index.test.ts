import assert from "node:assert/strict";
import test from "node:test";
import { BRAWL_WORLD } from "@wingnight/shared";

import { TABLET_CAMERA, TABLET_CAMERA_FIT, resolveCamera, resolveFillCamera, resolveViewBox } from "./index.js";

const TV_ARENA = { width: 1890, height: 847 };

test("does keep the tablet on the sim's own box whatever it is drawn into", () => {
  assert.deepEqual(resolveCamera(TABLET_CAMERA_FIT, TV_ARENA), TABLET_CAMERA);
  assert.deepEqual(resolveCamera(TABLET_CAMERA_FIT, null), TABLET_CAMERA);
  assert.equal(TABLET_CAMERA.width, BRAWL_WORLD.width);
  assert.equal(TABLET_CAMERA.height, BRAWL_WORLD.height);
});

test("does widen a fill camera to the box's aspect when the box is wider than the floor", () => {
  const camera = resolveCamera({ kind: "fill", minWidth: 160, height: 90 }, TV_ARENA);

  assert.equal(camera.width, 200.83);
  assert.equal(camera.height, 90);
  // On the sim camera's own left edge unless the fit says otherwise.
  assert.equal(camera.x, 0);
  assert.equal(camera.y, 0);
});

test("does hold a fill camera at its floor when the box is narrower or not measured yet", () => {
  const fit = { kind: "fill", x: -12, y: -4, minWidth: 160, height: 90 } as const;

  assert.equal(resolveFillCamera(fit, { width: 100, height: 100 }).width, 160);
  assert.equal(resolveFillCamera(fit, null).width, 160);
  assert.equal(resolveFillCamera(fit, { width: 100, height: 0 }).width, 160);
  assert.equal(resolveFillCamera(fit, null).x, -12);
});

test("does split a fill camera's extra width either side of the tablet's window when asked", () => {
  const camera = resolveCamera({ kind: "fill", minWidth: 160, height: 90, split: true }, TV_ARENA);

  assert.equal(camera.width, 200.83);
  // Half the extra on the left, so a goon from behind is on the wall as early as one from ahead.
  assert.equal(camera.x, -20.42);
  assert.equal((camera.x + camera.width).toFixed(2), "180.41");
  // Nothing to split at the floor.
  assert.equal(resolveFillCamera({ kind: "fill", minWidth: 160, height: 90, split: true }, null).x, 0);
});

test("does write a camera as the viewBox it is", () => {
  assert.equal(resolveViewBox(TABLET_CAMERA), "0 0 160 90");
});
