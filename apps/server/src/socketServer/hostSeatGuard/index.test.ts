import assert from "node:assert/strict";
import test from "node:test";

import { CLIENT_ROLES, HOST_AUTH_REQUIRED_ERROR_CODE } from "@wingnight/shared";

import { createHostSeatGuard, type SeatedSocketData } from "./index.js";

type GuardOutcome = {
  error: Error | undefined;
  data: Partial<SeatedSocketData>;
};

type Handshake = {
  address: string | undefined;
  host?: string;
  origin?: string;
};

const LAPTOP = { address: "::ffff:127.0.0.1", host: "127.0.0.1:3000", origin: "http://localhost:5173" };
const TABLET = { address: "::ffff:192.168.1.40", host: "192.168.1.23:3000", origin: "http://192.168.1.23:5173" };

const runGuard = (auth: unknown, { address, host, origin }: Handshake): GuardOutcome => {
  const socket = {
    handshake: { auth, address, headers: { host, origin } },
    data: {} as Partial<SeatedSocketData>
  };
  const calls: (Error | undefined)[] = [];

  createHostSeatGuard("room-token")(socket, (error) => {
    calls.push(error);
  });

  assert.equal(calls.length, 1, "next must be called exactly once");

  return { error: calls[0], data: socket.data };
};

test("does refuse the connection when a LAN socket asks for HOST with no token", () => {
  const outcome = runGuard({ clientRole: CLIENT_ROLES.HOST }, TABLET);

  assert.equal(outcome.error?.message, HOST_AUTH_REQUIRED_ERROR_CODE);
  assert.equal(outcome.data.clientRole, undefined);
});

test("does refuse the connection when a LAN socket asks for HOST with a bad token", () => {
  const outcome = runGuard({ clientRole: CLIENT_ROLES.HOST, hostControlToken: "guessed" }, TABLET);

  assert.equal(outcome.error?.message, HOST_AUTH_REQUIRED_ERROR_CODE);
  assert.equal(outcome.data.clientRole, undefined);
});

test("does seat a host on the LAN when the socket brings the token", () => {
  const outcome = runGuard({ clientRole: CLIENT_ROLES.HOST, hostControlToken: "room-token" }, TABLET);

  assert.equal(outcome.error, undefined);
  assert.deepEqual(outcome.data, { clientRole: CLIENT_ROLES.HOST, isLoopbackPeer: false });
});

test("does seat a host with no token when the socket is on the laptop itself", () => {
  for (const [address, host] of [
    ["127.0.0.1", "127.0.0.1:3000"],
    ["::1", "[::1]:3000"],
    ["::ffff:127.0.0.1", "localhost:3000"]
  ] as const) {
    const outcome = runGuard({ clientRole: CLIENT_ROLES.HOST }, { address, host, origin: undefined });

    assert.equal(outcome.error, undefined, address);
    assert.deepEqual(outcome.data, { clientRole: CLIENT_ROLES.HOST, isLoopbackPeer: true }, address);
  }

  assert.equal(runGuard({ clientRole: CLIENT_ROLES.HOST }, LAPTOP).data.clientRole, CLIENT_ROLES.HOST);
});

test("does seat a display when a LAN socket asks for DISPLAY or sends nonsense", () => {
  for (const auth of [{ clientRole: CLIENT_ROLES.DISPLAY }, { clientRole: "HACKER" }, null]) {
    const outcome = runGuard(auth, TABLET);

    assert.equal(outcome.error, undefined);
    assert.deepEqual(outcome.data, { clientRole: CLIENT_ROLES.DISPLAY, isLoopbackPeer: false });
  }
});

test("does mark a display as the laptop's when it connects from the laptop", () => {
  const outcome = runGuard({ clientRole: CLIENT_ROLES.DISPLAY }, LAPTOP);

  assert.deepEqual(outcome.data, { clientRole: CLIENT_ROLES.DISPLAY, isLoopbackPeer: true });
});

test("does refuse the connection when a foreign page on the laptop asks for HOST", () => {
  const outcome = runGuard(
    { clientRole: CLIENT_ROLES.HOST },
    { ...LAPTOP, origin: "https://evil.example" }
  );

  assert.equal(outcome.error?.message, HOST_AUTH_REQUIRED_ERROR_CODE);
});

// DNS rebinding: a polling request from a rebinded page is same-origin, so it
// has no Origin; its Host still names the attacker's site.
test("does refuse the connection when a loopback socket names a foreign Host and no Origin", () => {
  const outcome = runGuard(
    { clientRole: CLIENT_ROLES.HOST },
    { address: "::ffff:127.0.0.1", host: "attacker.example:3000", origin: undefined }
  );

  assert.equal(outcome.error?.message, HOST_AUTH_REQUIRED_ERROR_CODE);
});
