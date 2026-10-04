import { CLIENT_ROLES, type SocketClientRole } from "@wingnight/shared";
import { io, type Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { consumeHostControlToken } from "../../utils/hostControlToken";
import { resolveClientRoute } from "../../utils/resolveClientRoute";
import { resolveServerOrigin } from "../../utils/resolveServerOrigin";

type SocketAuthPayload = {
  clientRole: SocketClientRole;
  hostControlToken?: string;
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

// A host page reads its token (URL > stored > build) before it connects; a
// display never looks, so a display URL carrying one leaves it untouched. The
// laptop's own tabs need no token at all — the server seats loopback as HOST —
// so a missing or stale one only matters on the tablet.
export const createRoomSocket = (
  pathname: string
): Socket<InboundSocketEvents, OutboundSocketEvents> => {
  const hostControlToken =
    resolveSocketClientRole(pathname) === CLIENT_ROLES.HOST
      ? consumeHostControlToken(resolveConfiguredHostControlToken())
      : null;

  return io(resolveServerOrigin(), {
    auth: resolveSocketAuthPayload(pathname, hostControlToken)
  });
};
