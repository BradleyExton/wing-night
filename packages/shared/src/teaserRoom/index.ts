import type { CrewPad, CrewStageStatus } from "../crewTurn/index.js";
import { isRecord } from "../guards/index.js";
import type { MinigameHostView } from "../roomState/index.js";

// The wire between a phone and an online room on the teaser (docs/minigames/base-borden-spec.md
// §0.5): a Cloudflare Durable Object per room (apps/teaser-worker/src/teaserRoom) that runs a
// crew game's own runtime and sends every phone in the room what to draw. Both ends import this
// file, so the two can never disagree about a message's shape.

/** A room code: four to six capital letters, so a room link can be read out loud. */
export const TEASER_ROOM_CODE_PATTERN = /^[A-Z]{4,6}$/;
/** The phone page for a Streets of Barrie room: `/play/<CODE>` (apps/client, TeaserOnlineGame). */
export const TEASER_ROOM_PAGE_PREFIX = "/play/";
/** The most players any room seats: Streets of Barrie's street is furnished for one to five hens. */
export const TEASER_ROOM_SEATS_MAX = 5;
/** Sockets on one room, phones that only watch included. */
export const TEASER_ROOM_SOCKETS_MAX = 8;
/** The longest message a room reads. Every message a phone sends is well under it. */
export const TEASER_ROOM_MESSAGE_CHARS_MAX = 512;

export const isTeaserRoomCode = (value: string): boolean => TEASER_ROOM_CODE_PATTERN.test(value);

/** The games a room can play: the crew games, whose every player steers her own hen. */
export const TEASER_ROOM_GAMES = ["BRAWL", "BORDEN"] as const;
export type TeaserRoomGame = (typeof TEASER_ROOM_GAMES)[number];

export const isTeaserRoomGame = (value: unknown): value is TeaserRoomGame =>
  typeof value === "string" && (TEASER_ROOM_GAMES as readonly string[]).includes(value);

/**
 * Each game's room: the phone page a room link opens (`<page><CODE>`), and how many it seats.
 * Base Borden runs two hens at a time and deals its pairs from at most four players.
 */
export const TEASER_ROOM_GAME_RULES: Record<TeaserRoomGame, { page: string; seatsMax: number }> = {
  BRAWL: { page: TEASER_ROOM_PAGE_PREFIX, seatsMax: TEASER_ROOM_SEATS_MAX },
  BORDEN: { page: "/base-borden/", seatsMax: 4 }
};

/**
 * Where a phone opens a room's socket, on the teaser's own origin. The game rides along, because a
 * code is a room only within its game: the Worker names the room's Durable Object by both, and the
 * room plays the game its first socket asked for.
 */
export const resolveTeaserRoomSocketPath = (code: string, game: TeaserRoomGame): string => `/api/rooms/${code}/socket?game=${game}`;

/**
 * Where a room is: picking birds, mid-game, or on the end card (where any player can start the
 * next game). A phone that comes in mid-game watches until the next one.
 */
export type TeaserRoomPhase = "lobby" | "playing" | "finished";

export type TeaserRoomSeat = {
  playerId: string;
  /** False while that phone is away; its seat is kept for it during a game. */
  connected: boolean;
};

export type TeaserRoomSnapshot = {
  code: string;
  game: TeaserRoomGame;
  phase: TeaserRoomPhase;
  /** In the order they sat down. */
  seats: TeaserRoomSeat[];
  /** The game's view: host view and display view are the same for every arcade game. */
  view: MinigameHostView | null;
  /** Each player's pad (`selectCrew`), by player id, while a stage is in hand. */
  pads: Record<string, CrewPad>;
  crewStatus: CrewStageStatus | null;
};

export type TeaserRoomClientMessage =
  /** First thing a phone says: its tab's id, kept across a reload so a refresh keeps the seat. */
  | { t: "hello"; clientId: string }
  /** Sit as this roster player, or (null) stand up. */
  | { t: "seat"; playerId: string | null }
  /** Start a game: any seated phone, from the lobby or the end card. */
  | { t: "start" }
  /** A thumb: one of the game's own phone actions, which the room stamps with who sent it. */
  | { t: "action"; actionType: string; actionPayload: Record<string, unknown> }
  | { t: "ping"; id: number; sentAt: number };

export type TeaserRoomRefusal = "full" | "malformed" | "rate_limited" | "seat_taken" | "not_seated" | "refused";

export type TeaserRoomServerMessage =
  /** The room as it stands, and which player this phone is (null while it only watches). */
  | { t: "room"; you: string | null; room: TeaserRoomSnapshot }
  | { t: "pong"; id: number; sentAt: number }
  | { t: "refused"; reason: TeaserRoomRefusal };

const CLIENT_ID_PATTERN = /^[a-z0-9-]{1,40}$/;
const PLAYER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const ACTION_TYPE_PATTERN = /^[A-Za-z]{1,32}$/;

const isWholeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;

/** A phone's message, or null for anything that is not one. Never throws. */
export const parseTeaserRoomClientMessage = (raw: string): TeaserRoomClientMessage | null => {
  if (raw.length > TEASER_ROOM_MESSAGE_CHARS_MAX) {
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

  switch (parsed.t) {
    case "hello":
      return typeof parsed.clientId === "string" && CLIENT_ID_PATTERN.test(parsed.clientId)
        ? { t: "hello", clientId: parsed.clientId }
        : null;
    case "seat":
      return parsed.playerId === null || (typeof parsed.playerId === "string" && PLAYER_ID_PATTERN.test(parsed.playerId))
        ? { t: "seat", playerId: parsed.playerId }
        : null;
    case "start":
      return { t: "start" };
    case "action":
      return typeof parsed.actionType === "string" && ACTION_TYPE_PATTERN.test(parsed.actionType) && isRecord(parsed.actionPayload)
        ? { t: "action", actionType: parsed.actionType, actionPayload: parsed.actionPayload }
        : null;
    case "ping":
      return isWholeNumber(parsed.id) && typeof parsed.sentAt === "number" && Number.isFinite(parsed.sentAt)
        ? { t: "ping", id: parsed.id, sentAt: parsed.sentAt }
        : null;
    default:
      return null;
  }
};
