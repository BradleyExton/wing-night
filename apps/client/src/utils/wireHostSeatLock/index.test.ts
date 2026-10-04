import assert from "node:assert/strict";
import test from "node:test";

import { HOST_AUTH_REQUIRED_ERROR_CODE } from "@wingnight/shared";

import { wireHostSeatLock } from "./index";

type ConnectErrorListener = (error: Error) => void;

const createSocket = (): {
  socket: Parameters<typeof wireHostSeatLock>[0];
  emitConnectError: (error: Error) => void;
  listenerCount: () => number;
} => {
  const listeners = new Set<ConnectErrorListener>();

  return {
    socket: {
      on: (_event: string, listener: ConnectErrorListener) => {
        listeners.add(listener);
      },
      off: (_event: string, listener: ConnectErrorListener) => {
        listeners.delete(listener);
      }
    } as unknown as Parameters<typeof wireHostSeatLock>[0],
    emitConnectError: (error) => {
      for (const listener of listeners) {
        listener(error);
      }
    },
    listenerCount: () => listeners.size
  };
};

test("does report the lock when the server refuses the host seat", () => {
  const { socket, emitConnectError } = createSocket();
  let lockCount = 0;

  wireHostSeatLock(socket, () => {
    lockCount += 1;
  });
  emitConnectError(new Error(HOST_AUTH_REQUIRED_ERROR_CODE));

  assert.equal(lockCount, 1);
});

test("does ignore other connect errors when the server is merely unreachable", () => {
  const { socket, emitConnectError } = createSocket();
  let lockCount = 0;

  wireHostSeatLock(socket, () => {
    lockCount += 1;
  });
  emitConnectError(new Error("xhr poll error"));

  assert.equal(lockCount, 0);
});

test("does stop listening when it is unwired", () => {
  const { socket, listenerCount } = createSocket();

  const unwire = wireHostSeatLock(socket, () => {});
  unwire();

  assert.equal(listenerCount(), 0);
});
