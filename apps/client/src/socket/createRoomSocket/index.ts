import { CLIENT_ROLES, type SocketClientRole } from "@wingnight/shared";
import { io, type Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { resolveClientRoute } from "../../utils/resolveClientRoute";

type SocketAuthPayload = {
  clientRole: SocketClientRole;
  hostControlToken?: string;
};

const resolveSocketServerUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_SOCKET_SERVER_URL;

  if (configuredUrl && configuredUrl.trim().length > 0) {
    return configuredUrl.trim();
  }

  return `${window.location.protocol}//${window.location.hostname}:3000`;
};

export const resolveSocketClientRole = (pathname: string): SocketClientRole => {
  const route = resolveClientRoute(pathname);

  if (route === "HOST") {
    return CLIENT_ROLES.HOST;
  }

  return CLIENT_ROLES.DISPLAY;
};

const resolveHostControlToken = (): string | null => {
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
  configuredHostControlToken: string | null = resolveHostControlToken()
): SocketAuthPayload => {
  const clientRole = resolveSocketClientRole(pathname);

  if (clientRole !== CLIENT_ROLES.HOST || configuredHostControlToken === null) {
    return {
      clientRole
    };
  }

  return {
    clientRole,
    hostControlToken: configuredHostControlToken
  };
};

export const createRoomSocket = (
  pathname: string
): Socket<InboundSocketEvents, OutboundSocketEvents> => {
  return io(resolveSocketServerUrl(), {
    auth: resolveSocketAuthPayload(pathname)
  });
};
