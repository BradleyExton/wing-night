import { HOST_AUTH_REQUIRED_ERROR_CODE } from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type { InboundSocketEvents, OutboundSocketEvents } from "../../socketContracts/index";

type HostSeatSocket = Pick<Socket<InboundSocketEvents, OutboundSocketEvents>, "on" | "off">;

// The server turned this host page away: it is not on the laptop and holds no
// valid host control token (none, or one that was since rotated). A
// refusal from the server's middleware is final — Socket.IO does not
// auto-reconnect it — so this fires once and the page sits still. Any other
// connect error (server down, Wi-Fi blip) is left to Socket.IO's own retries.
export const wireHostSeatLock = (
  socket: HostSeatSocket,
  onLocked: () => void
): (() => void) => {
  const handleConnectError = (error: Error): void => {
    if (error.message === HOST_AUTH_REQUIRED_ERROR_CODE) {
      onLocked();
    }
  };

  socket.on("connect_error", handleConnectError);

  return (): void => {
    socket.off("connect_error", handleConnectError);
  };
};
