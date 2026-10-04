// The head is generated on this background and the background is then keyed out to alpha, so the
// bird can wear the head's own silhouette. Magenta, because nothing in a face, beard or hair comes
// near it — the palette's #1C1C1C surface cannot be keyed, it is also the colour of every outline.
export const CHROMA_KEY = { r: 255, g: 0, b: 255 } as const;
export const CHROMA_KEY_HEX = "#FF00FF";

export type KeyColour = { r: number; g: number; b: number };

// RGBA, row-major, four bytes a pixel: what a canvas's ImageData carries.
export type RgbaImage = {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
};

export type PixelBounds = { x: number; y: number; width: number; height: number };

export type KnockOutOptions = RgbaImage & {
  key?: KeyColour;
  tolerance?: number;
  strict?: number;
  erode?: number;
};

// Chebyshev distance from the key colour, on one RGBA pixel.
const keyDistance = (pixels: Uint8ClampedArray, offset: number, key: KeyColour): number =>
  Math.max(
    Math.abs(pixels[offset] - key.r),
    Math.abs(pixels[offset + 1] - key.g),
    Math.abs(pixels[offset + 2] - key.b)
  );

// Knocks the generated background out to alpha 0. Two rules, because the JPEG the model returns
// smears the key colour into the edge pixels: a pixel within `strict` of the key is background
// wherever it is (the prompt forbids magenta on the head, and a gap between two hair strands is
// background the border cannot reach); a pixel within the looser `tolerance` is background only
// when a flood fill from the image border reaches it, so a near-key tint ENCLOSED by the head
// survives. Then the remaining edge is eroded by `erode` pixels to drop the fringe. Mutates
// `pixels` and returns the number of pixels cleared.
export const knockOutBackground = ({
  pixels,
  width,
  height,
  key = CHROMA_KEY,
  tolerance = 80,
  strict = 28,
  erode = 2
}: KnockOutOptions): number => {
  const cleared = new Uint8Array(width * height);
  const stack: number[] = [];
  for (let x = 0; x < width; x += 1) stack.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y += 1) stack.push(y * width, y * width + width - 1);
  for (let index = 0; index < width * height; index += 1) {
    if (keyDistance(pixels, index * 4, key) <= strict) stack.push(index);
  }

  let count = 0;
  for (let index = stack.pop(); index !== undefined; index = stack.pop()) {
    if (cleared[index] === 1 || keyDistance(pixels, index * 4, key) > tolerance) continue;
    cleared[index] = 1;
    count += 1;
    const x = index % width;
    const y = (index - x) / width;
    if (x > 0) stack.push(index - 1);
    if (x < width - 1) stack.push(index + 1);
    if (y > 0) stack.push(index - width);
    if (y < height - 1) stack.push(index + width);
  }

  for (let pass = 0; pass < erode; pass += 1) {
    const edge: number[] = [];
    for (let index = 0; index < width * height; index += 1) {
      if (cleared[index] === 1) continue;
      const x = index % width;
      const y = (index - x) / width;
      if (
        (x > 0 && cleared[index - 1] === 1) ||
        (x < width - 1 && cleared[index + 1] === 1) ||
        (y > 0 && cleared[index - width] === 1) ||
        (y < height - 1 && cleared[index + width] === 1)
      ) {
        edge.push(index);
      }
    }
    for (const index of edge) {
      cleared[index] = 1;
      count += 1;
    }
  }

  for (let index = 0; index < width * height; index += 1) {
    if (cleared[index] === 1) pixels[index * 4 + 3] = 0;
  }
  return count;
};

// Bounding box of the pixels that are still opaque, or null when none are.
export const opaqueBounds = ({ pixels, width, height }: RgbaImage): PixelBounds | null => {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] > 127) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
};

// A new image holding only `bounds` of `image`. The import tool crops on a canvas as it encodes;
// this is the same step for a caller that has pixels and no canvas yet.
export const cropPixels = (image: RgbaImage, bounds: PixelBounds): RgbaImage => {
  const pixels = new Uint8ClampedArray(bounds.width * bounds.height * 4);
  for (let row = 0; row < bounds.height; row += 1) {
    const start = ((bounds.y + row) * image.width + bounds.x) * 4;
    pixels.set(image.pixels.subarray(start, start + bounds.width * 4), row * bounds.width * 4);
  }
  return { pixels, width: bounds.width, height: bounds.height };
};

// The whole finish a generated head gets: key the background out, then crop to what is left so
// the bird wears the head's own silhouette. Null when keying left nothing — a refusal painted as a
// blank magenta square, say. Mutates `image.pixels` (the knockout) and returns a new, cropped one.
export const keyAndCropHead = (image: RgbaImage): RgbaImage | null => {
  knockOutBackground(image);
  const bounds = opaqueBounds(image);
  return bounds === null ? null : cropPixels(image, bounds);
};
