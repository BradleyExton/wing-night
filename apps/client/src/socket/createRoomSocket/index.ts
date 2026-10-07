import { CLIENT_ROLES, type SocketClientRole } from "@wingnight/shared";
import { io, type Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { consumeHostControlToken } from "../../utils/hostControlToken";
import {
  consumePlayerSeat,
  readPlayerSeat,
  type PlayerSeat
} from "../../utils/playerSeatStorage";
import { resolveClientRoute } from "../../utils/resolveClientRoute";
import { resolveServerOrigin } from "../../utils/resolveServerOrigin";

type SocketAuthPayload = {
  clientRole: SocketClientRole;
  hostControlToken?: string;
};

type PlayerSocketAuthPayload = {
  clientRole: typeof CLIENT_ROLES.PLAYER;
  joinToken?: string;
  claimSecret?: string;
};

// This — not the route table — is what decides which listeners the server
// gives the socket (registerRoomStateHandlers registers host and config events
// for HOST sockets only). An ADMIN route left out of this list would connect as
// DISPLAY, never be issued a host secret, and then get NO REPLY AT ALL to a
// `config:*` call rather than an error: a display socket has no listener for
// it, so the wizard would sit forever on a request the server dropped.
export const resolveSocketClientRole = (pathname: string): SocketClientRole => {
  const route = resolveClientRoute(pathname);

  if (route === "HOST" || route === "ADMIN" || route === "QUICKPLAY") {
    return CLIENT_ROLES.HOST;
  }

  if (route === "PLAY") {
    return CLIENT_ROLES.PLAYER;
  }

  return CLIENT_ROLES.DISPLAY;
};

const resolveConfiguredHostControlToken = (): string | null => {
  const configuredToken = import.meta.env.VITE_HOST_CONTROL_TOKEN;

  if (typeof configuredToken !== "string") {
    return null;
  }

  const trimmedToken = configuredToken.trim();

  if (trimmedToken.length === 0) {
    return null;
  }

  return trimmedToken;
};

export const resolveSocketAuthPayload = (
  pathname: string,
  hostControlToken: string | null
): SocketAuthPayload => {
  const clientRole = resolveSocketClientRole(pathname);

  if (clientRole !== CLIENT_ROLES.HOST || hostControlToken === null) {
    return {
      clientRole
    };
  }

  return {
    clientRole,
    hostControlToken
  };
};

// A phone's handshake: the join token it scanned, and its claim secret once it
// holds a face, so a reconnect is that player again with no re-pick. No token
// at all still connects — and is refused with `player_auth_required`, which is
// what tells the phone to scan the TV.
export const resolvePlayerSocketAuthPayload = (
  seat: PlayerSeat | null
): PlayerSocketAuthPayload => ({
  clientRole: CLIENT_ROLES.PLAYER,
  ...(seat === null ? {} : { joinToken: seat.joinToken }),
  ...(seat === null || seat.claimSecret === null ? {} : { claimSecret: seat.claimSecret })
});

// A host page reads its token (URL > stored > build) before it connects; a
// display never looks, so a display URL carrying one leaves it untouched. The
// laptop's own tabs need no token at all — the server seats loopback as HOST —
// so a missing or stale one only matters on the tablet.
export const createRoomSocket = (
  pathname: string
): Socket<InboundSocketEvents, OutboundSocketEvents> => {
  if (resolveSocketClientRole(pathname) === CLIENT_ROLES.PLAYER) {
    // Taken off the URL once, here; every connect after reads storage afresh
    // (auth as a function), so the reconnect after a claim brings its secret.
    consumePlayerSeat();

    return io(resolveServerOrigin(), {
      auth: (sendAuth) => {
        sendAuth(resolvePlayerSocketAuthPayload(readPlayerSeat()));
      }
    });
  }

  const hostControlToken =
    resolveSocketClientRole(pathname) === CLIENT_ROLES.HOST
      ? consumeHostControlToken(resolveConfiguredHostControlToken())
      : null;

  return io(resolveServerOrigin(), {
    auth: resolveSocketAuthPayload(pathname, hostControlToken)
  });
};
