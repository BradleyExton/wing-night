import type { HostSecretPayload } from "@wingnight/shared";
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
    socket.emit("host:claimControl");
  };

  const handleHostSecretIssued = (payload: HostSecretPayload): void => {
    onHostSecretIssued(payload.hostSecret);
  };

  socket.on("host:secretIssued", handleHostSecretIssued);
  socket.on("connect", requestHostControl);

  if (socket.connected) {
    requestHostControl();
  }

  return (): void => {
    socket.off("host:secretIssued", handleHostSecretIssued);
    socket.off("connect", requestHostControl);
  };
};
