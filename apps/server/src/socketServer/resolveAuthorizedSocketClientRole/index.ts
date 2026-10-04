import { timingSafeEqual } from "node:crypto";

import {
  CLIENT_ROLES,
  isRecord,
  isSocketClientRole,
  type SocketClientRole
} from "@wingnight/shared";


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

// Who a connecting socket is allowed to be. DISPLAY is open to anyone — it is
// read-only — and anything malformed falls back to it. HOST is the laptop's
// own browser (`isLoopbackPeer`, decided by the caller from the handshake;
// token or not, so a laptop tab holding a stale token still gets in) or a device holding the host control
// token, which reaches the tablet only through the laptop's QR code.
// Null means HOST was asked for and refused: the caller turns the socket away
// rather than seating it as a display it never asked to be.
export const resolveAuthorizedSocketClientRole = (
  authPayload: unknown,
  isLoopbackPeer: boolean,
  hostControlToken: string
): SocketClientRole | null => {
  const requestedClientRole = resolveRequestedClientRole(authPayload);

  if (requestedClientRole === CLIENT_ROLES.DISPLAY) {
    return CLIENT_ROLES.DISPLAY;
  }

  if (isLoopbackPeer) {
    return CLIENT_ROLES.HOST;
  }

  return hasValidHostControlToken(authPayload, hostControlToken) ? CLIENT_ROLES.HOST : null;
};
