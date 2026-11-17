import { randomBytes, timingSafeEqual } from "node:crypto";

import {
  PLAYER_CLAIM_GONE_REASONS,
  PLAYER_CLAIM_REFUSAL_REASONS,
  type Player,
  type PlayerClaimGoneReason,
  type PlayerClaimRefusalReason
} from "@wingnight/shared";

// Which phone is which player — and the two secrets that make it so, kept here
// and nowhere else. The join token is what the TV's QR hands a phone so it may
// connect as PLAYER at all; a claim secret is what a phone is handed when it
// takes a face, so a phone that slept and woke can be that player again
// without a re-pick (and without the join token, which the host may have
// rotated since). Neither ever enters `RoomState`: the room only learns the
// ids that are claimed and connected (`resolveFlags`), so no snapshot, to any
// role, can carry the means to sit in someone else's seat.
//
// Every path that ends a claim the holder did not end itself announces it
// (`onClaimReleased`), so the socket layer can tell the holder and take it out
// of its `player:<id>` room: that room only ever holds the current holder.
//
// Server-only and in memory, like the host secret beside it (`hostAuth`): a
// restarted server mints a new join token and forgets every claim, and the
// phones rescan the TV.

type PlayerIdentity = Pick<Player, "id" | "name" | "avatarSrc">;

type PlayerClaim = {
  playerId: string;
  // Who the face was when it was claimed. Player ids are positional
  // (`player-3`), so after the roster is rewritten an id can name somebody
  // else entirely; a claim whose name or head no longer matches is not theirs.
  playerName: string;
  playerAvatarSrc: string | null;
  claimSecret: string;
  // The socket the phone holds the face on, or null while the phone sleeps.
  socketId: string | null;
  // The Wi-Fi address the phone claimed from; null for the laptop itself,
  // which may hold several faces while the host tests.
  peerAddress: string | null;
};

// A face taken off a phone by something other than that phone, for the socket
// layer to tell the phone (`player:claimGone`) and pull it out of its player
// room. `socketId` is null when the phone was asleep: there is nobody to tell.
export type ReleasedPlayerClaim = {
  playerId: string;
  socketId: string | null;
  reason: PlayerClaimGoneReason;
};

export type PlayerClaimOutcome =
  | {
      ok: true;
      playerId: string;
      claimSecret: string;
      // The face this socket let go of to take this one, if any. Released in
      // silence — the phone asked for it — so the caller just leaves its room.
      releasedPlayerId: string | null;
    }
  | { ok: false; reason: PlayerClaimRefusalReason };

export type PlayerClaimFlags = {
  claimedPlayerIds: string[];
  connectedPlayerIds: string[];
};

type ClaimRequest = {
  players: readonly PlayerIdentity[];
  playerId: string;
  socketId: string;
  // The phone's current secret, if it holds one.
  claimSecret: string | null;
  peerAddress: string | null;
};

// 128 bits, base64url: 22 characters in the QR, and a sparser code is one a
// phone across the room reads first time.
const mintJoinToken = (): string => randomBytes(16).toString("base64url");

const mintClaimSecret = (): string => randomBytes(24).toString("base64url");

const secretsMatch = (offered: string, expected: string): boolean => {
  const offeredBytes = Buffer.from(offered);
  const expectedBytes = Buffer.from(expected);

  return offeredBytes.length === expectedBytes.length && timingSafeEqual(offeredBytes, expectedBytes);
};

const isSamePerson = (claim: PlayerClaim, player: PlayerIdentity | undefined): boolean =>
  player !== undefined &&
  player.name === claim.playerName &&
  (player.avatarSrc ?? null) === claim.playerAvatarSrc;

type Listener<T> = (value: T) => void;

const subscribe = <T>(listeners: Set<Listener<T>>, listener: Listener<T>): (() => void) => {
  listeners.add(listener);

  return (): void => {
    listeners.delete(listener);
  };
};

export const createPlayerClaimStore = (mintToken: () => string = mintJoinToken) => {
  let joinToken = mintToken();
  const claimsByPlayerId = new Map<string, PlayerClaim>();
  const releaseListeners = new Set<Listener<ReleasedPlayerClaim>>();
  const joinTokenListeners = new Set<Listener<string>>();

  const findClaimBySecret = (claimSecret: string): PlayerClaim | undefined =>
    [...claimsByPlayerId.values()].find((claim) => secretsMatch(claimSecret, claim.claimSecret));

  const findClaimBySocket = (socketId: string): PlayerClaim | undefined =>
    [...claimsByPlayerId.values()].find((claim) => claim.socketId === socketId);

  const announceRelease = (
    claim: PlayerClaim,
    socketId: string | null,
    reason: PlayerClaimGoneReason
  ): void => {
    for (const listener of releaseListeners) {
      listener({ playerId: claim.playerId, socketId, reason });
    }
  };

  const release = (claim: PlayerClaim, reason: PlayerClaimGoneReason): void => {
    claimsByPlayerId.delete(claim.playerId);
    announceRelease(claim, claim.socketId, reason);
  };

  // Moves a claim onto `socketId`. A different live socket holding it hears it
  // was superseded, so two tabs never both think they are the same player.
  const bind = (claim: PlayerClaim, socketId: string, peerAddress: string | null): void => {
    const previousSocketId = claim.socketId;

    claim.socketId = socketId;
    claim.peerAddress = peerAddress;

    if (previousSocketId !== null && previousSocketId !== socketId) {
      announceRelease(claim, previousSocketId, PLAYER_CLAIM_GONE_REASONS.SUPERSEDED);
    }
  };

  // One face per socket, and one per phone on the Wi-Fi: taking a face lets go
  // of any other this socket holds (in silence — it asked) and of any other
  // claimed from the same address (announced — that is another tab, or a
  // guest tapping through the roster, and the face goes back to the room).
  const releaseConflicts = (
    keepPlayerId: string,
    socketId: string,
    peerAddress: string | null
  ): string | null => {
    let silentlyReleasedPlayerId: string | null = null;

    for (const claim of [...claimsByPlayerId.values()]) {
      if (claim.playerId === keepPlayerId) {
        continue;
      }

      if (claim.socketId === socketId) {
        claimsByPlayerId.delete(claim.playerId);
        silentlyReleasedPlayerId = claim.playerId;
      } else if (peerAddress !== null && claim.peerAddress === peerAddress) {
        release(claim, PLAYER_CLAIM_GONE_REASONS.ANOTHER_FACE);
      }
    }

    return silentlyReleasedPlayerId;
  };

  return {
    getJoinToken: (): string => joinToken,

    isJoinToken: (candidate: string | null): boolean =>
      candidate !== null && secretsMatch(candidate, joinToken),

    // A seated phone may reconnect on its claim secret alone, so a phone that
    // scanned before the host printed a new code is not locked out of its own
    // face. New joins still need the current join token.
    isClaimSecret: (candidate: string | null): boolean =>
      candidate !== null && findClaimBySecret(candidate) !== undefined,

    // Whether a socket holds a face right now.
    isSocketSeated: (socketId: string): boolean => findClaimBySocket(socketId) !== undefined,

    // Which face a socket holds, if any: a phone's game input is authorized by
    // this and nothing it says about itself.
    resolvePlayerIdBySocket: (socketId: string): string | null =>
      findClaimBySocket(socketId)?.playerId ?? null,

    // Which socket holds a face, for the invariant that the player room holds
    // only that socket.
    resolveHolderSocketId: (playerId: string): string | null =>
      claimsByPlayerId.get(playerId)?.socketId ?? null,

    // Reset Game and the host's "new join code": every phone that has not
    // claimed a face yet has to scan the new code.
    rotateJoinToken: (): string => {
      joinToken = mintToken();

      for (const listener of joinTokenListeners) {
        listener(joinToken);
      }

      return joinToken;
    },

    onJoinTokenRotated: (listener: Listener<string>): (() => void) =>
      subscribe(joinTokenListeners, listener),

    onClaimReleased: (listener: Listener<ReleasedPlayerClaim>): (() => void) =>
      subscribe(releaseListeners, listener),

    // Claiming a face nobody holds takes it; claiming the face this socket
    // already holds, or one whose secret the phone brought, is idempotent and
    // keeps the secret; anyone else's face is refused.
    claim: ({ players, playerId, socketId, claimSecret, peerAddress }: ClaimRequest): PlayerClaimOutcome => {
      const player = players.find((candidate) => candidate.id === playerId);

      if (player === undefined) {
        return { ok: false, reason: PLAYER_CLAIM_REFUSAL_REASONS.UNKNOWN_PLAYER };
      }

      const existingClaim = claimsByPlayerId.get(playerId);

      if (existingClaim !== undefined) {
        const isOwnClaim =
          existingClaim.socketId === socketId ||
          (claimSecret !== null && secretsMatch(claimSecret, existingClaim.claimSecret));

        if (!isOwnClaim) {
          return { ok: false, reason: PLAYER_CLAIM_REFUSAL_REASONS.ALREADY_CLAIMED };
        }

        const releasedPlayerId = releaseConflicts(playerId, socketId, peerAddress);

        bind(existingClaim, socketId, peerAddress);

        return { ok: true, playerId, claimSecret: existingClaim.claimSecret, releasedPlayerId };
      }

      const releasedPlayerId = releaseConflicts(playerId, socketId, peerAddress);
      const claim: PlayerClaim = {
        playerId,
        playerName: player.name,
        playerAvatarSrc: player.avatarSrc ?? null,
        claimSecret: mintClaimSecret(),
        socketId,
        peerAddress
      };

      claimsByPlayerId.set(playerId, claim);

      return { ok: true, playerId, claimSecret: claim.claimSecret, releasedPlayerId };
    },

    // A phone reconnecting with the secret it was handed: the face is its
    // again, on this socket. Null when the secret is unknown — the face was
    // freed while the phone slept.
    rebind: (claimSecret: string, socketId: string, peerAddress: string | null): string | null => {
      const claim = findClaimBySecret(claimSecret);

      if (claim === undefined) {
        return null;
      }

      releaseConflicts(claim.playerId, socketId, peerAddress);
      bind(claim, socketId, peerAddress);

      return claim.playerId;
    },

    // "This isn't me", from a phone holding the secret. Silent when the socket
    // asking is the one holding the face; announced to the holder when it is
    // not (another tab with the same storage), so the holder never goes on
    // believing it is a player it no longer is.
    releaseBySecret: (claimSecret: string, socketId: string): string | null => {
      const claim = findClaimBySecret(claimSecret);

      if (claim === undefined) {
        return null;
      }

      claimsByPlayerId.delete(claim.playerId);

      if (claim.socketId !== null && claim.socketId !== socketId) {
        announceRelease(claim, claim.socketId, PLAYER_CLAIM_GONE_REASONS.RELEASED_ELSEWHERE);
      }

      return claim.playerId;
    },

    // The host, or anything else that is not the phone, freeing a face.
    release: (playerId: string, reason: PlayerClaimGoneReason): boolean => {
      const claim = claimsByPlayerId.get(playerId);

      if (claim === undefined) {
        return false;
      }

      release(claim, reason);

      return true;
    },

    // The phone's socket dropped (it slept, it lost the Wi-Fi). The face stays
    // its own; it is just not connected. Returns the face, if the socket held one.
    disconnect: (socketId: string): string | null => {
      const claim = findClaimBySocket(socketId);

      if (claim === undefined) {
        return null;
      }

      claim.socketId = null;

      return claim.playerId;
    },

    // After a roster rewrite: a claim survives only if its id is still on the
    // roster AND still names the same person — same name, same head.
    prune: (players: readonly PlayerIdentity[]): boolean => {
      const playerById = new Map(players.map((player) => [player.id, player]));
      let didRelease = false;

      for (const claim of [...claimsByPlayerId.values()]) {
        if (!isSamePerson(claim, playerById.get(claim.playerId))) {
          release(claim, PLAYER_CLAIM_GONE_REASONS.ROSTER_CHANGED);
          didRelease = true;
        }
      }

      return didRelease;
    },

    clear: (reason: PlayerClaimGoneReason): boolean => {
      const claims = [...claimsByPlayerId.values()];

      for (const claim of claims) {
        release(claim, reason);
      }

      return claims.length > 0;
    },

    // What the room is allowed to know, in roster order.
    resolveFlags: (players: readonly Pick<Player, "id">[]): PlayerClaimFlags => {
      const claimedPlayers = players.filter((player) => claimsByPlayerId.has(player.id));

      return {
        claimedPlayerIds: claimedPlayers.map((player) => player.id),
        connectedPlayerIds: claimedPlayers
          .filter((player) => claimsByPlayerId.get(player.id)?.socketId !== null)
          .map((player) => player.id)
      };
    }
  };
};

export type PlayerClaimStore = ReturnType<typeof createPlayerClaimStore>;

// This module-scoped store is intentionally single-process, like `hostAuth`
// and the room itself.
export const playerClaimStore = createPlayerClaimStore();
