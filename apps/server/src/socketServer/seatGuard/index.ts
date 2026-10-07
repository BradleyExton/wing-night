import type { SocketClientRole } from "@wingnight/shared";

import { isLoopbackPeer } from "../../utils/loopbackPeer/index.js";
import {
  resolveAuthorizedSocketClientRole,
  type SeatCredentials
} from "../resolveAuthorizedSocketClientRole/index.js";

// What the guard leaves on the socket for the connection handler, decided once
// from the handshake before any listener exists: the role it was seated as,
// and whether it is the laptop itself (`isLoopbackPeer`) — which the display's
// one report and the player join token both need, since the TV is driven by
// the laptop.
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

// Socket.IO middleware. A socket that asked for HOST or PLAYER and may not
// have it is refused with that seat's error code as its connect error —
// `host_auth_required` or `player_auth_required` — never quietly seated as a
// display, which would leave a tablet or a phone showing a board it cannot use
// and no reason why. A refusal from middleware is final on the client:
// Socket.IO does not auto-reconnect it, so a locked-out device sits still
// instead of hammering the server.
export const createSeatGuard =
  (credentials: SeatCredentials) =>
  (socket: GuardedSocket, next: (error?: Error) => void): void => {
    const { auth, address, headers } = socket.handshake;
    const isOnLaptop = isLoopbackPeer({
      address,
      host: readHeader(headers.host),
      origin: readHeader(headers.origin)
    });
    const decision = resolveAuthorizedSocketClientRole(auth, isOnLaptop, credentials);

    if (!decision.seated) {
      next(new Error(decision.errorCode));
      return;
    }

    socket.data.clientRole = decision.clientRole;
    socket.data.isLoopbackPeer = isOnLaptop;
    next();
  };
