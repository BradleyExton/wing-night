import { CLIENT_ROLES, type SocketClientRole } from "@wingnight/shared";
import { io, type Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { resolveClientRoute } from "../../utils/resolveClientRoute";

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

export const createRoomSocket = (
  pathname: string
): Socket<InboundSocketEvents, OutboundSocketEvents> => {
  return io(resolveSocketServerUrl(), {
    auth: {
      clientRole: resolveSocketClientRole(pathname)
    }
  });
};
