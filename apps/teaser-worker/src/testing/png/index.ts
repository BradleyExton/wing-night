// Just enough PNG for the tests: decodes an 8-bit RGB or RGBA, non-interlaced PNG to RGBA pixels
// (the shape a canvas hands the browser's keying), so a test can put the fake painter's head
// through @wingnight/avatar-head's keyAndCropHead as the guest's phone will.
import { inflateSync } from "node:zlib";

import type { RgbaImage } from "@wingnight/avatar-head";

const paeth = (left: number, up: number, upLeft: number): number => {
  const estimate = left + up - upLeft;
  const toLeft = Math.abs(estimate - left);
  const toUp = Math.abs(estimate - up);
  const toUpLeft = Math.abs(estimate - upLeft);

  if (toLeft <= toUp && toLeft <= toUpLeft) return left;
  return toUp <= toUpLeft ? up : upLeft;
};

export const decodePng = (png: Uint8Array): RgbaImage => {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const idat: Uint8Array[] = [];
  let width = 0;
  let height = 0;
  let channels = 0;

  for (let offset = 8; offset < png.length; ) {
    const length = view.getUint32(offset);
    const type = new TextDecoder().decode(png.subarray(offset + 4, offset + 8));
    const data = png.subarray(offset + 8, offset + 8 + length);

    if (type === "IHDR") {
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      const [bitDepth, colourType, , , interlace] = data.subarray(8, 13);

      if (bitDepth !== 8 || interlace !== 0 || (colourType !== 2 && colourType !== 6)) {
        throw new Error(`decodePng only reads 8-bit RGB(A), not depth ${bitDepth} type ${colourType}.`);
      }

      channels = colourType === 6 ? 4 : 3;
    } else if (type === "IDAT") {
      idat.push(data);
    }

    offset += 12 + length;
  }

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const rows = new Uint8Array(height * stride);

  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];

    for (let x = 0; x < stride; x += 1) {
      const value = raw[y * (stride + 1) + 1 + x] ?? 0;
      const left = x >= channels ? (rows[y * stride + x - channels] ?? 0) : 0;
      const up = y > 0 ? (rows[(y - 1) * stride + x] ?? 0) : 0;
      const upLeft = y > 0 && x >= channels ? (rows[(y - 1) * stride + x - channels] ?? 0) : 0;
      const predictor = [0, left, up, (left + up) >> 1, paeth(left, up, upLeft)][filter ?? 0] ?? 0;

      rows[y * stride + x] = (value + predictor) & 0xff;
    }
  }

  const pixels = new Uint8ClampedArray(width * height * 4);

  for (let index = 0; index < width * height; index += 1) {
    pixels.set(rows.subarray(index * channels, index * channels + 3), index * 4);
    pixels[index * 4 + 3] = channels === 4 ? (rows[index * channels + 3] ?? 255) : 255;
  }

  return { pixels, width, height };
};
