// A guest's avatar head, made on their own phone before the party. The browser does every step
// that costs CPU — it downscales the photo, keys the magenta out of what Gemini painted and
// encodes the finished PNG — because the Worker in between runs on a 10 ms CPU budget. The Worker
// only stores, counts and streams. See the routes in ../index.ts for the order of the calls.
import { isRecord } from "../../guards/index.js";

// Tries a guest gets at painting a head. A try counts the moment it is recorded, before Gemini is
// called, so a Worker that dies mid-call still spent it.
export const AVATAR_TRIES_MAX = 5;
// A call Gemini plainly failed (an error status, the network) gives the try back — an overloaded
// model should not eat a guest's tries — but only this many times, so a photo Gemini always
// refuses cannot be retried for ever.
export const AVATAR_FAILED_TRIES_MAX = 10;

// The photo the browser uploads, AFTER it has re-encoded it on a canvas (which also rights the
// EXIF orientation and turns an iPhone's HEIC into JPEG): long edge at most this, as JPEG.
export const AVATAR_PHOTO_LONG_EDGE_PX = 1024;
export const AVATAR_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AvatarPhotoType = (typeof AVATAR_PHOTO_TYPES)[number];
// Decoded bytes. The upload is base64, a third bigger (AVATAR_PHOTO_UPLOAD_MAX_LENGTH).
export const AVATAR_PHOTO_MAX_BYTES = 1_500_000;
const DATA_URL_PREFIX_MAX_LENGTH = "data:image/jpeg;base64,".length;
export const AVATAR_PHOTO_UPLOAD_MAX_LENGTH =
  DATA_URL_PREFIX_MAX_LENGTH + Math.ceil(AVATAR_PHOTO_MAX_BYTES / 3) * 4;

// The finished head the browser hands back: a keyed, cropped PNG.
export const AVATAR_HEAD_TYPE = "image/png";
export const AVATAR_HEAD_MAX_BYTES = 2_000_000;
export const AVATAR_HEAD_MAX_SIDE_PX = 2048;

// Response headers on POST /api/me/avatar/generate.
export const AVATAR_TRIES_LEFT_HEADER = "X-Avatar-Tries-Left";
export const AVATAR_ATTEMPT_ID_HEADER = "X-Avatar-Attempt-Id";
// The query parameter POST /api/me/avatar/accept names its try by.
export const AVATAR_ATTEMPT_ID_PARAM = "attemptId";

// Where a guest stands with their head. On GET /api/me (as `avatar`), and the answer to the photo
// upload and the accept.
export type PortalAvatarStatus = {
  triesMax: number;
  triesLeft: number;
  // A photo is uploaded and not yet spent: accepting a head deletes it.
  hasPhoto: boolean;
  // The accepted head's SHA-256 (hex), null until there is one. It changes whenever the head
  // does, so `?v=<headHash>` on GET /api/me/avatar busts any cache.
  headHash: string | null;
};

// POST /api/admin/style-reference: which accepted head every new head is painted to match.
export type AdminStyleReferenceRequest = {
  guestId: string;
};

export const isAdminStyleReferenceRequest = (value: unknown): value is AdminStyleReferenceRequest => {
  return isRecord(value) && typeof value.guestId === "string" && value.guestId.length > 0;
};

export type AdminStyleReference = {
  guestId: string;
  headHash: string;
  pickedAt: number;
};

// The photo upload's body is a data URL — exactly what `canvas.toDataURL("image/jpeg", q)`
// returns — sent as text. The base64 is stored as it came and later spliced, still as text, into
// the Gemini request, so the Worker never encodes or decodes a byte of it.
export type AvatarPhotoUpload = {
  mimeType: AvatarPhotoType;
  base64: string;
};

const DATA_URL_PREFIX_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64$/;

// What each type's first bytes look like in base64: JPEG's FF D8 FF, PNG's signature, RIFF.
const BASE64_MAGIC: Record<AvatarPhotoType, string> = {
  "image/jpeg": "/9j/",
  "image/png": "iVBORw0KGgo",
  "image/webp": "UklGR"
};

// The upload read back, or null when it is not one. Deliberately cheap — no pass over every
// character with a regex — because the Worker runs it on a 2 MB string on a CPU budget: it checks
// the prefix, the length, the picture's magic bytes, and that nothing in the text could close the
// JSON string it is spliced into (a quote or a backslash). Whether the rest is good base64 is
// Gemini's to find out; a guest who sends garbage only spends their own try.
export const readAvatarPhotoUpload = (text: string): AvatarPhotoUpload | null => {
  const comma = text.indexOf(",");

  if (comma === -1 || comma > DATA_URL_PREFIX_MAX_LENGTH || text.length > AVATAR_PHOTO_UPLOAD_MAX_LENGTH) {
    return null;
  }

  const mimeType = DATA_URL_PREFIX_PATTERN.exec(text.slice(0, comma))?.[1] as AvatarPhotoType | undefined;
  const base64 = text.slice(comma + 1);

  if (
    mimeType === undefined ||
    base64.length === 0 ||
    base64.length % 4 !== 0 ||
    !base64.startsWith(BASE64_MAGIC[mimeType]) ||
    base64.includes('"') ||
    base64.includes("\\")
  ) {
    return null;
  }

  return { mimeType, base64 };
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
// Length 0, "IEND", and its fixed CRC: the twelve bytes every PNG ends on.
const PNG_IEND = [0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82];
const IHDR = [0x49, 0x48, 0x44, 0x52];

const matchesAt = (bytes: Uint8Array, offset: number, expected: readonly number[]): boolean => {
  return expected.every((byte, index) => bytes[offset + index] === byte);
};

const readUint32 = (bytes: Uint8Array, offset: number): number => {
  return (
    ((bytes[offset] ?? 0) * 2 ** 24) +
    ((bytes[offset + 1] ?? 0) << 16) +
    ((bytes[offset + 2] ?? 0) << 8) +
    (bytes[offset + 3] ?? 0)
  );
};

// A finished head's size, when its bytes are a whole PNG within the caps: the signature, an IHDR
// first, IEND last. Constant time — it reads the ends and never the pixels.
export const readAvatarHeadPng = (bytes: Uint8Array): { width: number; height: number } | null => {
  if (
    bytes.length > AVATAR_HEAD_MAX_BYTES ||
    bytes.length < PNG_SIGNATURE.length + 25 + PNG_IEND.length ||
    !matchesAt(bytes, 0, PNG_SIGNATURE) ||
    !matchesAt(bytes, 12, IHDR) ||
    !matchesAt(bytes, bytes.length - PNG_IEND.length, PNG_IEND)
  ) {
    return null;
  }

  const width = readUint32(bytes, 16);
  const height = readUint32(bytes, 20);

  return width > 0 && height > 0 && width <= AVATAR_HEAD_MAX_SIDE_PX && height <= AVATAR_HEAD_MAX_SIDE_PX
    ? { width, height }
    : null;
};
