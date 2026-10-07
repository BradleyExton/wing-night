import assert from "node:assert/strict";
import test from "node:test";

import { encodeWithinBytes, finishGeneratedHead, finishHeadPixels, HeadFinishError, resolveHeadFit } from "./index";

// A magenta field with a skin-coloured square in it: what the painter returns, without a canvas.
const paintSquareOnMagenta = (size: number, square: { x: number; y: number; side: number }): Uint8ClampedArray => {
  const pixels = new Uint8ClampedArray(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const inSquare = x >= square.x && x < square.x + square.side && y >= square.y && y < square.y + square.side;

      pixels.set(inSquare ? [226, 180, 140, 255] : [255, 0, 255, 255], offset);
    }
  }

  return pixels;
};

test("does key the magenta out and crop to the head when the painter drew one", () => {
  const pixels = paintSquareOnMagenta(32, { x: 8, y: 10, side: 12 });
  const head = finishHeadPixels({ pixels, width: 32, height: 32 });

  assert.ok(head !== null);
  // The two-pixel erode eats the square's rim on every side.
  assert.equal(head.width, 8);
  assert.equal(head.height, 8);
  assert.deepEqual([...head.pixels.subarray(0, 4)], [226, 180, 140, 255]);
});

test("does return no head when keying leaves nothing", () => {
  const pixels = paintSquareOnMagenta(16, { x: 0, y: 0, side: 0 });

  assert.equal(finishHeadPixels({ pixels, width: 16, height: 16 }), null);
});

test("does shrink a head to the portal's cap when its long side is over it", () => {
  assert.deepEqual(resolveHeadFit(4096, 1024, 2048), { width: 2048, height: 512 });
  assert.deepEqual(resolveHeadFit(300, 400, 2048), { width: 300, height: 400 });
});

test("does report Gemini's own words when the reply carries no picture", async () => {
  const reply = { candidates: [{ content: { parts: [{ text: "I can't draw that." }] }, finishReason: "STOP" }] };

  await assert.rejects(finishGeneratedHead(reply), (error: unknown) => {
    assert.ok(error instanceof HeadFinishError);
    assert.equal(error.reason, "refused");
    assert.match(error.message, /I can't draw that\./);
    return true;
  });
});

test("does step the head down in size until its PNG fits the byte cap when the first encoding is too big", async () => {
  const tried: string[] = [];
  // A stand-in encoder whose output grows with the area, as a PNG's roughly does.
  const encoded = await encodeWithinBytes(1000, 500, async (width, height) => {
    tried.push(`${width}x${height}`);
    return { size: width * height, width };
  }, 300_000);

  assert.deepEqual(tried, ["1000x500", "800x400", "640x320"]);
  assert.equal(encoded?.width, 640);
});

test("does encode once, at the fitted size, when the head already fits", async () => {
  const tried: number[] = [];
  const encoded = await encodeWithinBytes(3000, 3000, async (width) => {
    tried.push(width);
    return { size: 10 };
  }, 100);

  assert.deepEqual(tried, [2048]);
  assert.deepEqual(encoded, { size: 10 });
});

test("does give up when even the smallest head is over the cap", async () => {
  assert.equal(await encodeWithinBytes(500, 500, async () => ({ size: 1_000 }), 10), null);
});
