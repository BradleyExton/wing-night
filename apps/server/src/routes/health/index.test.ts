import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import test from "node:test";
import type { AddressInfo } from "node:net";

import { createApp } from "../../createApp/index.js";

const closeServer = async (server: Server): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

test("GET /health returns 200 and status payload", async () => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  try {
    await once(server, "listening");

    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  } finally {
    await closeServer(server);
  }
});

test("POST /health is not available", async () => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  try {
    await once(server, "listening");

    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      method: "POST"
    });

    assert.equal(response.status, 404);
  } finally {
    await closeServer(server);
  }
});
