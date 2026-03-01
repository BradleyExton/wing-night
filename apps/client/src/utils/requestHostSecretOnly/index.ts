import type { HostSecretPayload } from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type { InboundSocketEvents } from "../../socketContracts/index";
import type { OutboundSocketEvents } from "../../socketContracts/index";
import { emitHostAuthorizedRequest } from "../emitHostAuthorizedRequest";
import { readHostSecret } from "../hostSecretStorage";

type HostSecretOnlyEventName = {
  [EventName in keyof OutboundSocketEvents]: Parameters<
    OutboundSocketEvents[EventName]
  > extends [HostSecretPayload]
    ? EventName
    : never;
}[keyof OutboundSocketEvents];

export type HostSecretOnlyRequestSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

type RequestHostSecretOnlyOptions = {
  socket: HostSecretOnlyRequestSocket;
  event: HostSecretOnlyEventName;
  onMissingHostSecret?: () => void;
  getHostSecret?: () => string | null;
};

export const requestHostSecretOnly = ({
  socket,
  event,
  onMissingHostSecret,
  getHostSecret = readHostSecret
}: RequestHostSecretOnlyOptions): boolean => {
  return emitHostAuthorizedRequest({
    socket,
    event,
    onMissingHostSecret,
    getHostSecret,
    createPayload: (hostSecret): HostSecretPayload => ({ hostSecret })
  });
};
