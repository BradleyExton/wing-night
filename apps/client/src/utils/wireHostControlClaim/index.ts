import {
  CLIENT_TO_SERVER_EVENTS,
  SERVER_TO_CLIENT_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";

type HostControlSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "on" | "off" | "emit" | "connected"
>;

export const wireHostControlClaim = (
  socket: HostControlSocket,
  onHostSecretIssued: (hostSecret: string) => void
): (() => void) => {
  // Host clients intentionally re-claim on connect/reconnect.
  // Server-side role checks ensure non-host clients cannot receive a host secret.
  const requestHostControl = (): void => {
    socket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
  };

  const handleHostSecretIssued = (payload: HostSecretPayload): void => {
    onHostSecretIssued(payload.hostSecret);
  };

  socket.on(SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED, handleHostSecretIssued);
  socket.on(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID, requestHostControl);
  socket.on("connect", requestHostControl);

  if (socket.connected) {
    requestHostControl();
  }

  return (): void => {
    socket.off(SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED, handleHostSecretIssued);
    socket.off(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID, requestHostControl);
    socket.off("connect", requestHostControl);
  };
};
