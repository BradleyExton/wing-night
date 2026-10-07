import assert from "node:assert/strict";
import test from "node:test";

import { pickFittingEncoding, resolveDownscaledSize } from "./index";

test("does shrink the long edge to the portal's when a phone photo is bigger", () => {
  assert.deepEqual(resolveDownscaledSize(4032, 3024, 1024), { width: 1024, height: 768 });
  assert.deepEqual(resolveDownscaledSize(3024, 4032, 1024), { width: 768, height: 1024 });
});

test("does keep a photo's size when it is already small enough", () => {
  assert.deepEqual(resolveDownscaledSize(640, 480, 1024), { width: 640, height: 480 });
});

test("does step the quality down when an encoding is over the upload cap", () => {
  const tried: number[] = [];
  const dataUrl = pickFittingEncoding((quality) => {
    tried.push(quality);
    return "x".repeat(quality > 0.7 ? 200 : 50);
  }, 100);

  assert.equal(dataUrl?.length, 50);
  assert.deepEqual(tried, [0.86, 0.75, 0.6]);
});

test("does give up when no quality fits", () => {
  assert.equal(pickFittingEncoding(() => "x".repeat(500), 100), null);
});
