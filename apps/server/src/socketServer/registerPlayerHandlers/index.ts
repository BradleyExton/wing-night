import {
  CLIENT_TO_SERVER_EVENTS,
  PLAYER_CLAIM_GONE_REASONS,
  PLAYER_CLAIM_REFUSAL_REASONS,
  SERVER_TO_CLIENT_EVENTS,
  type Player,
  type PlayerClaimGonePayload,
  type PlayerClaimResult,
  type PlayerHandshake,
  type PlayerReleaseResult
} from "@wingnight/shared";

import type { PlayerClaimStore } from "../../playerClaims/index.js";
import { createTokenBucket } from "../../utils/tokenBucket/index.js";
import {
  isPlayerClaimPayload,
  isPlayerReleasePayload
} from "../registerRoomStateHandlers/payloadGuards/index.js";

// One room per player, which only the socket holding that player's face is
// in. Whatever only one player may see (today: who they are; later: their own
// turn, their ballot) is emitted to this room and to nothing else.
export const resolvePlayerRoom = (playerId: string): string => `player:${playerId}`;

type PlayerEvent =
  | typeof CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM
  | typeof CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE;

type PlayerSocket = {
  id: string;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (
    event: typeof SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE,
    payload: PlayerClaimGonePayload
  ) => void;
  on: {
    (event: PlayerEvent, listener: (payload: unknown, ack: unknown) => void): void;
    (event: "disconnect", listener: () => void): void;
  };
};

export type PlayerSeatContext = {
  claimStore: Pick<PlayerClaimStore, "claim" | "rebind" | "releaseBySecret" | "disconnect">;
  getPlayers: () => readonly Player[];
  // Tells the one player — through their own room — who they are.
  emitPlayerSelf: (playerId: string) => void;
  // Copies the store's claimed/connected ids into the room and broadcasts
  // (coalesced by the caller, so a burst of claims is one snapshot).
  syncClaimFlags: () => void;
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

type Ack<TResult> = (result: TResult) => void;

const isAck = <TResult>(ack: unknown): ack is Ack<TResult> => typeof ack === "function";

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

  const takeSeat = (playerId: string): void => {
    socket.join(resolvePlayerRoom(playerId));
    context.emitPlayerSelf(playerId);
  };

  if (handshake.claimSecret !== null) {
    const playerId = claimStore.rebind(handshake.claimSecret, socket.id, peerAddress);

    if (playerId === null) {
      socket.emit(SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE, {
        playerId: null,
        reason: PLAYER_CLAIM_GONE_REASONS.CLAIM_NOT_FOUND
      });
    } else {
      takeSeat(playerId);
      context.syncClaimFlags();
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

  // The face stays the phone's; the host just sees it go to sleep.
  socket.on("disconnect", () => {
    if (claimStore.disconnect(socket.id) !== null) {
      context.syncClaimFlags();
    }
  });
};
