import { isRecord } from "../guards/index.js";

// How a guest's phone joins the room. The TV's QR (on the laptop, the one
// screen that is handed the join token) encodes `/play?t=<joinToken>` at the
// laptop's LAN address; the phone keeps the token, connects as PLAYER, and
// taps its own face to claim it. From then on the phone holds a claim secret,
// and a phone that slept and woke presents it to be that player again without
// a re-pick. Nothing here is sent to the room: the join token and every claim
// secret live in the server's claim store and in the one device each was
// handed to, never in a snapshot.
export const PLAY_ROUTE_PATH = "/play";

// Short on purpose: it rides in the QR, and fewer characters is a sparser code
// a phone across the room can read.
export const PLAYER_JOIN_TOKEN_QUERY_KEY = "t";

// Why `player:claim` (or `player:release`) said no.
export const PLAYER_CLAIM_REFUSAL_REASONS = {
  // No player by that id on the roster tonight.
  UNKNOWN_PLAYER: "unknown_player",
  // Another phone holds that face. The host can free it from the tablet.
  ALREADY_CLAIMED: "already_claimed",
  // A release whose secret matches no claim — already released, or never was.
  UNKNOWN_CLAIM: "unknown_claim",
  // Too many claims and releases from one phone too fast: a tap-happy guest,
  // or a script flooding the TV with snapshots. Try again in a second.
  RATE_LIMITED: "rate_limited"
} as const;

export type PlayerClaimRefusalReason =
  (typeof PLAYER_CLAIM_REFUSAL_REASONS)[keyof typeof PLAYER_CLAIM_REFUSAL_REASONS];

// The ack of `player:claim`. The secret goes back to the one socket that asked
// for it and nowhere else; the phone keeps it to come back as this player.
export type PlayerClaimResult =
  | { ok: true; playerId: string; claimSecret: string }
  | { ok: false; reason: PlayerClaimRefusalReason };

export type PlayerReleaseResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | typeof PLAYER_CLAIM_REFUSAL_REASONS.UNKNOWN_CLAIM
        | typeof PLAYER_CLAIM_REFUSAL_REASONS.RATE_LIMITED;
    };

// Why a phone's face was taken off it by something other than the phone.
export const PLAYER_CLAIM_GONE_REASONS = {
  // The host freed the face from the tablet.
  RELEASED_BY_HOST: "released_by_host",
  // The roster was rewritten (a content reload, Quick Play) and this player is
  // gone, or their id now names somebody else.
  ROSTER_CHANGED: "roster_changed",
  // Reset Game: every claim is cleared and the join token rotated, so the
  // phone has to scan the TV again.
  NIGHT_RESET: "night_reset",
  // The same claim secret came back on another socket — the phone's other
  // tab, or the same phone after a reconnect the server saw first.
  SUPERSEDED: "superseded",
  // The phone came back with a secret the server no longer knows: the face
  // was freed while the phone slept.
  CLAIM_NOT_FOUND: "claim_not_found",
  // "This isn't me" was tapped on another screen holding the same secret.
  RELEASED_ELSEWHERE: "released_elsewhere",
  // The same phone (the same Wi-Fi address) claimed a different face: one
  // face per phone, so this one went back to the room.
  ANOTHER_FACE: "another_face"
} as const;

export type PlayerClaimGoneReason =
  (typeof PLAYER_CLAIM_GONE_REASONS)[keyof typeof PLAYER_CLAIM_GONE_REASONS];

const PLAYER_CLAIM_GONE_REASON_VALUES: ReadonlySet<string> = new Set(
  Object.values(PLAYER_CLAIM_GONE_REASONS)
);

export const isPlayerClaimGoneReason = (value: unknown): value is PlayerClaimGoneReason =>
  typeof value === "string" && PLAYER_CLAIM_GONE_REASON_VALUES.has(value);

// What a PLAYER socket offers in its handshake `auth`, read defensively: the
// handshake is the one payload that arrives before any guard has run.
export type PlayerHandshake = {
  joinToken: string | null;
  claimSecret: string | null;
};

const readNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

export const readPlayerHandshake = (auth: unknown): PlayerHandshake => {
  if (!isRecord(auth)) {
    return { joinToken: null, claimSecret: null };
  }

  return {
    joinToken: readNonEmptyString(auth.joinToken),
    claimSecret: readNonEmptyString(auth.claimSecret)
  };
};
