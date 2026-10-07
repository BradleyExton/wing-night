// The photo a guest picks, made fit to send: drawn onto a canvas no longer than the portal's long
// edge and re-encoded as JPEG. The canvas is what rights a phone photo's EXIF rotation (an <img>
// draws it upright) and turns an iPhone's HEIC into something Gemini reads, and the Worker only
// ever stores the data URL as it came (see readAvatarPhotoUpload).
import { AVATAR_PHOTO_LONG_EDGE_PX, AVATAR_PHOTO_UPLOAD_MAX_LENGTH } from "@wingnight/shared/guestPortal";

// Tried in order until the photo fits the upload cap; a 1024 px face is far under it at the first.
const JPEG_QUALITIES = [0.86, 0.75, 0.6, 0.45];

export const resolveDownscaledSize = (
  width: number,
  height: number,
  longEdge = AVATAR_PHOTO_LONG_EDGE_PX
): { width: number; height: number } => {
  const scale = Math.min(1, longEdge / Math.max(width, height));

  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
};

// The first encoding that fits, or null when none does.
export const pickFittingEncoding = (
  encode: (quality: number) => string,
  maxLength = AVATAR_PHOTO_UPLOAD_MAX_LENGTH
): string | null => {
  for (const quality of JPEG_QUALITIES) {
    const dataUrl = encode(quality);

    if (dataUrl.length <= maxLength) {
      return dataUrl;
    }
  }

  return null;
};

const loadImage = async (file: Blob): Promise<HTMLImageElement> => {
  const url = URL.createObjectURL(file);
  const image = new Image();

  try {
    image.src = url;
    await image.decode();

    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
};

// The photo as the data URL the upload sends, or null when the browser cannot read it.
export const preparePhotoDataUrl = async (file: Blob): Promise<string | null> => {
  let image: HTMLImageElement;

  try {
    image = await loadImage(file);
  } catch {
    return null;
  }

  const size = resolveDownscaledSize(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");

  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext("2d");

  if (context === null || image.naturalWidth === 0) {
    return null;
  }

  context.drawImage(image, 0, 0, size.width, size.height);

  return pickFittingEncoding((quality) => canvas.toDataURL("image/jpeg", quality));
};
