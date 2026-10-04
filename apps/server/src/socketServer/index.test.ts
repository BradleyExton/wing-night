import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";

import {
  CLIENT_ROLES,
  HOST_AUTH_REQUIRED_ERROR_CODE,
  SERVER_TO_CLIENT_EVENTS,
  type RoleScopedStateSnapshotEnvelope
} from "@wingnight/shared";
import { io } from "socket.io-client";

import { attachSocketServer } from "./index.js";

type ConnectOutcome = { connectError: string } | { seatedAs: string };

// A real server on an ephemeral loopback port and a real Socket.IO client, so
// what is under test is the wiring: that `attachSocketServer` runs the seat
// guard on every handshake, not just that the guard is right in isolation.
const withSocketServer = async (handle: (url: string) => Promise<void>): Promise<void> => {
  const httpServer = createServer();
  const { socketServer } = attachSocketServer(httpServer, { hostControlToken: "room-token" });

  httpServer.listen(0, "127.0.0.1");
  await once(httpServer, "listening");

  try {
    await handle(`http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`);
  } finally {
    await socketServer.close();
  }
};

// WebSocket transport: the polling transport's XHR shim drops a Host header,
// and the Host check is the thing one of these tests is about.
const connect = (
  url: string,
  auth: Record<string, string>,
  extraHeaders: Record<string, string> = {}
): Promise<ConnectOutcome> =>
  new Promise((resolve) => {
    const socket = io(url, {
      auth,
      extraHeaders,
      transports: ["websocket"],
      reconnection: false,
      forceNew: true
    });
    const settle = (outcome: ConnectOutcome): void => {
      socket.close();
      resolve(outcome);
    };

    socket.on("connect_error", (error) => {
      settle({ connectError: error.message });
    });
    socket.on(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, (envelope: RoleScopedStateSnapshotEnvelope) => {
      settle({ seatedAs: envelope.clientRole });
    });
  });

test("does refuse a HOST handshake when a foreign page on the laptop sends it", async () => {
  await withSocketServer(async (url) => {
    assert.deepEqual(
      await connect(url, { clientRole: CLIENT_ROLES.HOST }, { Origin: "https://evil.example" }),
      { connectError: HOST_AUTH_REQUIRED_ERROR_CODE }
    );
  });
});

test("does seat a HOST handshake when it comes from a laptop page", async () => {
  await withSocketServer(async (url) => {
    assert.deepEqual(
      await connect(url, { clientRole: CLIENT_ROLES.HOST }, { Origin: "http://localhost:5173" }),
      { seatedAs: CLIENT_ROLES.HOST }
    );
  });
});

// DNS rebinding over the wire: a same-origin poll from a rebinded page carries
// no Origin, only a Host that names the attacker's site.
test("does refuse a HOST handshake when a loopback client names a foreign Host", async () => {
  await withSocketServer(async (url) => {
    const port = new URL(url).port;

    assert.deepEqual(
      await connect(url, { clientRole: CLIENT_ROLES.HOST }, { Host: `attacker.example:${port}` }),
      { connectError: HOST_AUTH_REQUIRED_ERROR_CODE }
    );
  });
});
