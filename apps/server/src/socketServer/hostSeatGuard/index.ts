import { HOST_AUTH_REQUIRED_ERROR_CODE, type SocketClientRole } from "@wingnight/shared";

import { isLoopbackPeer } from "../../utils/loopbackPeer/index.js";
import { resolveAuthorizedSocketClientRole } from "../resolveAuthorizedSocketClientRole/index.js";

// What the guard leaves on the socket for the connection handler, decided once
// from the handshake before any listener exists: the role it was seated as,
// and whether it is the laptop itself (`isLoopbackPeer`) — which the display's
// one report also needs, since the TV is driven by the laptop.
export type SeatedSocketData = {
  clientRole: SocketClientRole;
  isLoopbackPeer: boolean;
};

type HandshakeHeader = string | string[] | undefined;

type GuardedSocket = {
  handshake: {
    auth: unknown;
    address: string | undefined;
    headers: { host?: HandshakeHeader; origin?: HandshakeHeader };
  };
  data: Partial<SeatedSocketData>;
};

const readHeader = (header: HandshakeHeader): string | undefined =>
  Array.isArray(header) ? header[0] : header;

// Socket.IO middleware. A socket that asked for HOST and may not have it is
// refused with `HOST_AUTH_REQUIRED_ERROR_CODE` as its connect error — never
// quietly seated as a display, which would leave a tablet showing a board it
// cannot drive and no reason why. A refusal from middleware is final on the
// client: Socket.IO does not auto-reconnect it, so a locked-out phone sits
// still instead of hammering the server.
export const createHostSeatGuard =
  (hostControlToken: string) =>
  (socket: GuardedSocket, next: (error?: Error) => void): void => {
    const { auth, address, headers } = socket.handshake;
    const isOnLaptop = isLoopbackPeer({
      address,
      host: readHeader(headers.host),
      origin: readHeader(headers.origin)
    });
    const clientRole = resolveAuthorizedSocketClientRole(auth, isOnLaptop, hostControlToken);

    if (clientRole === null) {
      next(new Error(HOST_AUTH_REQUIRED_ERROR_CODE));
      return;
    }

    socket.data.clientRole = clientRole;
    socket.data.isLoopbackPeer = isOnLaptop;
    next();
  };
