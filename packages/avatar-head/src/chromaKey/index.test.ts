import assert from "node:assert/strict";
import test from "node:test";

import { cropPixels, keyAndCropHead, knockOutBackground, opaqueBounds, type RgbaImage } from "./index.ts";

type Pixel = [number, number, number, number];

const pixel = (r: number, g: number, b: number): Pixel => [r, g, b, 255];
const image = (rows: Pixel[][]): RgbaImage => ({
  pixels: new Uint8ClampedArray(rows.flat(2)),
  width: rows[0]?.length ?? 0,
  height: rows.length
});
const alphaAt = (img: RgbaImage, x: number, y: number): number | undefined =>
  img.pixels[(y * img.width + x) * 4 + 3];

const MAGENTA = pixel(255, 0, 255);
const HAIR = pixel(120, 80, 40);
const SKIN = pixel(230, 190, 160);

test("does clear the background from the border but keep a near-key tint the head encloses", () => {
  const tint = pixel(200, 60, 200);
  const img = image([
    [MAGENTA, MAGENTA, MAGENTA, MAGENTA, MAGENTA],
    [MAGENTA, HAIR, HAIR, HAIR, MAGENTA],
    [MAGENTA, HAIR, tint, HAIR, MAGENTA],
    [MAGENTA, HAIR, HAIR, HAIR, MAGENTA],
    [MAGENTA, MAGENTA, MAGENTA, MAGENTA, MAGENTA]
  ]);

  const cleared = knockOutBackground({ ...img, erode: 0 });

  assert.equal(cleared, 16);
  assert.equal(alphaAt(img, 2, 2), 255, "the enclosed tint keeps its alpha");
  assert.equal(alphaAt(img, 0, 0), 0, "a corner is cleared");
});

test("does clear an exact key pixel the head encloses when it sits between hair strands", () => {
  const img = image([
    [MAGENTA, MAGENTA, MAGENTA, MAGENTA, MAGENTA],
    [MAGENTA, HAIR, HAIR, HAIR, MAGENTA],
    [MAGENTA, HAIR, MAGENTA, HAIR, MAGENTA],
    [MAGENTA, HAIR, HAIR, HAIR, MAGENTA],
    [MAGENTA, MAGENTA, MAGENTA, MAGENTA, MAGENTA]
  ]);

  knockOutBackground({ ...img, erode: 0 });

  assert.equal(alphaAt(img, 2, 2), 0);
});

test("does eat the edge pixels when erode is set so a keyed fringe never shows", () => {
  const img = image([
    [MAGENTA, MAGENTA, MAGENTA, MAGENTA, MAGENTA],
    [MAGENTA, HAIR, HAIR, HAIR, MAGENTA],
    [MAGENTA, HAIR, HAIR, HAIR, MAGENTA],
    [MAGENTA, HAIR, HAIR, HAIR, MAGENTA],
    [MAGENTA, MAGENTA, MAGENTA, MAGENTA, MAGENTA]
  ]);

  knockOutBackground({ ...img, erode: 1 });

  assert.equal(alphaAt(img, 1, 1), 0, "an edge pixel of the head is eroded");
  assert.equal(alphaAt(img, 2, 2), 255, "the centre survives");
});

test("does tolerate jpeg noise on the background when it is within the tolerance", () => {
  const noisy = pixel(240, 20, 235);
  const img = image([[noisy, HAIR, noisy]]);

  knockOutBackground({ ...img, erode: 0, tolerance: 40 });

  assert.deepEqual([alphaAt(img, 0, 0), alphaAt(img, 1, 0), alphaAt(img, 2, 0)], [0, 255, 0]);
});

test("does report the opaque bounds after a knockout and null when nothing is left", () => {
  const img = image([
    [MAGENTA, MAGENTA, MAGENTA, MAGENTA],
    [MAGENTA, HAIR, HAIR, MAGENTA],
    [MAGENTA, MAGENTA, HAIR, MAGENTA],
    [MAGENTA, MAGENTA, MAGENTA, MAGENTA]
  ]);
  knockOutBackground({ ...img, erode: 0 });

  assert.deepEqual(opaqueBounds(img), { x: 1, y: 1, width: 2, height: 2 });
  assert.equal(opaqueBounds(image([[[255, 0, 255, 0]]])), null);
});

test("does copy only the bounded rows and columns when cropping", () => {
  const img = image([
    [MAGENTA, MAGENTA, MAGENTA],
    [MAGENTA, HAIR, SKIN],
    [MAGENTA, SKIN, HAIR]
  ]);

  const cropped = cropPixels(img, { x: 1, y: 1, width: 2, height: 2 });

  assert.equal(cropped.width, 2);
  assert.equal(cropped.height, 2);
  assert.deepEqual([...cropped.pixels], [...HAIR, ...SKIN, ...SKIN, ...HAIR]);
});

test("does key and crop a synthetic magenta frame down to the head when one is painted", () => {
  // A 12×10 frame of JPEG-ish magenta around a 6×5 head: two rings of skin, which the default
  // two-pixel erode eats, around a 2×1 core of hair, which is all that should survive.
  const width = 12;
  const height = 10;
  const rows: Pixel[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const inHead = x >= 3 && x <= 8 && y >= 2 && y <= 6;
      const inCore = x >= 5 && x <= 6 && y >= 4 && y <= 4;
      if (inCore) return HAIR;
      if (inHead) return SKIN;
      return (x + y) % 2 === 0 ? MAGENTA : pixel(246, 12, 250);
    })
  );
  const frame = image(rows);

  const head = keyAndCropHead(frame);

  assert.ok(head !== null);
  assert.deepEqual({ width: head.width, height: head.height }, { width: 2, height: 1 });
  assert.deepEqual([...head.pixels], [...HAIR, ...HAIR]);
  assert.equal(alphaAt(frame, 0, 0), 0, "the source frame was keyed in place");
});

test("does return null from keyAndCropHead when the frame is nothing but background", () => {
  const blank = image([
    [MAGENTA, MAGENTA],
    [MAGENTA, MAGENTA]
  ]);

  assert.equal(keyAndCropHead(blank), null);
});
