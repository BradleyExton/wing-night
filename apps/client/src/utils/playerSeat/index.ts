import {
  CLIENT_TO_SERVER_EVENTS,
  PLAYER_AUTH_REQUIRED_ERROR_CODE,
  PLAYER_CLAIM_GONE_REASONS,
  SERVER_TO_CLIENT_EVENTS,
  type PlayerClaimGonePayload,
  type PlayerClaimGoneReason,
  type PlayerClaimRefusalReason,
  type PlayerClaimResult,
  type PlayerReleaseResult,
  type PlayerSelfPayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type { InboundSocketEvents, OutboundSocketEvents } from "../../socketContracts/index";
import {
  clearPlayerSeat,
  forgetPlayerClaim,
  readPlayerSeat,
  savePlayerClaim,
  type PlayerSeat
} from "../playerSeatStorage";

// Where a guest's phone stands, from the phone's side. The room (who is on
// which team, whose faces are taken) comes from the snapshot like any client;
// this is only the phone's own seat, which no snapshot carries.
export type PlayerSeatState =
  // No usable join token — never scanned, or the night was reset since.
  | { status: "locked" }
  | {
      status: "picking";
      // The face a claim is in flight for, so the picker can show it pressed.
      claimingPlayerId: string | null;
      refusal: PlayerClaimRefusalReason | null;
      // The face the server last told this phone it holds, if it still does:
      // the picker keeps it tappable (a re-claim hands back the secret).
      ownPlayerId: string | null;
    }
  | {
      status: "seated";
      playerId: string;
      // True once the server said so this session (`player:self`), not just
      // the phone's storage — what a reload is proved by.
      confirmed: boolean;
    }
  | { status: "claim_gone"; playerId: string | null; reason: PlayerClaimGoneReason };

export type PlayerSeatController = {
  getState: () => PlayerSeatState;
  subscribe: (listener: () => void) => () => void;
  claim: (playerId: string) => void;
  release: () => void;
  backToPicker: () => void;
  dispose: () => void;
};

export type PlayerSeatSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "on" | "off" | "timeout"
>;

type PlayerSeatStorage = {
  read: () => PlayerSeat | null;
  saveClaim: (playerId: string, claimSecret: string) => void;
  forgetClaim: () => void;
  clear: () => void;
};

const browserStorage: PlayerSeatStorage = {
  read: () => readPlayerSeat(),
  saveClaim: (playerId, claimSecret) => {
    savePlayerClaim(playerId, claimSecret);
  },
  forgetClaim: () => {
    forgetPlayerClaim();
  },
  clear: () => {
    clearPlayerSeat();
  }
};

// Long enough for a phone on a busy Wi-Fi; short enough that a tap into a
// dropped socket comes back to the picker instead of hanging pressed.
const ACK_TIMEOUT_MS = 8_000;

const picking = (
  ownPlayerId: string | null,
  refusal: PlayerClaimRefusalReason | null = null
): PlayerSeatState => ({
  status: "picking",
  claimingPlayerId: null,
  refusal,
  ownPlayerId
});

// A phone with a stored claim paints as that player straight away: the
// reconnect re-binds it before anyone could tap anything, and if the server has
// forgotten the face it says so (`claim_not_found`) and the phone steps back.
export const resolveInitialPlayerSeatState = (seat: PlayerSeat | null): PlayerSeatState => {
  if (seat === null) {
    return { status: "locked" };
  }

  return seat.playerId === null
    ? picking(null)
    : { status: "seated", playerId: seat.playerId, confirmed: false };
};

export const createPlayerSeatController = (
  socket: PlayerSeatSocket,
  storage: PlayerSeatStorage = browserStorage
): PlayerSeatController => {
  let state = resolveInitialPlayerSeatState(storage.read());
  // The face the server last confirmed this socket holds (`player:self`).
  let selfPlayerId: string | null = null;
  const listeners = new Set<() => void>();

  const setState = (next: PlayerSeatState): void => {
    state = next;

    for (const listener of listeners) {
      listener();
    }
  };

  const lock = (): void => {
    selfPlayerId = null;
    storage.clear();
    setState({ status: "locked" });
  };

  const handleSelf = ({ playerId }: PlayerSelfPayload): void => {
    selfPlayerId = playerId;
    setState({ status: "seated", playerId, confirmed: true });
  };

  // An answer only lands on the picker it was asked from: a late ack, or a
  // timeout, never demotes a phone the server has since seated.
  const isAwaiting = (playerId: string): boolean =>
    state.status === "picking" && state.claimingPlayerId === playerId;

  const handleClaimGone = ({ playerId, reason }: PlayerClaimGonePayload): void => {
    if (reason === PLAYER_CLAIM_GONE_REASONS.NIGHT_RESET) {
      lock();
      return;
    }

    // Another tab took the face with the same secret: the storage is shared
    // with it, so it is left alone and this phone can take the face back.
    if (reason !== PLAYER_CLAIM_GONE_REASONS.SUPERSEDED) {
      selfPlayerId = null;
      storage.forgetClaim();
    }

    setState({ status: "claim_gone", playerId, reason });
  };

  const handleConnectError = (error: Error): void => {
    if (error.message === PLAYER_AUTH_REQUIRED_ERROR_CODE) {
      lock();
    }
  };

  // The server only ever drops a phone itself when the join token rotated.
  const handleDisconnect = (reason: string): void => {
    if (reason === "io server disconnect") {
      lock();
    }
  };

  socket.on(SERVER_TO_CLIENT_EVENTS.PLAYER_SELF, handleSelf);
  socket.on(SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE, handleClaimGone);
  socket.on("connect_error", handleConnectError);
  socket.on("disconnect", handleDisconnect);

  const claim = (playerId: string): void => {
    const claimSecret = storage.read()?.claimSecret ?? null;

    setState({ status: "picking", claimingPlayerId: playerId, refusal: null, ownPlayerId: selfPlayerId });
    socket
      .timeout(ACK_TIMEOUT_MS)
      .emitWithAck(
        CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM,
        claimSecret === null ? { playerId } : { playerId, claimSecret }
      )
      .then((result: PlayerClaimResult) => {
        if (result.ok) {
          // The secret is kept whatever the screen shows: `player:self` may
          // already have seated the phone before the ack arrived.
          storage.saveClaim(result.playerId, result.claimSecret);

          if (isAwaiting(playerId)) {
            setState({
              status: "seated",
              playerId: result.playerId,
              confirmed: selfPlayerId === result.playerId
            });
          }

          return;
        }

        if (isAwaiting(playerId)) {
          setState(picking(selfPlayerId, result.reason));
        }
      })
      .catch(() => {
        if (isAwaiting(playerId)) {
          setState(picking(selfPlayerId));
        }
      });
  };

  const release = (): void => {
    const claimSecret = storage.read()?.claimSecret ?? null;

    selfPlayerId = null;
    storage.forgetClaim();
    setState(picking(null));

    if (claimSecret === null) {
      return;
    }

    // Fire and forget: whatever the server answers, this phone has let go.
    socket
      .timeout(ACK_TIMEOUT_MS)
      .emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE, { claimSecret })
      .then((_result: PlayerReleaseResult) => undefined)
      .catch(() => undefined);
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);

      return (): void => {
        listeners.delete(listener);
      };
    },
    claim,
    release,
    backToPicker: () => {
      setState(picking(selfPlayerId));
    },
    dispose: () => {
      socket.off(SERVER_TO_CLIENT_EVENTS.PLAYER_SELF, handleSelf);
      socket.off(SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE, handleClaimGone);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      listeners.clear();
    }
  };
};
