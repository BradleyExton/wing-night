import { io, type Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";

const resolveSocketServerUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_SOCKET_SERVER_URL;

  if (configuredUrl && configuredUrl.length > 0) {
    return configuredUrl;
  }

  return `${window.location.protocol}//${window.location.hostname}:3000`;
};

export const roomSocket: Socket<InboundSocketEvents, OutboundSocketEvents> = io(
  resolveSocketServerUrl()
);
