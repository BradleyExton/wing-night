import assert from "node:assert/strict";
import test from "node:test";

import type { HostSecretPayload } from "@wingnight/shared";

import { wireHostControlClaim } from "./index";

type HostControlSocket = Parameters<typeof wireHostControlClaim>[0];

class MockHostControlSocket {
  public connected = false;
  public hostClaimRequests = 0;

  private connectHandler: (() => void) | null = null;
  private hostSecretIssuedHandler: ((payload: HostSecretPayload) => void) | null =
    null;

  public on(
    event: "connect" | "host:secretIssued",
    listener: (() => void) | ((payload: HostSecretPayload) => void)
  ): void {
    if (event === "connect") {
      this.connectHandler = listener as () => void;
      return;
    }

    this.hostSecretIssuedHandler = listener as (payload: HostSecretPayload) => void;
  }

  public off(
    event: "connect" | "host:secretIssued",
    listener: (() => void) | ((payload: HostSecretPayload) => void)
  ): void {
    if (event === "connect") {
      if (this.connectHandler === listener) {
        this.connectHandler = null;
      }
      return;
    }

    if (this.hostSecretIssuedHandler === listener) {
      this.hostSecretIssuedHandler = null;
    }
  }

  public emit(event: "host:claimControl"): void {
    if (event === "host:claimControl") {
      this.hostClaimRequests += 1;
    }
  }

  public triggerConnect(): void {
    this.connectHandler?.();
  }

  public triggerHostSecretIssued(payload: HostSecretPayload): void {
    this.hostSecretIssuedHandler?.(payload);
  }
}

test("claims host control immediately when socket is already connected", () => {
  const socket = new MockHostControlSocket();
  socket.connected = true;

  wireHostControlClaim(socket as unknown as HostControlSocket, () => {
    // No-op callback for this test.
  });

  assert.equal(socket.hostClaimRequests, 1);
});

test("claims host control when the socket connects later", () => {
  const socket = new MockHostControlSocket();

  wireHostControlClaim(socket as unknown as HostControlSocket, () => {
    // No-op callback for this test.
  });

  assert.equal(socket.hostClaimRequests, 0);

  socket.triggerConnect();

  assert.equal(socket.hostClaimRequests, 1);
});

test("forwards issued host secret to callback", () => {
  const socket = new MockHostControlSocket();
  const receivedHostSecrets: string[] = [];

  wireHostControlClaim(socket as unknown as HostControlSocket, (hostSecret) => {
    receivedHostSecrets.push(hostSecret);
  });

  socket.triggerHostSecretIssued({ hostSecret: "issued-host-secret" });

  assert.deepEqual(receivedHostSecrets, ["issued-host-secret"]);
});

test("cleanup unregisters host control listeners", () => {
  const socket = new MockHostControlSocket();
  const receivedHostSecrets: string[] = [];

  const cleanup = wireHostControlClaim(
    socket as unknown as HostControlSocket,
    (hostSecret) => {
      receivedHostSecrets.push(hostSecret);
    }
  );

  cleanup();
  socket.triggerConnect();
  socket.triggerHostSecretIssued({ hostSecret: "issued-after-cleanup" });

  assert.equal(socket.hostClaimRequests, 0);
  assert.deepEqual(receivedHostSecrets, []);
});
