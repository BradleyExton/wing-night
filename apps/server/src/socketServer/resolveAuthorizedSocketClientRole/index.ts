import { timingSafeEqual } from "node:crypto";

import {
  CLIENT_ROLES,
  HOST_AUTH_REQUIRED_ERROR_CODE,
  PLAYER_AUTH_REQUIRED_ERROR_CODE,
  isRecord,
  isSocketClientRole,
  readPlayerHandshake,
  type SocketClientRole
} from "@wingnight/shared";

// The keys a seat can be asked for with: the host control token (boot,
// fixed), the player join token (the claim store's, rotated on reset and by
// the host — so it is asked about rather than handed over as a string), and a
// claim secret, which seats a phone that already holds a face.
export type SeatCredentials = {
  hostControlToken: string;
  isPlayerJoinToken: (joinToken: string | null) => boolean;
  isPlayerClaimSecret: (claimSecret: string | null) => boolean;
};

export type SeatDecision =
  | { seated: true; clientRole: SocketClientRole }
  | {
      seated: false;
      errorCode: typeof HOST_AUTH_REQUIRED_ERROR_CODE | typeof PLAYER_AUTH_REQUIRED_ERROR_CODE;
    };

const resolveRequestedClientRole = (authPayload: unknown): SocketClientRole => {
  if (!isRecord(authPayload)) {
    return CLIENT_ROLES.DISPLAY;
  }

  if (!isSocketClientRole(authPayload.clientRole)) {
    return CLIENT_ROLES.DISPLAY;
  }

  return authPayload.clientRole;
};

const hasValidHostControlToken = (authPayload: unknown, hostControlToken: string): boolean => {
  if (!isRecord(authPayload) || typeof authPayload.hostControlToken !== "string") {
    return false;
  }

  const offered = Buffer.from(authPayload.hostControlToken);
  const expected = Buffer.from(hostControlToken);

  return offered.length === expected.length && timingSafeEqual(offered, expected);
};

const seat = (clientRole: SocketClientRole): SeatDecision => ({ seated: true, clientRole });

// Who a connecting socket is allowed to be. DISPLAY is open to anyone — it is
// read-only — and anything malformed falls back to it. HOST is the laptop's
// own browser (`isLoopbackPeer`, decided by the caller from the handshake;
// token or not, so a laptop tab holding a stale token still gets in) or a
// device holding the host control token, which reaches the tablet only
// through the laptop's QR code. PLAYER is a phone holding the current join
// token, which reaches it only through the TV's QR — from the laptop too,
// because a phone the host tests on the laptop is still a phone — or a phone
// coming back with the claim secret of a face it holds, so a new join code
// does not lock out the phones already seated.
//
// A socket that asked for HOST or PLAYER and may not have it is refused, each
// with its own code: the caller turns it away rather than seating it as a
// display it never asked to be.
export const resolveAuthorizedSocketClientRole = (
  authPayload: unknown,
  isLoopbackPeer: boolean,
  credentials: SeatCredentials
): SeatDecision => {
  const requestedClientRole = resolveRequestedClientRole(authPayload);

  if (requestedClientRole === CLIENT_ROLES.DISPLAY) {
    return seat(CLIENT_ROLES.DISPLAY);
  }

  if (requestedClientRole === CLIENT_ROLES.PLAYER) {
    const { joinToken, claimSecret } = readPlayerHandshake(authPayload);

    return credentials.isPlayerJoinToken(joinToken) || credentials.isPlayerClaimSecret(claimSecret)
      ? seat(CLIENT_ROLES.PLAYER)
      : { seated: false, errorCode: PLAYER_AUTH_REQUIRED_ERROR_CODE };
  }

  if (isLoopbackPeer || hasValidHostControlToken(authPayload, credentials.hostControlToken)) {
    return seat(CLIENT_ROLES.HOST);
  }

  return { seated: false, errorCode: HOST_AUTH_REQUIRED_ERROR_CODE };
};
