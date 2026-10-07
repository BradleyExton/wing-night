// The browser's half of painting a head. The Worker streams Gemini's reply back untouched (it has
// 10 ms of CPU and a head is megabytes), so the guest's phone does the picture work the import
// tool does on Brad's laptop: pull the image out of the reply, key the magenta out to alpha, crop
// to the head, and encode the PNG the portal keeps. The keying is @wingnight/avatar-head's, the
// one copy every head on the night went through; only decoding and encoding are the browser's.
import { extractGeneratedImage, keyAndCropHead, type InlineImage, type RgbaImage } from "@wingnight/avatar-head";
import { AVATAR_HEAD_MAX_BYTES, AVATAR_HEAD_MAX_SIDE_PX, AVATAR_HEAD_TYPE } from "@wingnight/shared/guestPortal";

// Why a reply did not become a head. `refused`: Gemini answered in words (its own are in
// `detail`); `blank`: it painted, but keying left nothing — a magenta square, say.
export class HeadFinishError extends Error {
  readonly reason: "refused" | "blank" | "undecodable";

  constructor(reason: "refused" | "blank" | "undecodable", detail: string) {
    super(detail);
    this.reason = reason;
  }
}

// The keyed, cropped head, or null when keying left nothing. Pure: pixels in, pixels out.
export const finishHeadPixels = (image: RgbaImage): RgbaImage | null => keyAndCropHead(image);

// The size a head is encoded at: as cropped, or shrunk to fit the portal's cap on its long side.
export const resolveHeadFit = (
  width: number,
  height: number,
  maxSide = AVATAR_HEAD_MAX_SIDE_PX
): { width: number; height: number } => {
  const scale = Math.min(1, maxSide / Math.max(width, height));

  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
};

const makeCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  return canvas;
};

const context2d = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (context === null) {
    throw new HeadFinishError("undecodable", "This browser cannot draw on a canvas.");
  }

  return context;
};

const decodeInlineImage = async ({ mimeType, base64 }: InlineImage): Promise<RgbaImage> => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
  const canvas = makeCanvas(bitmap.width, bitmap.height);
  const context = context2d(canvas);

  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

  return { pixels: data, width: canvas.width, height: canvas.height };
};

// Each step down is this much of the last: a PNG's size goes roughly with its area, so a few steps
// bring even a noisy head under the cap.
const SHRINK_STEP = 0.8;
const SMALLEST_SIDE_PX = 64;

// Encodes at the head's fitted size, then smaller and smaller until the PNG is within the portal's
// byte cap — the Worker refuses a bigger one outright. The encoder is handed in, so this is tested
// without a canvas. Null when even the smallest size will not fit.
export const encodeWithinBytes = async <Encoded extends { size: number }>(
  width: number,
  height: number,
  encode: (width: number, height: number) => Promise<Encoded>,
  maxBytes = AVATAR_HEAD_MAX_BYTES
): Promise<Encoded | null> => {
  let size = resolveHeadFit(width, height);

  for (;;) {
    const encoded = await encode(size.width, size.height);

    if (encoded.size <= maxBytes) {
      return encoded;
    }

    if (Math.max(size.width, size.height) <= SMALLEST_SIDE_PX) {
      return null;
    }

    size = resolveHeadFit(size.width, size.height, Math.max(SMALLEST_SIDE_PX, Math.floor(Math.max(size.width, size.height) * SHRINK_STEP)));
  }
};

const canvasToPng = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob === null) {
        reject(new HeadFinishError("undecodable", "This browser could not encode the head."));
      } else {
        resolve(blob);
      }
    }, AVATAR_HEAD_TYPE);
  });

const encodePng = async (head: RgbaImage): Promise<Blob> => {
  const source = makeCanvas(head.width, head.height);

  context2d(source).putImageData(new ImageData(new Uint8ClampedArray(head.pixels), head.width, head.height), 0, 0);

  const png = await encodeWithinBytes(head.width, head.height, async (width, height) => {
    if (width === head.width && height === head.height) {
      return canvasToPng(source);
    }

    const scaled = makeCanvas(width, height);

    context2d(scaled).drawImage(source, 0, 0, width, height);

    return canvasToPng(scaled);
  });

  if (png === null) {
    throw new HeadFinishError("undecodable", "The head would not fit the portal's size cap.");
  }

  return png;
};

// Gemini's parsed reply to the finished head's PNG.
export const finishGeneratedHead = async (reply: unknown): Promise<Blob> => {
  let inline: InlineImage;

  try {
    inline = extractGeneratedImage(reply);
  } catch (error) {
    throw new HeadFinishError("refused", error instanceof Error ? error.message : String(error));
  }

  let pixels: RgbaImage;

  try {
    pixels = await decodeInlineImage(inline);
  } catch (error) {
    throw error instanceof HeadFinishError ? error : new HeadFinishError("undecodable", String(error));
  }

  const head = finishHeadPixels(pixels);

  if (head === null) {
    throw new HeadFinishError("blank", "Keying the background out left nothing behind.");
  }

  return encodePng(head);
};
