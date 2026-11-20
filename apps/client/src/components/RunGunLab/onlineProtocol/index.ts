import type { StickDir, YardWorld } from "../yardSim";

// PROTOTYPE — throwaway (docs/minigames/base-borden-spec.md §0.7 step 1). The wire between a
// phone and the online jump lab's room, a Durable Object on its own Worker
// (apps/teaser-worker/src/labRoom). Both ends import this file, so the two can never disagree
// about a message's shape.

/** At most this many hens in a room; further phones watch. */
export const LAB_ROOM_HENS_MAX = 4;
/** At most this many sockets on one room, watchers included. */
export const LAB_ROOM_SOCKETS_MAX = 6;
/** Longest message the room reads. Every message a phone sends is a few dozen characters. */
export const LAB_MESSAGE_CHARS_MAX = 256;
/** A room code: four to six capital letters, so a room link can be read out loud. */
export const LAB_ROOM_CODE_PATTERN = /^[A-Z]{4,6}$/;

const PAD_ID_PATTERN = /^[a-z0-9-]{1,32}$/;

export type LabClientMessage =
  | { t: "hello"; padId: string }
  /** What the thumbs are doing: sent when it changes, and twice a second regardless. */
  | { t: "pad"; seq: number; dir: StickDir; jumpSeq: number }
  | { t: "ping"; id: number; sentAt: number };

export type LabServerMessage =
  /** `slot` is null for a phone that came in after the room was full: it watches. */
  | { t: "welcome"; padId: string; slot: number | null }
  /** The room's world, and the last pad message it has applied from each phone. */
  | { t: "frame"; world: YardWorld; acks: Record<string, number> }
  | { t: "pong"; id: number; sentAt: number }
  | { t: "refused"; reason: "full" | "malformed" | "rate_limited" };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isWholeNumber = (value: unknown, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max;

/** A phone's message, or null for anything that is not one. Never throws. */
export const parseLabClientMessage = (raw: string): LabClientMessage | null => {
  if (raw.length > LAB_MESSAGE_CHARS_MAX) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  if (parsed.t === "hello" && typeof parsed.padId === "string" && PAD_ID_PATTERN.test(parsed.padId)) {
    return { t: "hello", padId: parsed.padId };
  }

  if (
    parsed.t === "pad" &&
    isWholeNumber(parsed.seq, Number.MAX_SAFE_INTEGER) &&
    isWholeNumber(parsed.dir, 8) &&
    isWholeNumber(parsed.jumpSeq, Number.MAX_SAFE_INTEGER)
  ) {
    return { t: "pad", seq: parsed.seq, dir: parsed.dir as StickDir, jumpSeq: parsed.jumpSeq };
  }

  if (
    parsed.t === "ping" &&
    isWholeNumber(parsed.id, Number.MAX_SAFE_INTEGER) &&
    typeof parsed.sentAt === "number" &&
    Number.isFinite(parsed.sentAt)
  ) {
    return { t: "ping", id: parsed.id, sentAt: parsed.sentAt };
  }

  return null;
};
