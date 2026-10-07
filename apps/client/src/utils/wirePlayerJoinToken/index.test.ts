import assert from "node:assert/strict";
import test from "node:test";

import { CLIENT_TO_SERVER_EVENTS, SERVER_TO_CLIENT_EVENTS } from "@wingnight/shared";

import { wirePlayerJoinToken } from "./index";

type Handler = (payload: unknown) => void;

const createSocket = (connected: boolean) => {
  const handlers = new Map<string, Handler>();
  const emitted: string[] = [];

  return {
    socket: {
      connected,
      on: (event: string, handler: Handler) => {
        handlers.set(event, handler);
      },
      off: (event: string) => {
        handlers.delete(event);
      },
      emit: (event: string) => {
        emitted.push(event);
      }
    } as unknown as Parameters<typeof wirePlayerJoinToken>[0],
    emitted,
    fire: (payload: unknown) => handlers.get(SERVER_TO_CLIENT_EVENTS.PLAYER_JOIN_TOKEN)?.(payload),
    isWired: () => handlers.has(SERVER_TO_CLIENT_EVENTS.PLAYER_JOIN_TOKEN)
  };
};

test("does pass on each join token the server hands the TV and nothing malformed", () => {
  const fake = createSocket(false);
  const tokens: string[] = [];
  const unwire = wirePlayerJoinToken(fake.socket, (joinToken) => {
    tokens.push(joinToken);
  });

  fake.fire({ joinToken: "tok-1" });
  fake.fire({ joinToken: "" });
  fake.fire(null);
  fake.fire({ joinToken: "tok-2" });

  assert.deepEqual(tokens, ["tok-1", "tok-2"]);

  unwire();
  assert.equal(fake.isWired(), false);
});

// The connect-time emit can land before an effect attaches the listener.
test("does ask for the token when it attaches to a socket that is already connected", () => {
  const connected = createSocket(true);
  const connecting = createSocket(false);

  wirePlayerJoinToken(connected.socket, () => undefined);
  wirePlayerJoinToken(connecting.socket, () => undefined);

  assert.deepEqual(connected.emitted, [CLIENT_TO_SERVER_EVENTS.REQUEST_PLAYER_JOIN_TOKEN]);
  assert.deepEqual(connecting.emitted, []);
});
