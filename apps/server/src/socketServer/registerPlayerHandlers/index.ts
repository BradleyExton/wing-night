import {
  CLIENT_TO_SERVER_EVENTS,
  PLAYER_CLAIM_GONE_REASONS,
  PLAYER_CLAIM_REFUSAL_REASONS,
  PLAYER_MINIGAME_ACTION_REFUSAL_REASONS,
  SERVER_TO_CLIENT_EVENTS,
  type Player,
  type PlayerClaimGonePayload,
  type PlayerClaimResult,
  type PlayerHandshake,
  type PlayerMinigameActionPayload,
  type PlayerMinigameActionResult,
  type PlayerReleaseResult
} from "@wingnight/shared";

import type { PlayerClaimStore } from "../../playerClaims/index.js";
import { createTokenBucket, type TokenBucket } from "../../utils/tokenBucket/index.js";
import {
  isPlayerClaimPayload,
  isPlayerMinigameActionPayload,
  isPlayerReleasePayload
} from "../registerRoomStateHandlers/payloadGuards/index.js";

// One room per player, which only the socket holding that player's face is
// in. Whatever only one player may see (today: who they are; later: their own
// turn, their ballot) is emitted to this room and to nothing else.
export const resolvePlayerRoom = (playerId: string): string => `player:${playerId}`;

export type PlayerEventName =
  | typeof CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM
  | typeof CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE
  | typeof CLIENT_TO_SERVER_EVENTS.PLAYER_MINIGAME_ACTION;

type PlayerSocket = {
  id: string;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (
    event: typeof SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE,
    payload: PlayerClaimGonePayload
  ) => void;
  on: {
    (event: PlayerEventName, listener: (payload: unknown, ack: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.REQUEST_STATE, listener: () => void): void;
    (event: "disconnect", listener: () => void): void;
  };
};

export type PlayerSeatContext = {
  claimStore: Pick<
    PlayerClaimStore,
    "claim" | "rebind" | "releaseBySecret" | "disconnect" | "resolvePlayerIdBySocket"
  >;
  getPlayers: () => readonly Player[];
  // Tells the one player — through their own room — who they are.
  emitPlayerSelf: (playerId: string) => void;
  // Hands the player their arcade leg's host view, through their own room, if — and only if —
  // their phone is the one playing the leg in hand right now. A no-op otherwise.
  emitContestantHostView: (playerId: string) => void;
  // A contestant's input for their own leg: refused with a reason, or let through to the game
  // (`dispatchContestantMinigameAction`) and broadcast.
  dispatchMinigameAction: (
    playerId: string,
    action: PlayerMinigameActionPayload
  ) => PlayerMinigameActionResult;
  // Copies the store's claimed/connected ids into the room and broadcasts
  // (coalesced by the caller, so a burst of claims is one snapshot).
  syncClaimFlags: () => void;
  // The same, at once: for a phone re-binding its face. Its leg's controller is derived from
  // these flags, and the input socket.io buffered while it was away is handled right after this
  // handler returns — a coalesced sync would still say "dropped" and refuse it.
  syncClaimFlagsNow: () => void;
  // The room's game-input buckets, one per face, so a phone that reconnects keeps spending the
  // bucket it had rather than getting a fresh burst on every new socket. Omitted, each socket
  // gets its own (a harness with one socket per test).
  minigameActionBuckets?: Map<string, TokenBucket>;
  // The rate limiter's clock; injected so a test can walk it.
  now?: () => number;
};

// Who is on the other end: what the handshake offered, and the phone's Wi-Fi
// address (null for the laptop itself), which caps a phone at one face.
export type PlayerConnection = {
  handshake: PlayerHandshake;
  peerAddress: string | null;
};

// A guest tapping through the roster stays well inside this; a loop toggling a
// face to flood the TV with snapshots does not. Claims and releases share it.
export const PLAYER_ACTION_BURST = 6;
export const PLAYER_ACTIONS_PER_SECOND = 2;

// A contestant playing their leg on the phone, on a bucket of its own so play never spends the
// claim bucket. Sized from what the runners actually send, one action per touch: FAPPY a flap per
// tap (a frantic tapper is ~10 a second); SCHLONIC a press AND a release per tap (~16 a second
// mashing); BRAWL a walk per change of direction plus a peck per tap, two thumbs at once (~15–20
// a second in a brawl); JOUST an aim every 80 ms while the band is drawn (12.5 a second). Thirty a
// second sustained is half again the busiest human, and a burst of forty absorbs over a second of
// mashing on top. A script flooding the room is held to thirty a second — the rate a tablet runs
// at on a normal night anyway.
export const PLAYER_MINIGAME_ACTION_BURST = 40;
export const PLAYER_MINIGAME_ACTIONS_PER_SECOND = 30;

type Ack<TResult> = (result: TResult) => void;

const isAck = <TResult>(ack: unknown): ack is Ack<TResult> => typeof ack === "function";

// `player:minigameAction` answers only if the phone asked for an answer: a flap does not wait.
const answer = <TResult>(ack: unknown, result: TResult): void => {
  if (isAck<TResult>(ack)) {
    ack(result);
  }
};

// The phone family, on PLAYER sockets only. Every event here answers on an ack
// so a claim secret goes back to the one socket that asked; none of them can
// reach a phase, a turn or a score — the only thing a phone changes tonight is
// which face it holds.
//
// A phone that slept arrives with the secret it was handed (`handshake
// .claimSecret`) and is that player again on this socket before its first
// paint, with no re-pick: the phone cannot hold a wake lock on plain HTTP, so
// coming back has to cost nothing.
export const registerPlayerHandlers = (
  socket: PlayerSocket,
  { handshake, peerAddress }: PlayerConnection,
  context: PlayerSeatContext
): void => {
  const { claimStore } = context;
  const actionBucket = createTokenBucket({
    capacity: PLAYER_ACTION_BURST,
    refillPerSecond: PLAYER_ACTIONS_PER_SECOND,
    now: context.now ?? Date.now
  });

  const createMinigameActionBucket = (): TokenBucket =>
    createTokenBucket({
      capacity: PLAYER_MINIGAME_ACTION_BURST,
      refillPerSecond: PLAYER_MINIGAME_ACTIONS_PER_SECOND,
      now: context.now ?? Date.now
    });
  const minigameActionBuckets = context.minigameActionBuckets ?? new Map<string, TokenBucket>();
  // A socket that holds no face still pays for what it sends, on a bucket of its own.
  const unseatedActionBucket = createMinigameActionBucket();

  const takeMinigameActionToken = (playerId: string | null): boolean => {
    if (playerId === null) {
      return unseatedActionBucket.take();
    }

    let bucket = minigameActionBuckets.get(playerId);

    if (bucket === undefined) {
      bucket = createMinigameActionBucket();
      minigameActionBuckets.set(playerId, bucket);
    }

    return bucket.take();
  };

  const takeSeat = (playerId: string): void => {
    socket.join(resolvePlayerRoom(playerId));
    context.emitPlayerSelf(playerId);
    // A phone that took its seat mid-leg — a reload, a wake — gets the leg straight back.
    context.emitContestantHostView(playerId);
  };

  if (handshake.claimSecret !== null) {
    const playerId = claimStore.rebind(handshake.claimSecret, socket.id, peerAddress);

    if (playerId === null) {
      socket.emit(SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE, {
        playerId: null,
        reason: PLAYER_CLAIM_GONE_REASONS.CLAIM_NOT_FOUND
      });
    } else {
      socket.join(resolvePlayerRoom(playerId));
      // At once, before this socket's buffered events are handled: the flaps a contestant's
      // phone queued while its Wi-Fi blinked are its own leg's, and they have to find the leg
      // the phone's again, not "dropped". The broadcast hands it the leg's host view as well.
      context.syncClaimFlagsNow();
      takeSeat(playerId);
    }
  }

  socket.on(CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM, (payload, ack) => {
    if (!isAck<PlayerClaimResult>(ack)) {
      return;
    }

    if (!actionBucket.take()) {
      ack({ ok: false, reason: PLAYER_CLAIM_REFUSAL_REASONS.RATE_LIMITED });
      return;
    }

    if (!isPlayerClaimPayload(payload)) {
      ack({ ok: false, reason: PLAYER_CLAIM_REFUSAL_REASONS.UNKNOWN_PLAYER });
      return;
    }

    const outcome = claimStore.claim({
      players: context.getPlayers(),
      playerId: payload.playerId,
      socketId: socket.id,
      claimSecret: payload.claimSecret ?? null,
      peerAddress
    });

    if (!outcome.ok) {
      ack(outcome);
      return;
    }

    if (outcome.releasedPlayerId !== null) {
      socket.leave(resolvePlayerRoom(outcome.releasedPlayerId));
    }

    takeSeat(outcome.playerId);
    context.syncClaimFlags();
    ack({ ok: true, playerId: outcome.playerId, claimSecret: outcome.claimSecret });
  });

  socket.on(CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE, (payload, ack) => {
    if (!isAck<PlayerReleaseResult>(ack)) {
      return;
    }

    if (!actionBucket.take()) {
      ack({ ok: false, reason: PLAYER_CLAIM_REFUSAL_REASONS.RATE_LIMITED });
      return;
    }

    // A release from a socket that does not hold the face (another tab with
    // the same storage) still ends the claim; the store tells the holder.
    const playerId = isPlayerReleasePayload(payload)
      ? claimStore.releaseBySecret(payload.claimSecret, socket.id)
      : null;

    if (playerId === null) {
      ack({ ok: false, reason: PLAYER_CLAIM_REFUSAL_REASONS.UNKNOWN_CLAIM });
      return;
    }

    socket.leave(resolvePlayerRoom(playerId));
    context.syncClaimFlags();
    ack({ ok: true });
  });

  // A contestant playing their own leg. The face this socket holds is the only identity that
  // counts — the payload names no player — and the mutation decides whether that face may send
  // this action now. Nothing here can advance a phase or move a turn: the actions a game lets a
  // phone send are its inputs and the end of its own run (AGENTS.md §3.5).
  socket.on(CLIENT_TO_SERVER_EVENTS.PLAYER_MINIGAME_ACTION, (payload, ack) => {
    const playerId = claimStore.resolvePlayerIdBySocket(socket.id);

    if (!takeMinigameActionToken(playerId)) {
      answer<PlayerMinigameActionResult>(ack, {
        ok: false,
        reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.RATE_LIMITED
      });
      return;
    }

    if (!isPlayerMinigameActionPayload(payload)) {
      answer<PlayerMinigameActionResult>(ack, {
        ok: false,
        reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.MALFORMED
      });
      return;
    }

    if (playerId === null) {
      answer<PlayerMinigameActionResult>(ack, {
        ok: false,
        reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_SEATED
      });
      return;
    }

    answer(ack, context.dispatchMinigameAction(playerId, payload));
  });

  // The phone asking for the room again (a reconnect, a tab brought back) asks for its leg too.
  socket.on(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE, () => {
    const playerId = claimStore.resolvePlayerIdBySocket(socket.id);

    if (playerId !== null) {
      context.emitContestantHostView(playerId);
    }
  });

  // The face stays the phone's; the host just sees it go to sleep.
  socket.on("disconnect", () => {
    if (claimStore.disconnect(socket.id) !== null) {
      context.syncClaimFlags();
    }
  });
};
