import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { readHostSecret } from "../hostSecretStorage";
import { resolveHostSecretRequest } from "../resolveHostSecretRequest";

export type HostAuthorizedRequestSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

type PayloadEventName = {
  [EventName in keyof OutboundSocketEvents]: Parameters<
    OutboundSocketEvents[EventName]
  > extends [unknown]
    ? EventName
    : never;
}[keyof OutboundSocketEvents];

type EventPayload<EventName extends PayloadEventName> = Parameters<
  OutboundSocketEvents[EventName]
>[0];

type EmitHostAuthorizedRequestOptions<EventName extends PayloadEventName> = {
  socket: HostAuthorizedRequestSocket;
  event: EventName;
  createPayload: (hostSecret: string) => EventPayload<EventName>;
  canEmit?: () => boolean;
  onMissingHostSecret?: () => void;
  getHostSecret?: () => string | null;
};

export const emitHostAuthorizedRequest = <EventName extends PayloadEventName>({
  socket,
  event,
  createPayload,
  canEmit,
  onMissingHostSecret,
  getHostSecret = readHostSecret
}: EmitHostAuthorizedRequestOptions<EventName>): boolean => {
  const hostSecret = resolveHostSecretRequest({
    getHostSecret,
    onMissingHostSecret,
    canEmit
  });

  if (hostSecret === null) {
    return false;
  }

  const emitEvent = socket.emit as (
    event: EventName,
    payload: EventPayload<EventName>
  ) => void;

  // Preserve socket method context for socket.io-client internals.
  emitEvent.call(socket, event, createPayload(hostSecret));
  return true;
};
